# Docker Setup for DevSphere

This document explains how to run the DevSphere application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd devsphare2
   ```

2. **Create environment files**:
   
   Create `back/.env` file with database configuration:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=db
   DB_PORT=3306
   DB_DATABASE=devsphere
   DB_USERNAME=devsphere
   DB_PASSWORD=root
   APP_KEY=base64:YOUR_APP_KEY_HERE
   ```

   Create `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Build and start the containers**:
   ```bash
   docker-compose up -d --build
   ```

4. **Generate Laravel application key** (if not already set):
   ```bash
   docker-compose exec backend php artisan key:generate
   ```

5. **Run database migrations** (if needed):
   ```bash
   docker-compose exec backend php artisan migrate
   ```

6. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Nginx (if using): http://localhost:8080

## Services

- **db**: MySQL 8.0 database
- **backend**: Laravel PHP backend (PHP 8.2)
- **nginx**: Nginx web server (optional, for production-like setup)
- **frontend**: React frontend (Vite dev server)

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f [service_name]
```

### Execute commands in containers
```bash
# Backend commands
docker-compose exec backend php artisan [command]
docker-compose exec backend composer install

# Frontend commands
docker-compose exec frontend npm install
docker-compose exec frontend npm run build
```

### Rebuild containers
```bash
docker-compose up -d --build
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

## Development Mode

The docker-compose setup is configured for development:
- Frontend runs in dev mode with hot-reload
- Backend runs with debug enabled
- Volumes are mounted for live code changes

## Production Considerations

For production deployment:
1. Set `APP_ENV=production` and `APP_DEBUG=false` in backend environment
2. Build frontend: `npm run build`
3. Use a production-ready web server configuration
4. Set up proper SSL/TLS certificates
5. Configure proper database backups
6. Set secure passwords and API keys

## Troubleshooting

### Port conflicts
If ports 8000, 5173, 3306, or 8080 are already in use, modify the port mappings in `docker-compose.yml`.

### Permission issues
If you encounter permission issues with storage:
```bash
docker-compose exec backend chmod -R 775 storage bootstrap/cache
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

### Database connection errors
Ensure the database container is running and check the connection credentials in `back/.env`.

### Clear caches
```bash
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan route:clear
docker-compose exec backend php artisan view:clear
```


