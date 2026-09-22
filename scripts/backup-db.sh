#!/bin/sh
# Automated PostgreSQL Backup Script for VASaaS Production
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/vasaas}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/vasaas_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== Starting PostgreSQL Database Backup ==="
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

echo "=== Backup completed successfully: ${BACKUP_FILE} ==="

# Retain backups for 30 days and delete older dumps
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
echo "=== Cleaned backups older than 30 days ==="
