# Waraqa - Collaborative LaTeX Editor Startup Script
# This script starts the backend and frontend servers in separate windows for easy monitoring.

Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  Starting Waraqa (ورقة) LaTeX Editor...     " -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta

Write-Host "Starting backend server (Port 5000)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd backend && title Waraqa Backend && npm run start"

Write-Host "Starting frontend development server..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k cd frontend && title Waraqa Frontend && npm run dev"

Write-Host "Servers launched!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "Frontend: Check the frontend command prompt window for the Vite URL (typically http://localhost:5173)" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Magenta
