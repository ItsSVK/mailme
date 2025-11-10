#!/bin/bash

# MailMe Production Deployment Script
# Usage: ./deploy.sh [command]
# Commands: start, stop, restart, logs, status, update

set -e

COMPOSE_FILE="docker-compose.deploy.yml"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}ℹ${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

check_env() {
    if [ ! -f .env ]; then
        print_warn ".env file not found. Creating from template..."
        cat > .env <<EOF
PORT=4000
SMTP_PORT=2525
NODE_ENV=production
DOMAIN=mailme.itssvk.dev
FRONTEND_URL=https://mailme.itssvk.dev
EOF
        print_info ".env file created. Please review and update it if needed."
    fi
}

ensure_directories() {
    print_info "Ensuring required directories exist..."
    mkdir -p nginx/certbot/conf
    mkdir -p nginx/certbot/www
    chmod -R 755 nginx/certbot 2>/dev/null || true
}

start_services() {
    print_info "Starting MailMe services..."
    check_docker
    check_env
    ensure_directories
    
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    print_info "Waiting for services to initialize..."
    sleep 5
    
    print_info "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    print_info "Services started! View logs with: ./deploy.sh logs"
}

stop_services() {
    print_info "Stopping MailMe services..."
    docker compose -f "$COMPOSE_FILE" down
    print_info "Services stopped."
}

restart_services() {
    print_info "Restarting MailMe services..."
    docker compose -f "$COMPOSE_FILE" restart
    print_info "Services restarted."
}

show_logs() {
    print_info "Showing logs (Ctrl+C to exit)..."
    docker compose -f "$COMPOSE_FILE" logs -f
}

show_status() {
    print_info "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    print_info "Container resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
        mailme-backend mailme-nginx mailme-certbot-renew 2>/dev/null || true
}

update_services() {
    print_info "Updating MailMe services..."
    
    if [ -d .git ]; then
        print_info "Pulling latest changes from git..."
        git pull || print_warn "Git pull failed or not a git repository"
    fi
    
    print_info "Rebuilding and restarting services..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    print_info "Update complete!"
    show_status
}

show_help() {
    echo "MailMe Production Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show logs from all services"
    echo "  status    - Show service status and resource usage"
    echo "  update    - Pull latest changes and rebuild services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start    # Start services"
    echo "  ./deploy.sh logs     # View logs"
    echo "  ./deploy.sh status   # Check status"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    update)
        update_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

