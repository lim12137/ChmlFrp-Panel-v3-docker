#!/bin/sh
set -eu

cat >/usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  apiBaseUrl: "${APP_API_BASE_URL}",
  panelOrigin: "${APP_PANEL_ORIGIN}",
  siteOrigin: "${APP_SITE_ORIGIN}"
};
EOF
