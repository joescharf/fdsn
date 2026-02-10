package config

import (
	"github.com/spf13/viper"
)

// SetDefaults configures all Viper defaults for the application.
func SetDefaults() {
	// Server
	viper.SetDefault("server.port", 8080)

	// Database
	viper.SetDefault("db.path", "./fdsn.db")

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
