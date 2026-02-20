#!/bin/sh

echo "⏳ Waiting for SQL Server to be ready..."

# Wait for SQL Server to be ready (using nc - netcat)
until nc -z sqlserver 1433; do
  printf "."
  sleep 2
done

echo ""
echo "✅ SQL Server is ready!"

echo "🚀 Starting Next.js application..."
exec node server.js
