#!/usr/bin/env bash
# Run once as root on fresh VPS: bash infra/server-setup.sh
# Tested on Debian 12

set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/dreamyvoice"
DATA_DIR="/opt/data"
ENV_DIR="/opt/env"

# ── Docker ───────────────────────────────────────────────────────────────────
apt-get update -q
apt-get install -y -q ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -q
apt-get install -y -q docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# ── deploy user ───────────────────────────────────────────────────────────────
id -u "$DEPLOY_USER" &>/dev/null || useradd -m -s /bin/bash "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"

# ── directories ───────────────────────────────────────────────────────────────
mkdir -p "$APP_DIR" "$DATA_DIR/postgres" "$DATA_DIR/minio" "$ENV_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR" "$DATA_DIR" "$ENV_DIR"

# ── SSH dir for deploy user ──────────────────────────────────────────────────
SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
touch "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"

# ── clone repo ───────────────────────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
  echo ""
  echo "Repo not cloned yet. Run as deploy user:"
  echo "  git clone git@github.com:art0tod/dreamyvoice-site.git $APP_DIR"
fi

echo ""
echo "✓ Server setup complete"
echo ""
echo "Next steps:"
echo "  1. Add GitHub deploy public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "  2. Clone repo: git clone git@github.com:art0tod/dreamyvoice-site.git $APP_DIR"
echo "  3. Create $APP_DIR/.env with POSTGRES_PASSWORD, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD"
echo "  4. Create $ENV_DIR/backend.prod.env with all backend env vars"
echo "  5. Add secrets to GitHub repo (see README section CI/CD)"
