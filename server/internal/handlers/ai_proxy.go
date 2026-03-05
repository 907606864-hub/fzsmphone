package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
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
		upstreamBody["max_tokens"] = 4000
	}

	bodyBytes, _ := json.Marshal(upstreamBody)

	log.Printf("[AIProxy] user=%d model=%s stream=%v url=%s", userID, req.Model, req.Stream, apiUrl)

	// Create upstream request with an INDEPENDENT context (not tied to r.Context()).
	// This prevents reverse proxies (nginx/Cloudflare) from cancelling the upstream
	// request when they time out the client-facing connection.
	upstreamTimeout := 300 * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), upstreamTimeout)
	defer cancel()

	// Still respect explicit client abort for non-streaming requests
	if !req.Stream {
		go func() {
			select {
			case <-r.Context().Done():
				cancel()
			case <-ctx.Done():
			}
		}()
	}

	client := &http.Client{}
	upReq, err := http.NewRequestWithContext(ctx, "POST", apiUrl, bytes.NewReader(bodyBytes))
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to create upstream request")
		return
	}
	upReq.Header.Set("Content-Type", "application/json")
	upReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(upReq)
	if err != nil {
		log.Printf("[AIProxy] upstream error: %v", err)
		mw.Error(w, http.StatusBadGateway, fmt.Sprintf("AI API request failed: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Forward error from upstream
		errorBody, _ := io.ReadAll(resp.Body)
		log.Printf("[AIProxy] upstream returned status %d: %s", resp.StatusCode, string(errorBody))
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
		w.Header().Set("X-Accel-Buffering", "no") // Tell nginx not to buffer SSE

		flusher, ok := w.(http.Flusher)
		if !ok {
			mw.Error(w, http.StatusInternalServerError, "streaming not supported")
			return
		}

		buf := make([]byte, 4096)
		for {
			n, readErr := resp.Body.Read(buf)
			if n > 0 {
				if _, writeErr := w.Write(buf[:n]); writeErr != nil {
					log.Printf("[AIProxy] client write error: %v", writeErr)
					return
				}
				flusher.Flush()
			}
			if readErr != nil {
				if readErr != io.EOF {
					log.Printf("[AIProxy] upstream read error: %v", readErr)
				}
				break
			}
		}
		log.Printf("[AIProxy] stream completed for user=%d", userID)
	} else {
		// Non-stream: forward JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		n, err := io.Copy(w, resp.Body)
		log.Printf("[AIProxy] non-stream completed for user=%d, bytes=%d, err=%v", userID, n, err)
	}
}

// POST /api/ai/models
// Proxies model-list requests to the configured AI API endpoint.
func (h *AIProxyHandler) Models(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		mw.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		ApiUrl string `json:"apiUrl,omitempty"`
		ApiKey string `json:"apiKey,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		mw.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

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

	modelsEndpoint := deriveModelsUrl(apiUrl)

	client := &http.Client{Timeout: 15 * time.Second}
	upReq, err := http.NewRequestWithContext(r.Context(), "GET", modelsEndpoint, nil)
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to create upstream request")
		return
	}
	upReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(upReq)
	if err != nil {
		mw.Error(w, http.StatusBadGateway, "AI API request failed: "+err.Error())
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
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
	if strings.Contains(url, "/chat/completions") {
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

// deriveModelsUrl converts an API URL to the corresponding /models endpoint
func deriveModelsUrl(url string) string {
	if strings.Contains(url, "/chat/completions") {
		return strings.Replace(url, "/chat/completions", "/models", 1)
	}
	if strings.HasSuffix(url, "/v1") {
		return url + "/models"
	}
	if idx := strings.Index(url, "/v1"); idx >= 0 {
		return url[:idx+3] + "/models"
	}
	return strings.TrimRight(url, "/") + "/v1/models"
}

// POST /api/ai/image
// Proxies image generation requests to avoid CORS issues on frontend.
// Transparently passes the response body back, whether it's JSON, ZIP, or an image.
func (h *AIProxyHandler) ImageProxy(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		mw.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		TargetUrl string                 `json:"targetUrl"`
		ApiKey    string                 `json:"apiKey"`
		Headers   map[string]string      `json:"headers"`
		Body      map[string]interface{} `json:"body"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		mw.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TargetUrl == "" {
		mw.Error(w, http.StatusBadRequest, "targetUrl is required")
		return
	}

	// Basic URL validation
	if !strings.HasPrefix(req.TargetUrl, "http://") && !strings.HasPrefix(req.TargetUrl, "https://") {
		mw.Error(w, http.StatusBadRequest, "invalid targetUrl scheme")
		return
	}

	// Image generation can take a long time, use a larger timeout
	upstreamTimeout := 120 * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), upstreamTimeout)
	defer cancel()

	// Respect explicit client abort
	go func() {
		select {
		case <-r.Context().Done():
			cancel()
		case <-ctx.Done():
		}
	}()

	bodyBytes, _ := json.Marshal(req.Body)
	upReq, err := http.NewRequestWithContext(ctx, "POST", req.TargetUrl, bytes.NewReader(bodyBytes))
	if err != nil {
		mw.Error(w, http.StatusInternalServerError, "failed to create upstream request")
		return
	}

	// Set headers
	upReq.Header.Set("Content-Type", "application/json")
	if req.ApiKey != "" {
		upReq.Header.Set("Authorization", "Bearer "+req.ApiKey)
	}
	for k, v := range req.Headers {
		upReq.Header.Set(k, v)
	}

	log.Printf("[AIProxy] image gen request from user=%d to url=%s", userID, req.TargetUrl)

	client := &http.Client{}
	resp, err := client.Do(upReq)
	if err != nil {
		log.Printf("[AIProxy] image upstream error: %v", err)
		mw.Error(w, http.StatusBadGateway, fmt.Sprintf("Image API request failed: %v", err))
		return
	}
	defer resp.Body.Close()

	// Copy all headers from upstream response to client response, especially Content-Type
	for k, v := range resp.Header {
		w.Header()[k] = v
	}

	w.WriteHeader(resp.StatusCode)

	// Stream the response back
	n, err := io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("[AIProxy] stream image chunks to client err: %v", err)
	} else {
		log.Printf("[AIProxy] image stream completed for user=%d, bytes=%d", userID, n)
	}
}

