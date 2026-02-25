Write-Host "Starting CASHMERE ERP Services..."

# 1. Start Docker Containers
Write-Host "1. Starting Docker Containers (Postgres, Redis)..."
docker-compose up -d

# Check if docker-compose failed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start Docker containers. Please ensure Docker Desktop is running." -ForegroundColor Red
    Pause
    exit
}

# 2. Start Backend
Write-Host "2. Starting Backend Server..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; ./venv/Scripts/python manage.py runserver"

# 3. Start Frontend
Write-Host "3. Starting Frontend Server..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All services started! Check the new windows." -ForegroundColor Green
Pause
