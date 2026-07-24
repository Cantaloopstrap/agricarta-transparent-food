#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# AgriCarta One-Click Local Environment Runner (Linux / macOS)
# Launches Frontend PWA, Backend/Bot, and ML Engine in parallel
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ─── Color Codes ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helpers ─────────────────────────────────────────────────────────────────
step()  { echo -e "  ${CYAN}▸${NC} $1"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()   { echo -e "  ${RED}✗${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()

# ─── Cleanup on Exit ────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "  ${YELLOW}Shutting down all services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            wait "$pid" 2>/dev/null
        fi
    done
    echo -e "  ${GREEN}All services stopped. Goodbye! 👋${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ─── ASCII Banner ────────────────────────────────────────────────────────────
show_banner() {
    echo ""
    echo -e "  ${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${CYAN}║${NC}                                                        ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}   █████╗  ██████╗ ██████╗ ██╗██╗  ██╗ █████╗  ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}  ██╔══██╗██╔════╝ ██╔══██╗██║██║ ██╔╝██╔══██╗ ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}  ███████║██║  ███╗██████╔╝██║█████╔╝ ███████║ ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}  ██╔══██║██║   ██║██╔══██╗██║██╔═██╗ ██╔══██║ ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}  ██║  ██║╚██████╔╝██║  ██║██║██║  ██╗██║  ██║ ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GREEN}${BOLD}  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${CYAN}${BOLD}           ██████╗ █████╗ ██████╗ ████████╗ █████╗  ${NC} ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${CYAN}${BOLD}          ██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗ ${NC}${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${CYAN}${BOLD}          ██║     ███████║██████╔╝   ██║   ███████║ ${NC}${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${CYAN}${BOLD}          ╚██████╗██║  ██║██║  ██╗   ██║   ██║  ██║ ${NC}${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${CYAN}${BOLD}           ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ${NC}${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}                                                        ${CYAN}║${NC}"
    echo -e "  ${CYAN}║${NC}  ${GRAY}    Transparent Food Price Intelligence Platform${NC}      ${CYAN}║${NC}"
    echo -e "  ${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ─── Prerequisite Checks ────────────────────────────────────────────────────
check_prerequisites() {
    echo ""
    echo -e "  ${CYAN}── Checking Prerequisites ──${NC}"
    
    # Node.js
    if command -v node &>/dev/null; then
        ok "Node.js found: $(node --version)"
    else
        err "Node.js not found! Install from https://nodejs.org"
        exit 1
    fi

    # npm
    if command -v npm &>/dev/null; then
        ok "npm found: v$(npm --version)"
    else
        err "npm not found!"
        exit 1
    fi

    # Python
    PYTHON_CMD=""
    for cmd in python3 python py; do
        if command -v "$cmd" &>/dev/null; then
            PYTHON_CMD="$cmd"
            ok "Python found: $($cmd --version 2>&1)"
            break
        fi
    done
    if [ -z "$PYTHON_CMD" ]; then
        err "Python not found! Install from https://www.python.org"
        exit 1
    fi
}

# ─── Install Dependencies ───────────────────────────────────────────────────
install_dependencies() {
    echo ""
    echo -e "  ${CYAN}── Installing Dependencies ──${NC}"
    
    # Backend
    if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
        step "Installing Backend dependencies..."
        (cd "$SCRIPT_DIR/backend" && npm install --silent 2>&1) >/dev/null
        ok "Backend dependencies installed."
    else
        ok "Backend dependencies already installed."
    fi
    
    # Frontend PWA
    if [ ! -d "$SCRIPT_DIR/agrikarta-pwa/node_modules" ]; then
        step "Installing Frontend PWA dependencies..."
        (cd "$SCRIPT_DIR/agrikarta-pwa" && npm install --silent 2>&1) >/dev/null
        ok "Frontend PWA dependencies installed."
    else
        ok "Frontend PWA dependencies already installed."
    fi
    
    # ML Engine
    if [ -f "$SCRIPT_DIR/ml-engine/requirements.txt" ]; then
        step "Installing ML Engine Python dependencies..."
        (cd "$SCRIPT_DIR/ml-engine" && $PYTHON_CMD -m pip install -r requirements.txt --quiet 2>&1) >/dev/null
        ok "ML Engine dependencies installed."
    fi
}

# ─── Launch Services ─────────────────────────────────────────────────────────
launch_services() {
    echo ""
    echo -e "  ${CYAN}── Launching Services ──${NC}"
    
    # 1. Backend
    step "Starting Backend + WhatsApp Bot on port 5000..."
    (cd "$SCRIPT_DIR/backend" && npm start 2>&1 | while IFS= read -r line; do
        echo -e "  ${YELLOW}[Backend]${NC} $line"
    done) &
    PIDS+=($!)
    
    # 2. Frontend PWA
    step "Starting Frontend PWA on port 5173..."
    (cd "$SCRIPT_DIR/agrikarta-pwa" && npm run dev 2>&1 | while IFS= read -r line; do
        echo -e "  ${CYAN}[Frontend]${NC} $line"
    done) &
    PIDS+=($!)
    
    # 3. ML Engine
    step "Starting ML Engine on port 8000..."
    (cd "$SCRIPT_DIR/ml-engine" && $PYTHON_CMD -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload 2>&1 | while IFS= read -r line; do
        echo -e "  ${MAGENTA}[ML Engine]${NC} $line"
    done) &
    PIDS+=($!)
    
    sleep 4
}

# ─── Display Ready Status ───────────────────────────────────────────────────
show_ready_status() {
    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}║${NC}                                                        ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}  ${BOLD}    AGRIKARTA LOCAL ENV READY${NC}                         ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}                                                        ${GREEN}║${NC}"
    echo -e "  ${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "  ${GREEN}║${NC}                                                        ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}  🌐 Frontend PWA:   ${CYAN}http://localhost:5173${NC}              ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}  🤖 Backend/Bot:    ${CYAN}http://localhost:5000${NC}              ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}  🧠 ML API:         ${CYAN}http://localhost:8000${NC}              ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}  📊 ML Docs:        ${CYAN}http://localhost:8000/docs${NC}         ${GREEN}║${NC}"
    echo -e "  ${GREEN}║${NC}                                                        ${GREEN}║${NC}"
    echo -e "  ${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "  ${GREEN}║${NC}  ${GRAY}Press Ctrl+C to stop all services${NC}                     ${GREEN}║${NC}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ─── Main Execution ──────────────────────────────────────────────────────────
clear
show_banner
check_prerequisites
install_dependencies
launch_services
show_ready_status

# Keep script alive until Ctrl+C
wait
