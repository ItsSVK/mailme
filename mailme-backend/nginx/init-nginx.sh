#!/bin/sh

DOMAIN="mailmeapi.itssvk.dev"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
CONFIG_DIR="/etc/nginx/conf.d"
TEMP_CONFIG="${CONFIG_DIR}/temp-init.conf"
MAIN_CONFIG="${CONFIG_DIR}/default.conf"

# Function to check if certificates exist
check_certs() {
    [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]
}

# Function to create temporary HTTP-only config for initial cert setup
create_temp_config() {
    cat > "$TEMP_CONFIG" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
}

# Function to wait for certificates (with timeout)
wait_for_certs() {
    echo "Waiting for certificates to be generated..."
    max_attempts=150  # 5 minutes (150 * 2 seconds)
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_certs; then
            echo "Certificates found!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo "Warning: Certificates not found after waiting 5 minutes. Continuing with HTTP-only mode."
    return 1
}

# Main initialization
echo "Initializing nginx..."

if check_certs; then
    echo "SSL certificates found. Using full configuration."
    # Remove temp config if it exists
    rm -f "$TEMP_CONFIG"
    # Ensure main config is in place
    if [ ! -f "$MAIN_CONFIG" ]; then
        echo "Error: Main config file not found!"
        exit 1
    fi
    # Test and start nginx with SSL
    nginx -t
    if [ $? -eq 0 ]; then
        echo "Starting nginx with SSL..."
        # Start periodic reload in background (every 12 hours to pick up renewed certs)
        (
            while true; do
                sleep 43200  # 12 hours
                echo "Periodic nginx reload..."
                nginx -s reload || true
            done
        ) &
        exec nginx -g "daemon off;"
    else
        echo "Error: SSL configuration test failed!"
        exit 1
    fi
else
    echo "SSL certificates not found. Setting up temporary HTTP-only configuration..."
    create_temp_config
    
    # Temporarily disable SSL config if it exists
    if [ -f "$MAIN_CONFIG" ]; then
        mv "$MAIN_CONFIG" "${MAIN_CONFIG}.ssl"
    fi
    
    # Start nginx with temp config in background
    echo "Starting nginx with temporary configuration..."
    nginx -t && nginx &
    NGINX_PID=$!
    
    # Give nginx a moment to start
    sleep 2
    
    # Wait for certificates
    wait_for_certs
    
    if check_certs; then
        echo "Certificates are ready. Switching to SSL configuration..."
        # Stop temporary nginx
        nginx -s quit
        wait $NGINX_PID 2>/dev/null || true
        
        # Restore SSL config
        if [ -f "${MAIN_CONFIG}.ssl" ]; then
            mv "${MAIN_CONFIG}.ssl" "$MAIN_CONFIG"
        fi
        rm -f "$TEMP_CONFIG"
        
        # Test and start nginx with SSL
        nginx -t
        if [ $? -eq 0 ]; then
            echo "SSL configuration is valid. Starting nginx..."
            # Start periodic reload in background (every 12 hours to pick up renewed certs)
            (
                while true; do
                    sleep 43200  # 12 hours
                    echo "Periodic nginx reload..."
                    nginx -s reload || true
                done
            ) &
            exec nginx -g "daemon off;"
        else
            echo "Error: SSL configuration test failed!"
            exit 1
        fi
    else
        echo "Starting nginx in HTTP-only mode (certificates not available)..."
        # Keep nginx running in foreground
        wait $NGINX_PID
    fi
fi

