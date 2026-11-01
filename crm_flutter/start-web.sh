#!/bin/bash
# Start Flutter CRM web + CORS proxy for browser login
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="$HOME/flutter/bin:$PATH"

pkill -f "cors_proxy.py 8091" 2>/dev/null || true
pkill -f "web-port=8090" 2>/dev/null || true
sleep 1

python3 "$ROOT/tools/cors_proxy.py" 8091 >/tmp/emb-cors-proxy.log 2>&1 &
echo "CORS proxy: http://127.0.0.1:8091 (pid $!)"

cd "$ROOT"
flutter run -d web-server --web-hostname=127.0.0.1 --web-port=8090 --release
