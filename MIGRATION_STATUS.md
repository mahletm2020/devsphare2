# Migration Status

## Completed Migration

✅ **Migration Created**: `2025_12_23_141359_add_sponsor_logos_to_hackathons_table.php`

This migration adds:
- `has_sponsors` (boolean, default: false) - Indicates if hackathon already has sponsors
- `sponsor_logos` (JSON, nullable) - Array of sponsor logo URLs

## How to Run the Migration

### Option 1: Using Docker (Recommended)
The migration will run automatically when you start the Docker containers:
```bash
cd /home/ziana/projects/devsphare2
docker compose up -d
```

The backend container automatically runs `php artisan migrate --force` on startup (see docker-compose.yml line 52).

### Option 2: Manual Migration (if database is running locally)
```bash
cd /home/ziana/projects/devsphare2/back
php artisan migrate
```

### Option 3: Run migration in Docker container (if containers are running)
```bash
docker compose exec backend php artisan migrate
```

## Current Status

⚠️ **Database Connection**: Currently unavailable (Connection refused)
- Docker daemon is not running
- Need to start Docker services to run migrations

## Next Steps

1. Start Docker Desktop or Docker daemon
2. Run `docker compose up -d` to start all services
3. The migration will run automatically
4. Verify migration with: `docker compose exec backend php artisan migrate:status`

## Files Modified

### Backend:
- ✅ Migration file created
- ✅ Hackathon model updated (fillable + casts)
- ✅ HackathonController updated (validation + file upload handling)
- ✅ HackathonResource updated (API response)

### Frontend:
- ✅ CreateHackathon form updated (radio buttons + file upload)
- ✅ HackathonCard component updated (sponsor logo display)

All code changes are complete. The migration is ready to run once the database is available.





