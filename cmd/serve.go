package cmd

import (
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/joescharf/fdsn/internal/api"
	"github.com/joescharf/fdsn/internal/config"
	"github.com/joescharf/fdsn/internal/database"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the FDSN portal server",
	Long:  "Start the HTTP server that serves the FDSN portal UI and API endpoints.",
	RunE: func(cmd *cobra.Command, args []string) error {
		dbPath := viper.GetString("db.path")
		port := viper.GetInt("server.port")

		// Ensure database directory exists
		if err := config.EnsureDir(filepath.Dir(dbPath)); err != nil {
			return fmt.Errorf("create db directory: %w", err)
		}

		// Open database
		db, err := database.New(dbPath)
		if err != nil {
			return fmt.Errorf("database init: %w", err)
		}
		defer db.Close()
		log.Info().Str("path", dbPath).Msg("database opened")

		// Run migrations
		if err := database.Migrate(db); err != nil {
			return fmt.Errorf("database migrate: %w", err)
		}

		// Build router
		handler, err := api.NewRouter(db)
		if err != nil {
			return fmt.Errorf("router init: %w", err)
		}

		addr := fmt.Sprintf(":%d", port)
		log.Info().Str("addr", addr).Msg("starting server")
		return http.ListenAndServe(addr, handler)
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().IntP("port", "p", 8080, "port to listen on")
	_ = viper.BindPFlag("server.port", serveCmd.Flags().Lookup("port"))
}
