package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/joescharf/fdsn/internal/config"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage FDSN Portal configuration",
}

var configInitCmd = &cobra.Command{
	Use:   "init",
	Short: "Create the config directory and default config file",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfgDir, err := config.ConfigDir()
		if err != nil {
			return fmt.Errorf("determine config directory: %w", err)
		}

		if err := config.EnsureDir(cfgDir); err != nil {
			return fmt.Errorf("create config directory: %w", err)
		}
		fmt.Fprintln(os.Stderr, "Config directory:", cfgDir)

		cfgPath, err := config.DefaultConfigFile()
		if err != nil {
			return fmt.Errorf("determine config file path: %w", err)
		}

		// Only write if file does not already exist
		if _, err := os.Stat(cfgPath); err == nil {
			fmt.Fprintln(os.Stderr, "Config file already exists:", cfgPath)
			return nil
		}

		if err := config.SaveConfig(cfgPath); err != nil {
			return fmt.Errorf("write config file: %w", err)
		}
		fmt.Fprintln(os.Stderr, "Config file created:", cfgPath)
		return nil
	},
}

func init() {
	configCmd.AddCommand(configInitCmd)
	rootCmd.AddCommand(configCmd)
}
