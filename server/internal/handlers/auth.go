package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"fzsmphone/internal/config"
	"fzsmphone/internal/database"
	mw "fzsmphone/internal/middleware"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	DB  *database.DB
	Cfg *config.Config
}

type discordTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

type discordUser struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	GlobalName    string `json:"global_name"`
	Avatar        string `json:"avatar"`
	Discriminator string `json:"discriminator"`
}

// discordGuildMember represents the Discord API response for a guild member.
type discordGuildMember struct {
	User  *discordUser `json:"user"`
	Roles []string     `json:"roles"`
	Nick  string       `json:"nick"`
}

// POST /api/auth/discord
func (h *AuthHandler) DiscordCallback(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Code == "" {
		mw.Error(w, http.StatusBadRequest, "missing code")
		return
	}

	// Exchange code for token
	data := url.Values{
		"client_id":     {h.Cfg.DiscordClientID},
		"client_secret": {h.Cfg.DiscordSecret},
		"grant_type":    {"authorization_code"},
		"code":          {body.Code},
		"redirect_uri":  {h.Cfg.DiscordRedirect},
	}

	resp, err := http.Post(
		"https://discord.com/api/oauth2/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		mw.Error(w, http.StatusBadGateway, "failed to contact Discord")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		mw.Error(w, http.StatusBadGateway, fmt.Sprintf("Discord token error: %s", string(bodyBytes)))
		return
	}

	var tokenResp discordTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to parse Discord token")
		return
	}

	// Get user info
	req, _ := http.NewRequest("GET", "https://discord.com/api/v10/users/@me", nil)
	req.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		mw.Error(w, http.StatusBadGateway, "failed to get Discord user")
		return
	}
	defer userResp.Body.Close()

	var dUser discordUser
	if err := json.NewDecoder(userResp.Body).Decode(&dUser); err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to parse Discord user")
		return
	}

	// ============================================================
	// Discord Guild Membership + Role Verification
	// If DISCORD_GUILD_ID is configured, verify the user:
	//   1. Is a member of the specified Discord server
	//   2. Has the required role(s) if DISCORD_REQUIRED_ROLE_IDS is set
	// ============================================================
	if h.Cfg.DiscordGuildID != "" {
		failMsg := h.Cfg.DiscordAuthFailMessage

		member, err := h.getGuildMember(dUser.ID, tokenResp.AccessToken)
		if err != nil {
			log.Printf("[WARN] Guild member lookup failed for user %s (%s): %v", dUser.Username, dUser.ID, err)
			mw.Error(w, http.StatusForbidden, failMsg)
			return
		}
		if member == nil {
			log.Printf("[INFO] User %s (%s) denied: not a member of guild %s", dUser.Username, dUser.ID, h.Cfg.DiscordGuildID)
			mw.Error(w, http.StatusForbidden, failMsg)
			return
		}

		log.Printf("[INFO] User %s (%s) is a member of guild %s, roles: %v", dUser.Username, dUser.ID, h.Cfg.DiscordGuildID, member.Roles)

		// Check required roles
		if len(h.Cfg.DiscordRequiredRoleIDs) > 0 {
			if !h.checkRoles(member.Roles) {
				log.Printf("[INFO] User %s (%s) denied: missing required roles. Has: %v, Needs: %v (match=%s)",
					dUser.Username, dUser.ID, member.Roles, h.Cfg.DiscordRequiredRoleIDs, h.Cfg.DiscordRoleMatch)
				mw.Error(w, http.StatusForbidden, failMsg)
				return
			}
			log.Printf("[INFO] User %s (%s) passed role verification", dUser.Username, dUser.ID)
		}
	}

	// Build avatar URL
	avatarURL := ""
	if dUser.Avatar != "" {
		avatarURL = fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png?size=256", dUser.ID, dUser.Avatar)
	}

	displayName := dUser.GlobalName
	if displayName == "" {
		displayName = dUser.Username
	}

	// Upsert user in database
	ctx := context.Background()
	var userID int64
	var role string

	err = h.DB.Pool.QueryRow(ctx, `
		INSERT INTO users (discord_id, username, display_name, avatar_url)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (discord_id) DO UPDATE SET
			username = EXCLUDED.username,
			display_name = EXCLUDED.display_name,
			avatar_url = EXCLUDED.avatar_url,
			updated_at = NOW()
		RETURNING id, role
	`, dUser.ID, dUser.Username, displayName, avatarURL).Scan(&userID, &role)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to save user")
		return
	}

	// Auto-promote configured admin Discord IDs
	if role != "admin" && h.isAdminDiscordID(dUser.ID) {
		role = "admin"
		_, _ = h.DB.Pool.Exec(ctx, `UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1`, userID)
		log.Printf("[INFO] Auto-promoted user %s (%s) to admin", dUser.Username, dUser.ID)
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    userID,
		"discord_id": dUser.ID,
		"role":       role,
		"exp":        time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenStr, err := token.SignedString([]byte(h.Cfg.JWTSecret))
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	mw.JSON(w, http.StatusOK, map[string]interface{}{
		"token": tokenStr,
		"user": map[string]interface{}{
			"id":           userID,
			"discord_id":   dUser.ID,
			"username":     dUser.Username,
			"display_name": displayName,
			"avatar_url":   avatarURL,
			"role":         role,
		},
	})
}

// getGuildMember retrieves guild member info to check membership and roles.
// Tries two methods:
//  1. User OAuth token: GET /users/@me/guilds/{guild_id}/member (需要 guilds.members.read scope，无需 Bot)
//  2. Bot token fallback: GET /guilds/{guild_id}/members/{user_id} (需要 Bot 在服务器中)
//
// Returns nil if the user is not a member.
func (h *AuthHandler) getGuildMember(discordUserID string, userAccessToken string) (*discordGuildMember, error) {
	// 方法一：使用用户的 OAuth token（无需 Bot）
	{
		apiURL := fmt.Sprintf("https://discord.com/api/v10/users/@me/guilds/%s/member", h.Cfg.DiscordGuildID)
		req, err := http.NewRequest("GET", apiURL, nil)
		if err != nil {
			return nil, fmt.Errorf("create request: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+userAccessToken)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("user token API request: %w", err)
		}
		defer resp.Body.Close()

		switch resp.StatusCode {
		case 200:
			var member discordGuildMember
			if err := json.NewDecoder(resp.Body).Decode(&member); err != nil {
				return nil, fmt.Errorf("parse member: %w", err)
			}
			return &member, nil
		case 404:
			return nil, nil // 不是服务器成员
		default:
			bodyBytes, _ := io.ReadAll(resp.Body)
			log.Printf("[WARN] User token guild member check returned %d: %s", resp.StatusCode, string(bodyBytes))
			// 继续尝试方法二
		}
	}

	// 方法二：使用 Bot token（可选回退）
	if h.Cfg.DiscordBotToken != "" {
		apiURL := fmt.Sprintf("https://discord.com/api/v10/guilds/%s/members/%s", h.Cfg.DiscordGuildID, discordUserID)
		req, err := http.NewRequest("GET", apiURL, nil)
		if err != nil {
			return nil, fmt.Errorf("create bot request: %w", err)
		}
		req.Header.Set("Authorization", "Bot "+h.Cfg.DiscordBotToken)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("bot API request: %w", err)
		}
		defer resp.Body.Close()

		switch resp.StatusCode {
		case 200:
			var member discordGuildMember
			if err := json.NewDecoder(resp.Body).Decode(&member); err != nil {
				return nil, fmt.Errorf("parse member: %w", err)
			}
			return &member, nil
		case 404:
			return nil, nil
		default:
			bodyBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("bot API returned %d: %s", resp.StatusCode, string(bodyBytes))
		}
	}

	return nil, fmt.Errorf("无法验证服务器成员身份")
}

// checkRoles verifies the member has the required Discord roles.
// Supports "all" (must have all roles) and "any" (must have at least one role) match modes.
func (h *AuthHandler) checkRoles(memberRoles []string) bool {
	if len(h.Cfg.DiscordRequiredRoleIDs) == 0 {
		return true
	}

	roleSet := make(map[string]bool, len(memberRoles))
	for _, r := range memberRoles {
		roleSet[r] = true
	}

	if h.Cfg.DiscordRoleMatch == "any" {
		// User needs at least one of the required roles
		for _, required := range h.Cfg.DiscordRequiredRoleIDs {
			if roleSet[required] {
				return true
			}
		}
		return false
	}

	// Default: "all" — user must have ALL required roles
	for _, required := range h.Cfg.DiscordRequiredRoleIDs {
		if !roleSet[required] {
			return false
		}
	}
	return true
}

// isAdminDiscordID checks if the given Discord ID is in the configured admin list.
func (h *AuthHandler) isAdminDiscordID(discordID string) bool {
	for _, id := range h.Cfg.DiscordAdminIDs {
		if id == discordID {
			return true
		}
	}
	return false
}

// GET /api/auth/me
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		mw.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var user struct {
		ID          int64  `json:"id"`
		DiscordID   string `json:"discord_id"`
		Username    string `json:"username"`
		DisplayName string `json:"display_name"`
		AvatarURL   string `json:"avatar_url"`
		Role        string `json:"role"`
	}

	err := h.DB.Pool.QueryRow(r.Context(), `
		SELECT id, discord_id, username, display_name, avatar_url, role
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.DiscordID, &user.Username, &user.DisplayName, &user.AvatarURL, &user.Role)
	if err != nil {
		mw.Error(w, http.StatusNotFound, "user not found")
		return
	}

	mw.JSON(w, http.StatusOK, user)
}
