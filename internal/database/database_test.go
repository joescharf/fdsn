package database

import (
	"os"
	"testing"
)

func TestNewAndMigrate(t *testing.T) {
	tmp := t.TempDir()
	dbPath := tmp + "/test.db"

	db, err := New(dbPath)
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	defer db.Close()

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Fatal("database file was not created")
	}

	if err := Migrate(db); err != nil {
		t.Fatalf("Migrate: %v", err)
	}

	// Verify tables exist
	tables := []string{"sources", "networks", "stations", "channels", "availability"}
	for _, table := range tables {
		var count int
		err := db.Get(&count, "SELECT COUNT(*) FROM "+table)
		if err != nil {
			t.Errorf("table %s not found: %v", table, err)
		}
	}
}
