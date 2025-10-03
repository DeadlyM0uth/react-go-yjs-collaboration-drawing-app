package models

import (
	"time"
)

type Board struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	CreatorID int       `db:"creator_id"`
	CreatedAt time.Time `db:"created_at"`
}
