package main

import (
	"backend/api"
	"backend/database"
	"backend/env"
	"backend/middleware"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func init() {
	env.LoadEnvVariables()

	database.InitDatabaseConnection()
	database.MigrateDataBase()
}

func main() {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // or your frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.POST("/api/signup", api.Signup)
	router.POST("/api/login", api.Login)
	router.GET("/api/validate", middleware.RequireAuth, api.Validate)
	router.GET("/api/boards/me", middleware.RequireAuth, api.MeBoards)
	router.POST("/api/boards", middleware.RequireAuth, api.CreateBoard)
	router.DELETE("/api/boards/:id", middleware.RequireAuth, api.DeleteBoard)
	router.POST("/api/boards/invite", middleware.RequireAuth, api.InviteToBoard)
	router.POST("/api/boards/remove-user", middleware.RequireAuth, api.RemoveUserFromBoard)
	router.GET("/api/boards/:id/can-access", middleware.RequireAuth, api.CanAccessBoard)
	router.GET("/api/boards/invited", middleware.RequireAuth, api.InvitedBoards)
	router.POST("/api/logout", api.Logout)
	router.GET("/api/boards/:id/users", middleware.RequireAuth, api.BoardUsers)
	router.POST("/api/boards/leave", middleware.RequireAuth, api.LeaveBoard)

	router.Run(os.Getenv("PORT")) // listen and serve on 0.0.0.0:8080
}
