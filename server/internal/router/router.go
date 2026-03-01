package router

import (
	"net/http"

	"fzsmphone/internal/config"
	"fzsmphone/internal/database"
	"fzsmphone/internal/handlers"
	"fzsmphone/internal/middleware"
	"fzsmphone/internal/ws"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(cfg *config.Config, db *database.DB, hub *ws.Hub) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.Recoverer)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.FrontendURL, "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Handlers
	authH := &handlers.AuthHandler{DB: db, Cfg: cfg}
	charH := &handlers.CharacterHandler{DB: db}
	convH := &handlers.ConversationHandler{DB: db}
	postH := &handlers.PostHandler{DB: db}
	diaryH := &handlers.DiaryHandler{DB: db}
	weiboH := &handlers.WeiboHandler{DB: db}
	momentH := &handlers.MomentHandler{DB: db}
	userH := &handlers.UserHandler{DB: db}
	personaH := &handlers.PersonaHandler{DB: db}
	wbookH := &handlers.WorldBookHandler{DB: db}
	settingsH := &handlers.SettingsHandler{DB: db}
	featuresH := &handlers.FeaturesHandler{DB: db}
	restH := &handlers.RestaurantHandler{DB: db}
	orderH := &handlers.OrderHandler{DB: db}
	presetH := &handlers.PresetHandler{DB: db}
	callH := &handlers.CallHandler{DB: db}
	smsH := &handlers.SmsHandler{DB: db}
	walletH := &handlers.WalletHandler{DB: db}
	gameH := &handlers.GameHandler{DB: db}
	aiProxyH := &handlers.AIProxyHandler{DB: db}

	// Public routes
	r.Route("/api", func(r chi.Router) {
		// Auth (public)
		r.Post("/auth/discord", authH.DiscordCallback)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg.JWTSecret))

			// Auth
			r.Get("/auth/me", authH.GetMe)

			// WebSocket
			r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
				userID, ok := middleware.GetUserID(r.Context())
				if !ok {
					http.Error(w, "unauthorized", http.StatusUnauthorized)
					return
				}
				hub.HandleWS(w, r, userID)
			})

			// === Chat ===
			r.Route("/characters", func(r chi.Router) {
				r.Get("/", charH.List)
				r.Post("/", charH.Create)
				r.Get("/{id}", charH.Get)
				r.Put("/{id}", charH.Update)
				r.Delete("/{id}", charH.Delete)
			})

			r.Route("/conversations", func(r chi.Router) {
				r.Get("/", convH.List)
				r.Post("/", convH.Create)
				r.Get("/{id}", convH.Get)
				r.Delete("/{id}", convH.Delete)
				r.Get("/{id}/messages", convH.ListMessages)
				r.Post("/{id}/messages", convH.CreateMessage)
			})

			// === Social ===
			r.Route("/posts", func(r chi.Router) {
				r.Get("/", postH.List)
				r.Post("/", postH.Create)
				r.Get("/{id}", postH.Get)
				r.Put("/{id}", postH.Update)
				r.Delete("/{id}", postH.Delete)
				r.Get("/{id}/comments", postH.ListComments)
				r.Post("/{id}/comments", postH.CreateComment)
			})

			r.Route("/weibo", func(r chi.Router) {
				r.Get("/", weiboH.List)
				r.Post("/", weiboH.Create)
				r.Get("/{id}", weiboH.Get)
				r.Delete("/{id}", weiboH.Delete)
			})

			r.Route("/moments", func(r chi.Router) {
				r.Get("/", momentH.List)
				r.Post("/", momentH.Create)
				r.Delete("/{id}", momentH.Delete)
			})

			// === Lifestyle ===
			r.Route("/restaurants", func(r chi.Router) {
				r.Get("/", restH.List)
				r.Post("/", restH.Create)
				r.Get("/{id}", restH.Get)
			})

			r.Route("/orders", func(r chi.Router) {
				r.Get("/", orderH.List)
				r.Post("/", orderH.Create)
				r.Get("/{id}", orderH.Get)
				r.Patch("/{id}/status", orderH.UpdateStatus)
			})

			// === Tools ===
			r.Route("/diaries", func(r chi.Router) {
				r.Get("/", diaryH.List)
				r.Post("/", diaryH.Create)
				r.Get("/{id}", diaryH.Get)
				r.Put("/{id}", diaryH.Update)
				r.Delete("/{id}", diaryH.Delete)
			})

			r.Route("/personas", func(r chi.Router) {
				r.Get("/", personaH.List)
				r.Post("/", personaH.Create)
				r.Put("/{id}", personaH.Update)
				r.Delete("/{id}", personaH.Delete)
			})

			r.Route("/worldbook", func(r chi.Router) {
				r.Get("/", wbookH.List)
				r.Post("/", wbookH.Create)
				r.Get("/{id}", wbookH.Get)
				r.Put("/{id}", wbookH.Update)
				r.Delete("/{id}", wbookH.Delete)
			})

			// === Presets ===
			r.Route("/presets", func(r chi.Router) {
				r.Get("/", presetH.List)
				r.Post("/", presetH.Create)
				r.Get("/{id}", presetH.Get)
				r.Put("/{id}", presetH.Update)
				r.Delete("/{id}", presetH.Delete)
			})

			// === Phone / Call Records ===
			r.Route("/calls", func(r chi.Router) {
				r.Get("/", callH.List)
				r.Post("/", callH.Create)
				r.Delete("/", callH.Clear)
				r.Delete("/{id}", callH.Delete)
			})

			// === SMS ===
			r.Route("/sms", func(r chi.Router) {
				r.Route("/threads", func(r chi.Router) {
					r.Get("/", smsH.ListThreads)
					r.Post("/", smsH.CreateThread)
					r.Delete("/{id}", smsH.DeleteThread)
					r.Get("/{id}/messages", smsH.ListMessages)
					r.Post("/{id}/messages", smsH.CreateMessage)
				})
			})

			// === Wallet ===
			r.Route("/wallet", func(r chi.Router) {
				r.Get("/", walletH.Get)
				r.Put("/balance", walletH.SetBalance)
				r.Get("/transactions", walletH.ListTransactions)
				r.Post("/transaction", walletH.CreateTransaction)
			})

			// === Games ===
			r.Route("/games", func(r chi.Router) {
				r.Get("/records", gameH.ListRecords)
				r.Post("/records", gameH.CreateRecord)
				r.Delete("/records", gameH.ClearRecords)
			})

			// === Settings ===
			r.Route("/settings", func(r chi.Router) {
				r.Get("/", settingsH.Get)
				r.Put("/", settingsH.Update)
			})

			// === Feature Flags ===
			r.Route("/features", func(r chi.Router) {
				r.Get("/", featuresH.Get)
				r.Put("/", featuresH.Update)
			})

			// === Users ===
			r.Get("/users/me", authH.GetMe)
			r.Route("/users", func(r chi.Router) {
				r.Get("/", userH.List)
				r.Get("/{id}", userH.Get)
				r.Patch("/{id}/role", userH.UpdateRole)
				r.Post("/{id}/ban", userH.Ban)
				r.Post("/{id}/unban", userH.Unban)
			})

			// === AI Proxy ===
			r.Post("/ai/chat", aiProxyH.Chat)
			r.Post("/ai/models", aiProxyH.Models)
		})
	})

	// Serve frontend static files in production
	if !cfg.IsDev() {
		fileServer(r, "./dist")
	}

	return r
}

// Placeholder handlers for routes not yet fully implemented
func placeholderList(resource string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]interface{}{
			"data":    []interface{}{},
			"message": resource + " list - not yet implemented",
		})
	}
}

func placeholderGet(resource string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]interface{}{
			"data":    nil,
			"message": resource + " get - not yet implemented",
		})
	}
}

func placeholderCreate(resource string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusCreated, map[string]interface{}{
			"message": resource + " create - not yet implemented",
		})
	}
}

func placeholderUpdate(resource string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]interface{}{
			"message": resource + " update - not yet implemented",
		})
	}
}

func placeholderDelete(resource string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]interface{}{
			"message": resource + " delete - not yet implemented",
		})
	}
}

func fileServer(r chi.Router, root string) {
	fs := http.FileServer(http.Dir(root))

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		// Try to serve the file directly
		if _, err := http.Dir(root).Open(r.URL.Path); err != nil {
			// Fall back to index.html for SPA routing
			r.URL.Path = "/"
		}
		fs.ServeHTTP(w, r)
	})
}
