package api

import (
	"backend/database"
	"backend/database/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func MeBoards(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userModel := user.(models.User)

	var boards []models.Board
	err := database.DB.Select(&boards, "SELECT * FROM boards WHERE creator_id = $1", userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch boards"})
		return
	}

	c.JSON(http.StatusOK, boards)
}

func CreateBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	board := models.Board{
		Name:      req.Name,
		CreatorID: userModel.ID,
		CreatedAt: time.Now(),
	}

	// Получаем id через RETURNING
	err := database.DB.QueryRowx(
		`INSERT INTO boards (name, creator_id, created_at) VALUES ($1, $2, $3) RETURNING id`,
		board.Name, board.CreatorID, board.CreatedAt,
	).Scan(&board.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create board"})
		return
	}

	c.JSON(http.StatusOK, board)
}

func DeleteBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	boardID := c.Param("id")
	if boardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID is required"})
		return
	}

	// Проверяем, принадлежит ли доска пользователю
	var count int
	err := database.DB.Get(&count, "SELECT COUNT(*) FROM boards WHERE id = $1 AND creator_id = $2", boardID, userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check board ownership"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to delete this board"})
		return
	}

	// Удаляем доску
	_, err = database.DB.Exec("DELETE FROM boards WHERE id = $1", boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete board"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Board deleted"})
}

func InviteToBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	var req struct {
		BoardID int    `json:"board_id" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID and valid email are required"})
		return
	}

	fmt.Println(req.BoardID, req.Email)

	// Check if the requester is the board owner
	var count int
	err := database.DB.Get(&count, "SELECT COUNT(*) FROM boards WHERE id = $1 AND creator_id = $2", req.BoardID, userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check board ownership"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to invite users to this board"})
		return
	}

	// Find the user to invite
	var invitee models.User
	err = database.DB.Get(&invitee, "SELECT id, email FROM users WHERE email = $1", req.Email)
	if err != nil || invitee.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Add to board_users table
	_, err = database.DB.Exec(
		"INSERT INTO board_user (board_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		req.BoardID, invitee.ID,
	)
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to invite user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User invited to board"})
}

func RemoveUserFromBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	var req struct {
		BoardID int `json:"board_id" binding:"required"`
		UserID  int `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID and User ID are required"})
		return
	}

	// Check if the requester is the board owner
	var count int
	err := database.DB.Get(&count, "SELECT COUNT(*) FROM boards WHERE id = $1 AND creator_id = $2", req.BoardID, userModel.ID)
	if err != nil {
		fmt.Println("PENAR", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check board ownership"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to remove users from this board"})
		return
	}

	// Prevent owner from removing themselves
	if req.UserID == userModel.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Owner cannot remove themselves from the board"})
		return
	}

	// Remove user from board_users table
	_, err = database.DB.Exec(
		"DELETE FROM board_user WHERE board_id = $1 AND user_id = $2",
		req.BoardID, req.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user from board"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User removed from board"})
}

func CanAccessBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	boardID := c.Param("id")
	if boardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID is required"})
		return
	}

	// Check if user is the owner or in board_users
	var count int
	err := database.DB.Get(&count, `
        SELECT COUNT(*) FROM boards 
        WHERE id = $1 AND creator_id = $2
    `, boardID, userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check board ownership"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusOK, gin.H{"access": true})
		return
	}

	err = database.DB.Get(&count, `
        SELECT COUNT(*) FROM board_users 
        WHERE board_id = $1 AND user_id = $2
    `, boardID, userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check board access"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusOK, gin.H{"access": true})
		return
	}

	c.JSON(http.StatusForbidden, gin.H{"access": false, "error": "No access to this board"})
}

func InvitedBoards(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	var boards []models.Board
	err := database.DB.Select(&boards, `
        SELECT b.* FROM boards b
        JOIN board_user bu ON b.id = bu.board_id
        WHERE bu.user_id = $1
    `, userModel.ID)
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invited boards"})
		return
	}

	c.JSON(http.StatusOK, boards)
}

func BoardUsers(c *gin.Context) {
	boardID := c.Param("id")
	if boardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID is required"})
		return
	}

	// Получаем владельца доски
	var owner models.User
	err := database.DB.Get(&owner, `
        SELECT u.id, u.username, u.email
        FROM users u
        JOIN boards b ON b.creator_id = u.id
        WHERE b.id = $1
    `, boardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch board owner"})
		return
	}

	// Получаем приглашённых пользователей (кроме владельца)
	var invited []models.User
	err = database.DB.Select(&invited, `
        SELECT u.id, u.username, u.email
        FROM users u
        JOIN board_user bu ON bu.user_id = u.id
        WHERE bu.board_id = $1 AND u.id != $2
    `, boardID, owner.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invited users"})
		return
	}

	// Возвращаем владельца и приглашённых
	c.JSON(http.StatusOK, gin.H{
		"owner":   owner,
		"invited": invited,
	})
}

func LeaveBoard(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userModel := user.(models.User)

	var req struct {
		BoardID int `json:"board_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID is required"})
		return
	}

	// Check if user is the owner
	var count int
	err := database.DB.Get(&count, "SELECT COUNT(*) FROM boards WHERE id = $1 AND creator_id = $2", req.BoardID, userModel.ID)
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if count > 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Owner cannot leave their own board"})
		return
	}

	// Remove user from board_user table
	_, err = database.DB.Exec(
		"DELETE FROM board_user WHERE board_id = $1 AND user_id = $2",
		req.BoardID, userModel.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave board"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left the board"})
}
