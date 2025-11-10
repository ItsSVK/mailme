#!/bin/sh

# Script to reload nginx after certificate renewal
# This can be called by certbot's --deploy-hook

echo "Reloading nginx after certificate renewal..."
nginx -s reload

if [ $? -eq 0 ]; then
    echo "Nginx reloaded successfully"
else
    echo "Warning: Failed to reload nginx"
    exit 1
fi

