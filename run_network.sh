#!/usr/bin/env bash
#
# AIR KINGS - run on the local network.
#
# Detects the machine's LAN IP, makes sure the app listens on all interfaces
# (0.0.0.0) and starts the frontend + backend, then prints the URL to open from
# another device on the same network.
#
# Usage:  ./run_network.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ports match the project configuration (client/vite.config.ts and server/.env).
CLIENT_PORT=5173
SERVER_PORT=3001

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
PNPM_BIN="$(command -v pnpm 2>/dev/null || true)"
if [ -z "$PNPM_BIN" ] && [ -x "$HOME/.local/share/pnpm/bin/pnpm" ]; then
  PNPM_BIN="$HOME/.local/share/pnpm/bin/pnpm"
fi
if [ -z "$PNPM_BIN" ]; then
  echo "Error: pnpm was not found on PATH." >&2
  echo "Install it (https://pnpm.io) or run:  export PATH=\"\$HOME/.local/share/pnpm/bin:\$PATH\"" >&2
  exit 1
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Error: dependencies are not installed. Run 'pnpm install' first." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/server/.env" ]; then
  echo "Error: server/.env is missing. Copy server/.env.example to server/.env." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Detect the LAN IP (first non-loopback address that can reach the internet)
# ---------------------------------------------------------------------------
detect_lan_ip() {
  if command -v ip >/dev/null 2>&1; then
    local via_route
    via_route="$(ip route get 1.1.1.1 2>/dev/null \
      | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
    if [ -n "${via_route:-}" ]; then
      printf '%s\n' "$via_route"
      return 0
    fi
  fi

  if command -v hostname >/dev/null 2>&1; then
    local via_hostname
    via_hostname="$(hostname -I 2>/dev/null | awk '{ print $1 }')"
    if [ -n "${via_hostname:-}" ]; then
      printf '%s\n' "$via_hostname"
      return 0
    fi
  fi

  if command -v ip >/dev/null 2>&1; then
    local via_addr
    via_addr="$(ip -4 -o addr show scope global 2>/dev/null \
      | awk '{ split($4, a, "/"); print a[1]; exit }')"
    if [ -n "${via_addr:-}" ]; then
      printf '%s\n' "$via_addr"
      return 0
    fi
  fi

  return 1
}

LAN_IP="$(detect_lan_ip || true)"
if [ -z "${LAN_IP:-}" ]; then
  echo "Error: could not detect a LAN IP address." >&2
  echo "Make sure this machine is connected to a network and try again." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Start the app on all interfaces
# ---------------------------------------------------------------------------
# The backend already defaults to HOST=0.0.0.0 (server/.env); the frontend binds
# to all interfaces via `host: true` in client/vite.config.ts. Exporting HOST
# here keeps the behavior explicit and consistent.
export HOST=0.0.0.0

cat <<EOF
====================================
 AIR KINGS - Network Mode
====================================

Local IP:  $LAN_IP
Game:      http://$LAN_IP:$CLIENT_PORT
Backend:   http://$LAN_IP:$SERVER_PORT

Open this URL on another device on the same network:
  http://$LAN_IP:$CLIENT_PORT

Note: if another device cannot connect, allow TCP ports $CLIENT_PORT and
$SERVER_PORT through this machine's firewall (and client isolation must be off
on the router). This script does not change firewall settings.

Starting AIR KINGS...
Press Ctrl+C to stop.

EOF

# Runs the existing dev command (Vite client + Fastify server via concurrently).
exec "$PNPM_BIN" dev
