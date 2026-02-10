package store

import (
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/joescharf/fdsn/internal/models"
)

type sourceStore struct {
	db *sqlx.DB
}

// NewSourceStore returns a SourceStore backed by SQLite.
func NewSourceStore(db *sqlx.DB) SourceStore {
	return &sourceStore{db: db}
}

func (s *sourceStore) List() ([]models.Source, error) {
	var sources []models.Source
	err := s.db.Select(&sources, "SELECT * FROM sources ORDER BY name")
	return sources, err
}

func (s *sourceStore) Get(id int64) (*models.Source, error) {
	var src models.Source
	err := s.db.Get(&src, "SELECT * FROM sources WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return &src, nil
}

func (s *sourceStore) Create(src *models.Source) error {
	src.CreatedAt = time.Now()
	src.UpdatedAt = time.Now()
	result, err := s.db.Exec(
		"INSERT INTO sources (name, base_url, description, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		src.Name, src.BaseURL, src.Description, src.Enabled, src.CreatedAt, src.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert source: %w", err)
	}
	src.ID, _ = result.LastInsertId()
	return nil
}

func (s *sourceStore) Update(src *models.Source) error {
	src.UpdatedAt = time.Now()
	_, err := s.db.Exec(
		"UPDATE sources SET name = ?, base_url = ?, description = ?, enabled = ?, updated_at = ? WHERE id = ?",
		src.Name, src.BaseURL, src.Description, src.Enabled, src.UpdatedAt, src.ID,
	)
	return err
}

func (s *sourceStore) Delete(id int64) error {
	_, err := s.db.Exec("DELETE FROM sources WHERE id = ?", id)
	return err
}
