package cmd

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/joescharf/fdsn/internal/api"
	"github.com/joescharf/fdsn/internal/config"
	"github.com/joescharf/fdsn/internal/database"
	"github.com/joescharf/fdsn/internal/models"
	"github.com/joescharf/fdsn/internal/store"
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
		defer func() { _ = db.Close() }()
		log.Info().Str("path", dbPath).Msg("database opened")

		// Run migrations
		if err := database.Migrate(db); err != nil {
			return fmt.Errorf("database migrate: %w", err)
		}

		// Seed sources from config into database
		if err := seedSources(db); err != nil {
			log.Warn().Err(err).Msg("source seeding failed")
		}

		// Build router
		handler, err := api.NewRouter(db)
		if err != nil {
			return fmt.Errorf("router init: %w", err)
		}

		addr := fmt.Sprintf(":%d", port)
		url := fmt.Sprintf("http://localhost:%d", port)

		log.Info().Str("url", url).Msg("FDSN Portal is running")
		fmt.Fprintf(os.Stderr, "\n  FDSN Portal → %s\n\n", url)

		if !viper.GetBool("server.no_browser") {
			go openBrowser(url)
		}

		return http.ListenAndServe(addr, handler)
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().IntP("port", "p", 8080, "port to listen on")
	_ = viper.BindPFlag("server.port", serveCmd.Flags().Lookup("port"))

	serveCmd.Flags().Bool("no-browser", false, "do not open the web browser on startup")
	_ = viper.BindPFlag("server.no_browser", serveCmd.Flags().Lookup("no-browser"))
}

// seedSources reads sources from viper config and inserts any that are not
// already present in the database (matched by name).
func seedSources(db *sqlx.DB) error {
	srcStore := store.NewSourceStore(db)

	existing, err := srcStore.List()
	if err != nil {
		return fmt.Errorf("list existing sources: %w", err)
	}

	existingNames := make(map[string]bool, len(existing))
	for _, s := range existing {
		existingNames[s.Name] = true
	}

	// Read sources from viper config
	var cfgSources []struct {
		Name        string `mapstructure:"name"`
		BaseURL     string `mapstructure:"base_url"`
		Description string `mapstructure:"description"`
	}
	if err := viper.UnmarshalKey("sources", &cfgSources); err != nil {
		return fmt.Errorf("unmarshal sources config: %w", err)
	}

	for _, cs := range cfgSources {
		if existingNames[cs.Name] {
			continue
		}
		src := &models.Source{
			Name:        cs.Name,
			BaseURL:     cs.BaseURL,
			Description: cs.Description,
			Enabled:     true,
		}
		if err := srcStore.Create(src); err != nil {
			return fmt.Errorf("create source %q: %w", cs.Name, err)
		}
		log.Info().Str("name", cs.Name).Str("url", cs.BaseURL).Msg("seeded source from config")
	}

	return nil
}

// openBrowser opens the given URL in the default browser.
func openBrowser(url string) {
	cmd := browserCmd(url)
	if cmd == nil {
		return
	}
	if err := cmd.Start(); err != nil {
		log.Debug().Err(err).Msg("failed to open browser")
	}
}

// browserCmd returns the exec.Cmd to open a URL in the default browser,
// or nil if the platform is unsupported.
func browserCmd(url string) *exec.Cmd {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url)
	case "linux":
		return exec.Command("xdg-open", url)
	case "windows":
		return exec.Command("cmd", "/c", "start", url)
	default:
		return nil
	}
}
