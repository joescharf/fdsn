package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/spf13/viper"
)

func TestConfigDir(t *testing.T) {
	dir, err := ConfigDir()
	if err != nil {
		t.Fatalf("ConfigDir() error: %v", err)
	}
	if !strings.HasSuffix(dir, "fdsn") {
		t.Errorf("ConfigDir() = %q, want path ending in /fdsn", dir)
	}
	// Should be $HOME/.config/fdsn
	home, _ := os.UserHomeDir()
	want := filepath.Join(home, ".config", "fdsn")
	if dir != want {
		t.Errorf("ConfigDir() = %q, want %q", dir, want)
	}
}

func TestDefaultDBPath(t *testing.T) {
	p, err := DefaultDBPath()
	if err != nil {
		t.Fatalf("DefaultDBPath() error: %v", err)
	}
	dir, err := ConfigDir()
	if err != nil {
		t.Fatalf("ConfigDir() error: %v", err)
	}
	want := filepath.Join(dir, "fdsn.db")
	if p != want {
		t.Errorf("DefaultDBPath() = %q, want %q", p, want)
	}
}

func TestDefaultConfigFile(t *testing.T) {
	p, err := DefaultConfigFile()
	if err != nil {
		t.Fatalf("DefaultConfigFile() error: %v", err)
	}
	dir, err := ConfigDir()
	if err != nil {
		t.Fatalf("ConfigDir() error: %v", err)
	}
	want := filepath.Join(dir, "config.yaml")
	if p != want {
		t.Errorf("DefaultConfigFile() = %q, want %q", p, want)
	}
}

func TestEnsureDir(t *testing.T) {
	tmp := t.TempDir()
	target := filepath.Join(tmp, "a", "b", "c")

	// Create nested dir
	if err := EnsureDir(target); err != nil {
		t.Fatalf("EnsureDir() error: %v", err)
	}
	info, err := os.Stat(target)
	if err != nil {
		t.Fatalf("Stat after EnsureDir: %v", err)
	}
	if !info.IsDir() {
		t.Error("EnsureDir() did not create a directory")
	}

	// Idempotent — calling again should not error
	if err := EnsureDir(target); err != nil {
		t.Fatalf("EnsureDir() second call error: %v", err)
	}
}

func TestSetDefaults(t *testing.T) {
	// Reset viper to isolate test
	viper.Reset()

	SetDefaults()

	dbPath := viper.GetString("db.path")
	expectedDB, err := DefaultDBPath()
	if err != nil {
		// If DefaultDBPath fails, fallback should be used
		expectedDB = "./fdsn.db"
	}
	if dbPath != expectedDB {
		t.Errorf("SetDefaults() db.path = %q, want %q", dbPath, expectedDB)
	}

	if port := viper.GetInt("server.port"); port != 8080 {
		t.Errorf("SetDefaults() server.port = %d, want 8080", port)
	}

	if level := viper.GetString("log.level"); level != "info" {
		t.Errorf("SetDefaults() log.level = %q, want \"info\"", level)
	}
}
