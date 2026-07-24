#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════════════
# AgriCarta One-Click Local Environment Runner (Windows PowerShell)
# Launches Frontend PWA, Backend/Bot, and ML Engine in parallel
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "AgriCarta Local Dev Environment"

# ─── Color Helpers ───────────────────────────────────────────────────────────
function Write-Step { param($msg) Write-Host "  ▸ " -NoNewline -ForegroundColor DarkCyan; Write-Host $msg -ForegroundColor White }
function Write-OK { param($msg) Write-Host "  ✓ " -NoNewline -ForegroundColor Green; Write-Host $msg -ForegroundColor Gray }
function Write-Warn { param($msg) Write-Host "  ⚠ " -NoNewline -ForegroundColor Yellow; Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "  ✗ " -NoNewline -ForegroundColor Red; Write-Host $msg -ForegroundColor Red }

# ─── ASCII Banner ────────────────────────────────────────────────────────────
function Show-Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor DarkCyan
    Write-Host "  ║                                                        ║" -ForegroundColor DarkCyan
    Write-Host "  ║     █████╗  ██████╗ ██████╗ ██╗██╗  ██╗ █████╗        ║" -ForegroundColor Green
    Write-Host "  ║    ██╔══██╗██╔════╝ ██╔══██╗██║██║ ██╔╝██╔══██╗       ║" -ForegroundColor Green
    Write-Host "  ║    ███████║██║  ███╗██████╔╝██║█████╔╝ ███████║       ║" -ForegroundColor Green
    Write-Host "  ║    ██╔══██║██║   ██║██╔══██╗██║██╔═██╗ ██╔══██║       ║" -ForegroundColor Green
    Write-Host "  ║    ██║  ██║╚██████╔╝██║  ██║██║██║  ██╗██║  ██║       ║" -ForegroundColor Green
    Write-Host "  ║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝       ║" -ForegroundColor Green
    Write-Host "  ║              ██████╗ █████╗ ██████╗ ████████╗ █████╗   ║" -ForegroundColor Cyan
    Write-Host "  ║             ██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗  ║" -ForegroundColor Cyan
    Write-Host "  ║             ██║     ███████║██████╔╝   ██║   ███████║  ║" -ForegroundColor Cyan
    Write-Host "  ║             ╚██████╗██║  ██║██║  ██╗   ██║   ██║  ██║  ║" -ForegroundColor Cyan
    Write-Host "  ║              ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝  ║" -ForegroundColor Cyan
    Write-Host "  ║                                                        ║" -ForegroundColor DarkCyan
    Write-Host "  ║        Transparent Food Price Intelligence Platform    ║" -ForegroundColor DarkGray
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor DarkCyan
    Write-Host ""
}

# ─── Prerequisite Checks ────────────────────────────────────────────────────
function Test-Prerequisites {
    Write-Host "`n  ── Checking Prerequisites ──" -ForegroundColor Cyan
    
    # Node.js
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if ($nodePath) {
        $nodeVer = & node --version 2>$null
        Write-OK "Node.js found: $nodeVer"
    }
    else {
        Write-Err "Node.js not found! Install from https://nodejs.org"
        exit 1
    }

    # npm
    $npmPath = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmPath) {
        $npmVer = & npm --version 2>$null
        Write-OK "npm found: v$npmVer"
    }
    else {
        Write-Err "npm not found!"
        exit 1
    }

    # Python
    $pythonCmd = $null
    foreach ($cmd in @("python", "python3", "py")) {
        $p = Get-Command $cmd -ErrorAction SilentlyContinue
        if ($p) {
            $pythonCmd = $cmd
            $pyVer = & $cmd --version 2>&1
            Write-OK "Python found: $pyVer"
            break
        }
    }
    if (-not $pythonCmd) {
        Write-Err "Python not found! Install from https://www.python.org"
        exit 1
    }

    return $pythonCmd
}

# ─── Install Dependencies ───────────────────────────────────────────────────
function Install-Dependencies {
    param($pythonCmd)
    
    Write-Host "`n  ── Installing Dependencies ──" -ForegroundColor Cyan
    $rootDir = $PSScriptRoot
    
    # Backend
    $backendModules = Join-Path $rootDir "backend\node_modules"
    if (-not (Test-Path $backendModules)) {
        Write-Step "Installing Backend dependencies..."
        Push-Location (Join-Path $rootDir "backend")
        & npm install 2>&1 | Out-Null
        Pop-Location
        Write-OK "Backend dependencies installed."
    }
    else {
        Write-OK "Backend dependencies already installed."
    }
    
    # Frontend PWA
    $pwaModules = Join-Path $rootDir "agrikarta-pwa\node_modules"
    if (-not (Test-Path $pwaModules)) {
        Write-Step "Installing Frontend PWA dependencies..."
        Push-Location (Join-Path $rootDir "agrikarta-pwa")
        & npm install 2>&1 | Out-Null
        Pop-Location
        Write-OK "Frontend PWA dependencies installed."
    }
    else {
        Write-OK "Frontend PWA dependencies already installed."
    }
    
    # ML Engine
    $mlReqs = Join-Path $rootDir "ml-engine\requirements.txt"
    if (Test-Path $mlReqs) {
        Write-Step "Installing ML Engine Python dependencies..."
        Push-Location (Join-Path $rootDir "ml-engine")
        & $pythonCmd -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
        Pop-Location
        Write-OK "ML Engine dependencies installed."
    }
}

# ─── Launch Services ─────────────────────────────────────────────────────────
function Start-Services {
    param($pythonCmd)
    
    Write-Host "`n  ── Launching Services ──" -ForegroundColor Cyan
    $rootDir = $PSScriptRoot
    $jobs = @()
    
    # 1. Backend (Node.js)
    Write-Step "Starting Backend + WhatsApp Bot on port 5000..."
    $backendJob = Start-Job -Name "AgriCarta-Backend" -ScriptBlock {
        param($dir)
        Set-Location $dir
        & npm start 2>&1
    } -ArgumentList (Join-Path $rootDir "backend")
    $jobs += $backendJob
    
    # 2. Frontend PWA (Vite Dev Server)
    Write-Step "Starting Frontend PWA on port 5173..."
    $frontendJob = Start-Job -Name "AgriCarta-Frontend" -ScriptBlock {
        param($dir)
        Set-Location $dir
        & npm run dev 2>&1
    } -ArgumentList (Join-Path $rootDir "agrikarta-pwa")
    $jobs += $frontendJob
    
    # 3. ML Engine (Uvicorn)
    Write-Step "Starting ML Engine on port 8000..."
    $mlJob = Start-Job -Name "AgriCarta-MLEngine" -ScriptBlock {
        param($dir, $py)
        Set-Location $dir
        & $py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload 2>&1
    } -ArgumentList (Join-Path $rootDir "ml-engine"), $pythonCmd
    $jobs += $mlJob
    
    # Wait for services to initialize
    Start-Sleep -Seconds 4
    
    return $jobs
}

# ─── Display Ready Status ───────────────────────────────────────────────────
function Show-ReadyStatus {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║                                                        ║" -ForegroundColor Green
    Write-Host "  ║      AGRIKARTA LOCAL ENV READY                         ║" -ForegroundColor White
    Write-Host "  ║                                                        ║" -ForegroundColor Green
    Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "  ║                                                        ║" -ForegroundColor Green
    Write-Host "  ║  🌐 Frontend PWA:   " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:5173        " -NoNewline -ForegroundColor Cyan
    Write-Host "  ║" -ForegroundColor Green
    Write-Host "  ║  🤖 Backend/Bot:    " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:5000        " -NoNewline -ForegroundColor Cyan
    Write-Host "  ║" -ForegroundColor Green
    Write-Host "  ║  🧠 ML API:         " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:8000        " -NoNewline -ForegroundColor Cyan
    Write-Host "  ║" -ForegroundColor Green
    Write-Host "  ║  📊 ML Docs:        " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:8000/docs   " -NoNewline -ForegroundColor Cyan
    Write-Host "  ║" -ForegroundColor Green
    Write-Host "  ║                                                        ║" -ForegroundColor Green
    Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "  ║  Press Ctrl+C to stop all services                     ║" -ForegroundColor DarkGray
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

# ─── Main Execution ──────────────────────────────────────────────────────────

Clear-Host
Show-Banner

$pythonCmd = Test-Prerequisites
Install-Dependencies -pythonCmd $pythonCmd
$jobs = Start-Services -pythonCmd $pythonCmd

Show-ReadyStatus

# Keep script alive and stream job output until Ctrl+C
try {
    while ($true) {
        foreach ($job in $jobs) {
            $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($output) {
                $color = switch ($job.Name) {
                    "AgriCarta-Backend" { "Yellow" }
                    "AgriCarta-Frontend" { "Cyan" }
                    "AgriCarta-MLEngine" { "Magenta" }
                    default { "Gray" }
                }
                foreach ($line in $output) {
                    Write-Host "  [$($job.Name)] " -NoNewline -ForegroundColor $color
                    Write-Host $line
                }
            }
        }
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host "`n  Shutting down all services..." -ForegroundColor Yellow
    $jobs | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  All services stopped. Goodbye! 👋" -ForegroundColor Green
}

Read-Host -Prompt "Tekan Enter untuk keluar..."

