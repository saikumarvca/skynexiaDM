package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	appmiddleware "github.com/saikumarvca/skynexiaDM/backend/internal/middleware"
	"github.com/saikumarvca/skynexiaDM/backend/internal/repository"
	"github.com/saikumarvca/skynexiaDM/backend/internal/service"
)

type AuthHandler struct {
	Users *repository.UserRepository
	Auth  *service.AuthService
}

func NewAuthHandler(
	users *repository.UserRepository,
	auth *service.AuthService,
) *AuthHandler {
	return &AuthHandler{
		Users: users,
		Auth:  auth,
	}
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "invalid request",
		})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Name == "" || req.Email == "" || len(req.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "name, email and password of at least 8 characters are required",
		})
		return
	}

	existing, err := h.Users.FindByEmail(r.Context(), req.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to check user",
		})
		return
	}

	if existing != nil {
		writeJSON(w, http.StatusConflict, map[string]interface{}{
			"success": false,
			"message": "email already registered",
		})
		return
	}

	passwordHash, err := service.HashPassword(req.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to create password",
		})
		return
	}

	user, err := h.Users.Create(
		r.Context(),
		req.Name,
		req.Email,
		passwordHash,
	)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to create user",
		})
		return
	}

	token, err := h.Auth.GenerateToken(user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to generate token",
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"token":   token,
		"user":    user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "invalid request",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, err := h.Users.FindByEmail(r.Context(), req.Email)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to login",
		})
		return
	}

	if user == nil || !service.CheckPassword(user.PasswordHash, req.Password) {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"success": false,
			"message": "invalid email or password",
		})
		return
	}

	if !user.IsActive {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{
			"success": false,
			"message": "account is inactive",
		})
		return
	}

	token, err := h.Auth.GenerateToken(user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to generate token",
		})
		return
	}

	user.PasswordHash = ""

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"token":   token,
		"user":    user,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := appmiddleware.GetUserID(r.Context())

	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"success": false,
			"message": "unauthorized",
		})
		return
	}

	user, err := h.Users.FindByID(r.Context(), userID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "unable to load user",
		})
		return
	}

	if user == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"message": "user not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"user":    user,
	})
}
