package database

import "embed"

//go:embed migrations/*.sql
var migrationsFS embed.FS
