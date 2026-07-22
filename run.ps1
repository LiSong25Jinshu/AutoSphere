#!/usr/bin/env pwsh
# AutoSphere Development Runner
# Starts backend (port 5001) and frontend (port 3000), then opens the app in the browser.
# Usage: .\run.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendPort = 5001
$frontendPort = 3000
$backendUrl = "http://localhost:$backendPort"
$frontendUrl = "http://localhost:$frontendPort"

function Test-Port {
  param([int]$Port)
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect('127.0.0.1', $Port)
    $tcp.Close()
    return $true
  } catch {
    return $false
  }
}

function Wait-ForPort {
  param([int]$Port, [string]$Name, [int]$Timeout = 120)
  $elapsed = 0
  Write-Host "  Waiting for $Name on port $Port..." -NoNewline
  while ($elapsed -lt $Timeout) {
    if (Test-Port -Port $Port) {
      Write-Host " ready." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 1
    $elapsed++
  }
  Write-Host " timed out." -ForegroundColor Red
  return $false
}

function Stop-ByPort {
  param([int]$Port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "  Stopping existing process on port $Port (PID $($proc.Id))..." -ForegroundColor Yellow
        $proc | Stop-Process -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    # Best-effort cleanup; ignore errors
  }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       AutoSphere Dev Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Node availability
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
  exit 1
}

# Stop any existing instances occupying the ports
Write-Host "Checking for existing instances..." -ForegroundColor White
Stop-ByPort -Port $backendPort
Stop-ByPort -Port $frontendPort
Start-Sleep -Seconds 1

# Use cmd.exe to run npm scripts (npm.cmd is not a valid direct Start-Process target on Windows)
$cmd = (Get-Command cmd).Source

# Start backend (force PORT so it matches the frontend proxy, regardless of env)
Write-Host "[1/3] Starting backend (port $backendPort)..." -ForegroundColor White
$backendJob = Start-Process -FilePath $cmd -ArgumentList "/c","cd /d `"$root\backend`" && set PORT=$backendPort && npm run dev" `
  -WindowStyle Normal -PassThru -RedirectStandardOutput "$root\backend.log" -RedirectStandardError "$root\backend.err"

# Start frontend
Write-Host "[2/3] Starting frontend (port $frontendPort)..." -ForegroundColor White
$frontendJob = Start-Process -FilePath $cmd -ArgumentList "/c","cd /d `"$root\frontend`" && npm run dev" `
  -WindowStyle Normal -PassThru -RedirectStandardOutput "$root\frontend.log" -RedirectStandardError "$root\frontend.err"

# Wait for services to become available
Write-Host "[3/3] Verifying services..." -ForegroundColor White
$backendReady = Wait-ForPort -Port $backendPort -Name "backend" -Timeout 120
$frontendReady = Wait-ForPort -Port $frontendPort -Name "frontend" -Timeout 60

if (-not $backendReady) {
  Write-Host "WARNING: Backend did not start in time. Check $root\backend.err" -ForegroundColor Yellow
}
if (-not $frontendReady) {
  Write-Host "WARNING: Frontend did not start in time. Check $root\frontend.err" -ForegroundColor Yellow
}

if ($backendReady -and $frontendReady) {
  Write-Host "Both services are up. Opening browser..." -ForegroundColor Green
  Start-Process $frontendUrl
  Write-Host "AutoSphere is running at: $frontendUrl" -ForegroundColor Green
  Write-Host "Backend API at: $backendUrl" -ForegroundColor Green
  Write-Host "Press Ctrl+C / close the windows to stop." -ForegroundColor Gray
} else {
  Write-Host "One or more services failed to start. Check logs:" -ForegroundColor Red
  Write-Host "  Backend:  $root\backend.err" -ForegroundColor Gray
  Write-Host "  Frontend: $root\frontend.err" -ForegroundColor Gray
}
