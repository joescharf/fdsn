package cmd

import (
	"fmt"
	"net/http"

	"github.com/joescharf/fdsn/internal/ui"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the embedded web UI server",
	Long:  "Start an HTTP server that serves the embedded web UI.\nBy default it listens on port 8080. Use --port to change it.",
	RunE: func(cmd *cobra.Command, args []string) error {
		port := viper.GetInt("port")

		handler, err := ui.Handler()
		if err != nil {
			return fmt.Errorf("failed to initialize UI handler: %w", err)
		}

		addr := fmt.Sprintf(":%d", port)
		fmt.Printf("Serving UI at http://localhost%s\n", addr)
		return http.ListenAndServe(addr, handler)
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().IntP("port", "p", 8080, "port to listen on")
	viper.SetDefault("port", 8080)
	_ = viper.BindPFlag("port", serveCmd.Flags().Lookup("port"))
}
