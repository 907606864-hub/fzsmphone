package handlers

import (
	"encoding/json"
	"net/http"

	"fzsmphone/internal/database"
	mw "fzsmphone/internal/middleware"

	"github.com/jackc/pgx/v5"
)

// FeatureFlags maps feature IDs to enabled/disabled status.
// If a feature is not in the map, it defaults to enabled.
type FeatureFlags map[string]bool

// AllFeatures defines all known feature IDs with display names (for admin UI).
// This list is the single source of truth.
var AllFeatures = []FeatureDefinition{
	{ID: "chat", Name: "聊天", Category: "聊天"},
	{ID: "characters", Name: "角色管理", Category: "聊天"},
	{ID: "personas", Name: "人设", Category: "聊天"},
	{ID: "worldbook", Name: "世界书", Category: "聊天"},
	{ID: "preset", Name: "预设", Category: "聊天"},

	{ID: "forum", Name: "论坛", Category: "社交"},
	{ID: "weibo", Name: "微博", Category: "社交"},
	{ID: "qzone", Name: "朋友圈", Category: "社交"},
	{ID: "couple_space", Name: "情侣空间", Category: "社交"},

	{ID: "takeaway", Name: "外卖", Category: "生活"},
	{ID: "shopping", Name: "购物", Category: "生活"},
	{ID: "wallet", Name: "钱包", Category: "生活"},

	{ID: "music", Name: "音乐", Category: "娱乐"},
	{ID: "live", Name: "直播", Category: "娱乐"},
	{ID: "games", Name: "游戏", Category: "娱乐"},
	{ID: "casino", Name: "赌场", Category: "娱乐"},
	{ID: "mini_theater", Name: "影院", Category: "娱乐"},

	{ID: "diary", Name: "日记", Category: "工具"},
	{ID: "phone", Name: "电话", Category: "工具"},
	{ID: "sms", Name: "短信", Category: "工具"},
	{ID: "stock", Name: "股票", Category: "工具"},
	{ID: "currency", Name: "汇率", Category: "工具"},
	{ID: "voice_call", Name: "语音通话", Category: "工具"},
	{ID: "video_call", Name: "视频通话", Category: "工具"},
	{ID: "phone_peek", Name: "偷看手机", Category: "工具"},
	{ID: "reverse_phone_peek", Name: "反偷看手机", Category: "工具"},
	{ID: "offline_date", Name: "线下约会", Category: "工具"},
}

type FeatureDefinition struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
}

type FeaturesHandler struct {
	DB *database.DB
}

const featuresSettingKey = "enabled_features"

// GET /api/features
// Returns the feature definitions + their enabled status
func (h *FeaturesHandler) Get(w http.ResponseWriter, r *http.Request) {
	flags, err := h.loadFlags(r)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to load features")
		return
	}

	type featureItem struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Category string `json:"category"`
		Enabled  bool   `json:"enabled"`
	}

	items := make([]featureItem, 0, len(AllFeatures))
	for _, f := range AllFeatures {
		enabled, ok := flags[f.ID]
		if !ok {
			enabled = true // default: enabled
		}
		items = append(items, featureItem{
			ID:       f.ID,
			Name:     f.Name,
			Category: f.Category,
			Enabled:  enabled,
		})
	}

	mw.JSON(w, http.StatusOK, map[string]interface{}{"data": items})
}

// PUT /api/features  (admin only)
// Accepts a JSON object: { "chat": true, "forum": false, ... }
func (h *FeaturesHandler) Update(w http.ResponseWriter, r *http.Request) {
	// Check admin
	userID, _ := mw.GetUserID(r.Context())
	var role string
	err := h.DB.Pool.QueryRow(r.Context(), `SELECT role FROM users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to check role")
		return
	}
	if role != "admin" {
		mw.Error(w, http.StatusForbidden, "admin access required")
		return
	}

	var body FeatureFlags
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		mw.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate: only allow known feature IDs
	known := make(map[string]bool, len(AllFeatures))
	for _, f := range AllFeatures {
		known[f.ID] = true
	}
	for k := range body {
		if !known[k] {
			mw.Error(w, http.StatusBadRequest, "unknown feature: "+k)
			return
		}
	}

	// Merge with existing flags
	existing, err := h.loadFlags(r)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to load existing features")
		return
	}
	for k, v := range body {
		existing[k] = v
	}

	valueBytes, err := json.Marshal(existing)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to marshal features")
		return
	}

	_, err = h.DB.Pool.Exec(r.Context(), `
		INSERT INTO app_settings (key, value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
	`, featuresSettingKey, valueBytes)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to save features")
		return
	}

	mw.JSON(w, http.StatusOK, map[string]string{"message": "features updated"})
}

func (h *FeaturesHandler) loadFlags(r *http.Request) (FeatureFlags, error) {
	var valueBytes []byte
	err := h.DB.Pool.QueryRow(r.Context(), `
		SELECT value FROM app_settings WHERE key = $1
	`, featuresSettingKey).Scan(&valueBytes)
	if err == pgx.ErrNoRows {
		return FeatureFlags{}, nil
	}
	if err != nil {
		return nil, err
	}

	var flags FeatureFlags
	if err := json.Unmarshal(valueBytes, &flags); err != nil {
		return nil, err
	}
	return flags, nil
}
