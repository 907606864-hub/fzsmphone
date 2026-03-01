package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"fzsmphone/internal/database"
	mw "fzsmphone/internal/middleware"
)

type AIProxyHandler struct {
	DB *database.DB
}

type aiChatRequest struct {
	Messages    []map[string]interface{} `json:"messages"`
	Model       string                   `json:"model"`
	MaxTokens   int                      `json:"max_tokens"`
	Temperature *float64                 `json:"temperature"`
	Stream      bool                     `json:"stream"`
	ApiUrl      string                   `json:"apiUrl,omitempty"`
	ApiKey      string                   `json:"apiKey,omitempty"`
}

// POST /api/ai/chat
// Proxies AI chat requests to the configured AI API endpoint.
// Reads apiUrl and apiKey from the user's settings in the database.
// Supports both streaming (SSE) and non-streaming responses.
func (h *AIProxyHandler) Chat(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		mw.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Parse request body
	var req aiChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		mw.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(req.Messages) == 0 {
		mw.Error(w, http.StatusBadRequest, "messages are required")
		return
	}

	// Use apiUrl/apiKey from request body first, fallback to app_settings
	apiUrl := req.ApiUrl
	apiKey := req.ApiKey

	if apiUrl == "" || apiKey == "" {
		dbUrl, dbKey, err := h.getAISettings(r, userID)
		if err != nil {
			mw.Error(w, http.StatusInternalServerError, "failed to get AI settings: "+err.Error())
			return
		}
		if apiUrl == "" {
			apiUrl = dbUrl
		}
		if apiKey == "" {
			apiKey = dbKey
		}
	}

	if apiUrl == "" || apiKey == "" {
		mw.Error(w, http.StatusBadRequest, "AI API URL and Key must be configured in settings")
		return
	}

	// Normalize API URL
	apiUrl = normalizeAPIUrl(apiUrl)

	// Build upstream request body
	upstreamBody := map[string]interface{}{
		"model":       req.Model,
		"messages":    req.Messages,
		"max_tokens":  req.MaxTokens,
		"temperature": 0.9,
		"stream":      req.Stream,
	}
	if req.Temperature != nil {
		upstreamBody["temperature"] = *req.Temperature
	}
	if req.MaxTokens == 0 {
		upstreamBody["max_tokens"] = 1000
	}

	bodyBytes, _ := json.Marshal(upstreamBody)

	// Create upstream request
	client := &http.Client{Timeout: 120 * time.Second}
	upReq, err := http.NewRequestWithContext(r.Context(), "POST", apiUrl, bytes.NewReader(bodyBytes))
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to create upstream request")
		return
	}
	upReq.Header.Set("Content-Type", "application/json")
	upReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(upReq)
	if err != nil {
		mw.Error(w, http.StatusBadGateway, "AI API request failed: "+err.Error())
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Forward error from upstream
		errorBody, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(errorBody)
		return
	}

	if req.Stream {
		// Stream: pipe SSE response directly
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			mw.Error(w, http.StatusInternalServerError, "streaming not supported")
			return
		}

		buf := make([]byte, 4096)
		for {
			n, err := resp.Body.Read(buf)
			if n > 0 {
				w.Write(buf[:n])
				flusher.Flush()
			}
			if err != nil {
				break
			}
		}
	} else {
		// Non-stream: forward JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		io.Copy(w, resp.Body)
	}
}

// getAISettings retrieves apiUrl and apiKey from the app_settings table
func (h *AIProxyHandler) getAISettings(r *http.Request, userID int64) (string, string, error) {
	_ = userID // settings are global for now

	var apiUrl, apiKey string

	// Try to get apiUrl
	var urlValue []byte
	err := h.DB.Pool.QueryRow(r.Context(),
		`SELECT value FROM app_settings WHERE key = 'apiUrl'`,
	).Scan(&urlValue)
	if err == nil {
		json.Unmarshal(urlValue, &apiUrl)
	}

	// Try to get apiKey
	var keyValue []byte
	err = h.DB.Pool.QueryRow(r.Context(),
		`SELECT value FROM app_settings WHERE key = 'apiKey'`,
	).Scan(&keyValue)
	if err == nil {
		json.Unmarshal(keyValue, &apiKey)
	}

	return apiUrl, apiKey, nil
}

// normalizeAPIUrl ensures the URL ends with /chat/completions
func normalizeAPIUrl(url string) string {
	if url == "" {
		return url
	}
	if strings.HasSuffix(url, "/chat/completions") {
		return url
	}
	if strings.HasSuffix(url, "/v1") {
		return url + "/chat/completions"
	}
	if idx := strings.Index(url, "/v1"); idx >= 0 {
		return url[:idx+3] + "/chat/completions"
	}
	return strings.TrimRight(url, "/") + "/v1/chat/completions"
}
