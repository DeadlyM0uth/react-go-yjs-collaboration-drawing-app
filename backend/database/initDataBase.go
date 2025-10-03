package database

import (
	"log"
	"os"

	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB

func InitDatabaseConnection() {
	db, err := sqlx.Connect("postgres", os.Getenv("DSN"))
	if err != nil {
		log.Fatalln(err)
	}
	DB = db
}
