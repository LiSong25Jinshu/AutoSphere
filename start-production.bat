@echo off
echo ========================================
echo  AutoSphere Production Startup
echo ========================================

REM Check if frontend is built
if not exist "frontend\dist\index.html" (
    echo [1/3] Building frontend...
    cd frontend
    call npm run build
    cd ..
    if errorlevel 1 (
        echo ERROR: Frontend build failed
        exit /b 1
    )
    echo [1/3] Frontend build complete.
) else (
    echo [1/3] Frontend already built. Skipping.
)

REM Set production environment
echo [2/3] Setting environment to production...
set NODE_ENV=production

REM Copy production env if .env doesn't exist
if not exist "backend\.env" (
    echo WARNING: backend\.env not found.
    echo Please copy backend\.env.production to backend\.env and fill in your values.
    exit /b 1
)

REM Start the backend (serves both API and frontend)
echo [3/3] Starting AutoSphere server on port 5001...
echo.
echo  App will be available at: http://localhost:5001
echo  Press Ctrl+C to stop.
echo.
cd backend
node src/server.js
