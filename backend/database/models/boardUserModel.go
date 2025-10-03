package models

type BoardUsers struct {
	BoardID int `db:"board_id"`
	UserId  int `db:"user_id"`
}
