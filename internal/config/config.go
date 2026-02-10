package config

import (
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// ConfigDir returns the FDSN configuration directory (~/.config/fdsn).
func ConfigDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "fdsn"), nil
}

// DefaultDBPath returns the default database path inside ConfigDir.
func DefaultDBPath() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "fdsn.db"), nil
}

// DefaultConfigFile returns the default config file path inside ConfigDir.
func DefaultConfigFile() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.yaml"), nil
}

// EnsureDir creates a directory (and parents) with mode 0o700 if it doesn't exist.
func EnsureDir(dir string) error {
	return os.MkdirAll(dir, 0o700)
}

// SaveConfig writes the current Viper configuration to the given path.
func SaveConfig(path string) error {
	return viper.WriteConfigAs(path)
}

// SetDefaults configures all Viper defaults for the application.
func SetDefaults() {
	// Server
	viper.SetDefault("server.port", 8080)

	// Database — prefer ~/.config/fdsn/fdsn.db, fall back to ./fdsn.db
	dbPath, err := DefaultDBPath()
	if err != nil {
		dbPath = "./fdsn.db"
	}
	viper.SetDefault("db.path", dbPath)

	// Logging
	viper.SetDefault("log.level", "info")

	// Preset FDSN sources
	viper.SetDefault("sources", []map[string]string{
		{
			"name":        "IRIS",
			"base_url":    "https://service.iris.edu",
			"description": "IRIS Data Management Center",
		},
		{
			"name":        "ORFEUS",
			"base_url":    "https://www.orfeus-eu.org",
			"description": "ORFEUS Data Center (Europe)",
		},
	})
}
