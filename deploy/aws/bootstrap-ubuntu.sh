#!/usr/bin/env bash
set -euo pipefail

# Run once on a fresh Ubuntu EC2 instance as the ubuntu user.
# This script does not clone the repository or write application secrets.
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin nginx git
sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$USER"

echo "Docker and Nginx are installed. Log out and back in, then run docker compose from the repository root."
