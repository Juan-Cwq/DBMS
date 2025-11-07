# PostgreSQL Setup Guide

## Current Status
✅ PostgreSQL 15 is installed and running!

## Issue
PostgreSQL is requiring password authentication. Here's how to fix it:

## Option 1: Use Docker (Easiest - Recommended)

```bash
# Stop the Homebrew PostgreSQL
brew services stop postgresql@15

# Run PostgreSQL in Docker (no password issues)
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=my_database \
  -p 5432:5432 \
  -d postgres:15

# Test connection
docker exec -it postgres-dev psql -U postgres -d my_database
```

**Connection Details for Your App:**
- Host: `localhost`
- Port: `5432`
- Database: `my_database`
- User: `postgres`
- Password: `mypassword`
- SSL: ❌ (unchecked)

## Option 2: Fix Homebrew PostgreSQL

```bash
# 1. Stop PostgreSQL
brew services stop postgresql@15

# 2. Edit the config file
nano /opt/homebrew/var/postgresql@15/pg_hba.conf

# 3. Change this line:
#    host    all    all    127.0.0.1/32    trust
# To:
#    host    all    all    127.0.0.1/32    md5

# 4. Start PostgreSQL
brew services start postgresql@15

# 5. Set a password for your user
/opt/homebrew/opt/postgresql@15/bin/psql postgres -c "ALTER USER jcors09 WITH PASSWORD 'mypassword';"

# 6. Create database
/opt/homebrew/opt/postgresql@15/bin/createdb my_database
```

**Connection Details for Your App:**
- Host: `localhost`
- Port: `5432`
- Database: `my_database`
- User: `jcors09`
- Password: `mypassword`
- SSL: ❌ (unchecked)

## Option 3: Use Free Cloud PostgreSQL (No Local Setup)

### Supabase (Recommended)
1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Go to Settings → Database
5. Copy connection details

### Neon
1. Go to https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string

## Testing Your Connection

Once you have PostgreSQL set up, test it in your app:

1. Open your DBMS app
2. Click "Connect to PostgreSQL"
3. Enter your connection details
4. Click "Test Connection"
5. If successful, click "Connect"

## Quick Start (Docker - Recommended)

If you have Docker installed, just run:

```bash
# Stop Homebrew PostgreSQL
brew services stop postgresql@15

# Start Docker PostgreSQL
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=my_database \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

Then in your app, connect with:
- Host: localhost
- Port: 5432
- Database: my_database
- User: postgres
- Password: mypassword

That's it! 🚀
