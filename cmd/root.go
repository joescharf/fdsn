package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/joescharf/fdsn/internal/config"
)

var cfgFile string

var rootCmd = &cobra.Command{
	Use:   "fdsn",
	Short: "FDSN Portal — serve and manage seismic station metadata",
	Long:  "FDSN Portal connects to external FDSN data centres, imports station\nmetadata, and re-serves it through standard FDSN web-service endpoints.",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// Configure zerolog
		level, err := zerolog.ParseLevel(viper.GetString("log.level"))
		if err != nil {
			level = zerolog.InfoLevel
		}
		zerolog.SetGlobalLevel(level)
		log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).
			With().Timestamp().Logger()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ~/.config/fdsn/config.yaml)")
}

func initConfig() {
	// Apply application defaults via Viper
	config.SetDefaults()

	viper.SetEnvPrefix("FDSN")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		if cfgDir, err := config.ConfigDir(); err == nil {
			viper.AddConfigPath(cfgDir)
		}
		viper.AddConfigPath(".")
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")
	}

	if err := viper.ReadInConfig(); err == nil {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}
}
