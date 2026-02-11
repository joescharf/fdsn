package cmd

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/spf13/viper"

	"github.com/joescharf/fdsn/internal/database"
	"github.com/joescharf/fdsn/internal/store"
)

func TestBrowserCmd(t *testing.T) {
	url := "http://localhost:8080"
	cmd := browserCmd(url)

	if cmd == nil {
		t.Fatalf("browserCmd returned nil on %s", runtime.GOOS)
	}

	switch runtime.GOOS {
	case "darwin":
		if cmd.Path == "" || cmd.Args[0] != "open" || cmd.Args[1] != url {
			t.Errorf("expected open %s, got %v", url, cmd.Args)
		}
	case "linux":
		if cmd.Args[0] != "xdg-open" || cmd.Args[1] != url {
			t.Errorf("expected xdg-open %s, got %v", url, cmd.Args)
		}
	case "windows":
		if cmd.Args[0] != "cmd" || cmd.Args[1] != "/c" || cmd.Args[2] != "start" || cmd.Args[3] != url {
			t.Errorf("expected cmd /c start %s, got %v", url, cmd.Args)
		}
	}
}

func TestSeedSources_EmptyDB(t *testing.T) {
	// Set up a temp database
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := database.New(dbPath)
	if err != nil {
		t.Fatalf("database.New: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		t.Fatalf("database.Migrate: %v", err)
	}

	// Configure viper with test sources
	viper.Reset()
	viper.Set("sources", []map[string]string{
		{
			"name":        "TestSource1",
			"base_url":    "https://example.com/1",
			"description": "Test Source One",
		},
		{
			"name":        "TestSource2",
			"base_url":    "https://example.com/2",
			"description": "Test Source Two",
		},
	})

	if err := seedSources(db); err != nil {
		t.Fatalf("seedSources: %v", err)
	}

	// Verify sources were created
	srcStore := store.NewSourceStore(db)
	sources, err := srcStore.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}

	if len(sources) != 2 {
		t.Fatalf("expected 2 sources, got %d", len(sources))
	}

	if sources[0].Name != "TestSource1" {
		t.Errorf("expected TestSource1, got %s", sources[0].Name)
	}
	if sources[1].Name != "TestSource2" {
		t.Errorf("expected TestSource2, got %s", sources[1].Name)
	}
}

func TestSeedSources_NoDuplicates(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := database.New(dbPath)
	if err != nil {
		t.Fatalf("database.New: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		t.Fatalf("database.Migrate: %v", err)
	}

	viper.Reset()
	viper.Set("sources", []map[string]string{
		{
			"name":        "Earthscope",
			"base_url":    "https://service.iris.edu",
			"description": "Earthscope (formerly IRIS)",
		},
	})

	// Seed once
	if err := seedSources(db); err != nil {
		t.Fatalf("first seedSources: %v", err)
	}

	// Seed again — should not duplicate
	if err := seedSources(db); err != nil {
		t.Fatalf("second seedSources: %v", err)
	}

	srcStore := store.NewSourceStore(db)
	sources, err := srcStore.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}

	if len(sources) != 1 {
		t.Fatalf("expected 1 source (no duplicate), got %d", len(sources))
	}
}

func TestSeedSources_NoConfig(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := database.New(dbPath)
	if err != nil {
		t.Fatalf("database.New: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		t.Fatalf("database.Migrate: %v", err)
	}

	// Reset viper — no sources configured
	viper.Reset()

	if err := seedSources(db); err != nil {
		t.Fatalf("seedSources with no config: %v", err)
	}

	srcStore := store.NewSourceStore(db)
	sources, err := srcStore.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}

	if len(sources) != 0 {
		t.Fatalf("expected 0 sources, got %d", len(sources))
	}
}

func TestMain(m *testing.M) {
	// Prevent tests from reading the user's real config
	viper.Reset()
	os.Exit(m.Run())
}
