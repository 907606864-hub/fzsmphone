package models

import "time"

// User represents a registered user
type User struct {
	ID          int64     `json:"id"`
	DiscordID   string    `json:"discord_id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	AvatarURL   string    `json:"avatar_url"`
	Role        string    `json:"role"`
	Settings    JSON      `json:"settings"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Character represents an AI chat character
type Character struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	Name         string    `json:"name"`
	AvatarURL    string    `json:"avatar_url"`
	Description  string    `json:"description"`
	Personality  string    `json:"personality"`
	SystemPrompt string    `json:"system_prompt"`
	Greeting     string    `json:"greeting"`
	IsPublic     bool      `json:"is_public"`
	Tags         []string  `json:"tags"`
	Extra        JSON      `json:"extra"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Conversation represents a chat conversation
type Conversation struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	CharacterID int64     `json:"character_id"`
	Title       string    `json:"title"`
	IsGroup     bool      `json:"is_group"`
	LastMessage string    `json:"last_message"`
	LastAt      time.Time `json:"last_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Joined fields
	Character *Character `json:"character,omitempty"`
}

// Message represents a single chat message
type Message struct {
	ID             int64     `json:"id"`
	ConversationID int64     `json:"conversation_id"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	MsgType        string    `json:"msg_type"`
	Extra          JSON      `json:"extra"`
	CreatedAt      time.Time `json:"created_at"`
}

// Post represents a forum post
type Post struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Board     string    `json:"board"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Images    []string  `json:"images"`
	Likes     int       `json:"likes"`
	Comments  int       `json:"comments"`
	Pinned    bool      `json:"pinned"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Joined fields
	Author *User `json:"author,omitempty"`
}

// Comment represents a post comment
type Comment struct {
	ID        int64     `json:"id"`
	PostID    int64     `json:"post_id"`
	UserID    int64     `json:"user_id"`
	ParentID  *int64    `json:"parent_id,omitempty"`
	Content   string    `json:"content"`
	Likes     int       `json:"likes"`
	CreatedAt time.Time `json:"created_at"`

	Author *User `json:"author,omitempty"`
}

// WeiboPost represents a weibo-style microblog post
type WeiboPost struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Content   string    `json:"content"`
	Images    []string  `json:"images"`
	Likes     int       `json:"likes"`
	Reposts   int       `json:"reposts"`
	Comments  int       `json:"comments"`
	IsHot     bool      `json:"is_hot"`
	CreatedAt time.Time `json:"created_at"`

	Author *User `json:"author,omitempty"`
}

// Moment represents a QZone/moments post
type Moment struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	Content    string    `json:"content"`
	Images     []string  `json:"images"`
	Location   string    `json:"location"`
	Visibility string    `json:"visibility"`
	Likes      int       `json:"likes"`
	CreatedAt  time.Time `json:"created_at"`

	Author *User `json:"author,omitempty"`
}

// Diary represents a diary entry
type Diary struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Mood      string    `json:"mood"`
	Weather   string    `json:"weather"`
	Tags      []string  `json:"tags"`
	IsPrivate bool      `json:"is_private"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Restaurant for takeaway system
type Restaurant struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	ImageURL     string    `json:"image_url"`
	Rating       float64   `json:"rating"`
	DeliveryTime string    `json:"delivery_time"`
	MinOrder     float64   `json:"min_order"`
	Items        JSON      `json:"items"`
	CreatedAt    time.Time `json:"created_at"`
}

// Order for takeaway system
type Order struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	RestaurantID int64     `json:"restaurant_id"`
	Items        JSON      `json:"items"`
	Total        float64   `json:"total"`
	Status       string    `json:"status"`
	Address      string    `json:"address"`
	Note         string    `json:"note"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Restaurant *Restaurant `json:"restaurant,omitempty"`
}

// UserPersona for user persona system
type UserPersona struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	AvatarURL   string    `json:"avatar_url"`
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// WorldBookEntry for world book system
type WorldBookEntry struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Key       string    `json:"key"`
	Content   string    `json:"content"`
	Keywords  []string  `json:"keywords"`
	IsEnabled bool      `json:"is_enabled"`
	Priority  int       `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// JSON is a raw JSON type for flexible storage
type JSON = []byte

// Pagination helpers
type PaginationParams struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
}

func (p *PaginationParams) Offset() int {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PerPage < 1 {
		p.PerPage = 20
	}
	if p.PerPage > 100 {
		p.PerPage = 100
	}
	return (p.Page - 1) * p.PerPage
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	Total      int         `json:"total"`
	TotalPages int         `json:"total_pages"`
}
