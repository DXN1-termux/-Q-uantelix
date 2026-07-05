#!/bin/bash
# ============================================================
# [Q]uantelix — Start Script
# Detects Termux, finds open port, starts Flask or Next.js
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}  ___   _   _  ___ _   _ ___ _   _ ___ ${NC}"
echo -e "${CYAN} / _ \\ | | | |/ __| | | | _ \\ | | |_ _|${NC}"
echo -e "${CYAN}| (_) || |_| | (__| |_| |  _/ |_| || | ${NC}"
echo -e "${CYAN} \\__\\_\\ \\___/ \\___|\\___/|_|  \\___/|___|${NC}"
echo -e "${PURPLE}  AGENTIC AI. INTELLIGENCE THAT ACTS.${NC}"
echo ""

# Detect Termux
IS_TERMUX=0
if [ -n "$PREFIX" ] && [[ "$PREFIX" == *"com.termux"* ]]; then
    IS_TERMUX=1
    echo -e "${GREEN}✓ Termux detected${NC}"
fi

# Find open port
find_port() {
    local start=${1:-3000}
    local end=${2:-8099}
    for port in $(seq $start $end); do
        if ! nc -z 0.0.0.0 $port 2>/dev/null; then
            echo $port
            return
        fi
    done
    echo "-1"
}

PORT=$(find_port 3000 8099)
if [ "$PORT" = "-1" ]; then
    echo -e "${RED}✗ No available ports in range 3000-8099${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using port ${PORT}${NC}"

# Check if Python/Flask is available
if command -v python3 &> /dev/null && python3 -c "import flask" 2>/dev/null; then
    echo -e "${GREEN}✓ Flask detected — starting Python backend${NC}"
    cd "$ROOT_DIR/server"
    python3 app.py &
    SERVER_PID=$!
    echo -e "${CYAN}  Flask server: http://0.0.0.0:${PORT}${NC}"
    echo -e "${CYAN}  Press Ctrl+C to stop${NC}"
    wait $SERVER_PID
elif command -v node &> /dev/null && [ -d "$ROOT_DIR/web/node_modules" ]; then
    echo -e "${GREEN}✓ Node.js detected — starting Next.js dev server${NC}"
    cd "$ROOT_DIR/web"
    PORT=$PORT npm run dev
else
    echo -e "${YELLOW}⚠ Neither Flask nor Node.js found. Installing Flask...${NC}"
    if [ "$IS_TERMUX" -eq 1 ]; then
        pkg install -y python
        pip install flask flask-cors
    else
        pip3 install flask flask-cors
    fi
    cd "$ROOT_DIR/server"
    python3 app.py &
    SERVER_PID=$!
    echo -e "${CYAN}  Flask server: http://0.0.0.0:${PORT}${NC}"
    wait $SERVER_PID
fi
