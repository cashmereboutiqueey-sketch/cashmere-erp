# Startup Script

This script will start the application.

```powershell
Write-Host "Starting Docker containers..."
docker-compose up -d

Write-Host "Starting Backend..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; ./venv/Scripts/python manage.py runserver"

Write-Host "Starting Frontend..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```
