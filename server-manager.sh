#!/bin/bash

# Broker AI Assistant Server Manager
# Usage: ./server-manager.sh [start|stop|restart|status|logs|errors|dev|build|preview]

set -e

# Configuration
APP_NAME="Broker AI Assistant"
DEV_PORT=8080
PREVIEW_PORT=4173
PID_FILE=".server.pid"
LOG_FILE=".server.log"
ERROR_LOG=".error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if process is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Get process info
get_process_info() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "PID: $pid"
            echo "Port: $(lsof -ti:$DEV_PORT 2>/dev/null || echo 'Not found')"
            echo "Memory: $(ps -o rss= -p "$pid" 2>/dev/null | awk '{print int($1/1024)"MB"}' || echo 'N/A')"
            echo "CPU: $(ps -o %cpu= -p "$pid" 2>/dev/null | awk '{print $1"%"}' || echo 'N/A')"
        fi
    fi
}

# Start development server
start_dev() {
    if is_running; then
        warning "$APP_NAME is already running"
        return 0
    fi
    
    log "Starting $APP_NAME development server..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi
    
    # Start server in background
    nohup npm run dev > "$LOG_FILE" 2> "$ERROR_LOG" &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 3
    if is_running; then
        success "$APP_NAME started successfully on port $DEV_PORT"
        success "PID: $pid"
        log "Access the app at: http://localhost:$DEV_PORT"
    else
        error "Failed to start $APP_NAME"
        show_errors
        return 1
    fi
}

# Stop server
stop_server() {
    if ! is_running; then
        warning "$APP_NAME is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    log "Stopping $APP_NAME (PID: $pid)..."
    
    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        warning "Forcing shutdown..."
        kill -9 "$pid" 2>/dev/null || true
    fi
    
    rm -f "$PID_FILE"
    success "$APP_NAME stopped"
}

# Restart server
restart_server() {
    log "Restarting $APP_NAME..."
    stop_server
    sleep 2
    start_dev
}

# Show server status
show_status() {
    echo "=== $APP_NAME Status ==="
    if is_running; then
        success "Status: Running"
        get_process_info
        
        # Check if port is accessible
        if curl -s "http://localhost:$DEV_PORT" > /dev/null 2>&1; then
            success "Server is responding on port $DEV_PORT"
        else
            warning "Server process running but not responding on port $DEV_PORT"
        fi
    else
        warning "Status: Stopped"
    fi
    
    # Show recent activity
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "=== Recent Activity ==="
        tail -5 "$LOG_FILE" 2>/dev/null || echo "No recent activity"
    fi
}

# Show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        log "Showing recent logs (last 50 lines)..."
        echo "=== Server Logs ==="
        tail -50 "$LOG_FILE"
    else
        warning "No log file found"
    fi
}

# Show errors
show_errors() {
    if [ -f "$ERROR_LOG" ] && [ -s "$ERROR_LOG" ]; then
        error "Recent errors found:"
        echo "=== Error Logs ==="
        tail -20 "$ERROR_LOG"
    else
        success "No recent errors found"
    fi
}

# Build for production
build_app() {
    log "Building $APP_NAME for production..."
    
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi
    
    npm run build
    
    if [ $? -eq 0 ]; then
        success "Build completed successfully"
        log "Build output available in ./dist/"
    else
        error "Build failed"
        return 1
    fi
}

# Preview production build
preview_build() {
    if [ ! -d "dist" ]; then
        warning "No build found. Building first..."
        build_app
    fi
    
    log "Starting preview server on port $PREVIEW_PORT..."
    npm run preview
}

# Clean up function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f "$PID_FILE" "$LOG_FILE" "$ERROR_LOG"
    success "Cleanup completed"
}

# Main script logic
case "${1:-}" in
    "start"|"dev")
        start_dev
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "errors")
        show_errors
        ;;
    "build")
        build_app
        ;;
    "preview")
        preview_build
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start, dev    Start development server"
        echo "  stop          Stop the server"
        echo "  restart       Restart the server"
        echo "  status        Show server status"
        echo "  logs          Show recent logs"
        echo "  errors        Show recent errors"
        echo "  build         Build for production"
        echo "  preview       Preview production build"
        echo "  cleanup       Clean temporary files"
        echo "  help          Show this help message"
        ;;
    *)
        error "Unknown command: ${1:-}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac