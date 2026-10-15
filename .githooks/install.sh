#!/usr/bin/env bash
# ============================================================
# Install git hooks for ImpactForge
# Run once after cloning: ./githooks/install.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Installing ImpactForge git hooks..."

# Configure git to use our hooks directory
git -C "$REPO_ROOT" config core.hooksPath .githooks

# Ensure hooks are executable
chmod +x "$SCRIPT_DIR/pre-commit"
chmod +x "$SCRIPT_DIR/commit-msg"
chmod +x "$SCRIPT_DIR/pre-push"

echo ""
echo "Git hooks installed successfully!"
echo ""
echo "Active hooks:"
echo "  pre-commit  — Blocks secrets, .env files, warns on console.log"
echo "  commit-msg  — Enforces conventional commit format"
echo "  pre-push    — Blocks direct push to main/develop, validates branch names"
echo ""
echo "To bypass in emergencies: --no-verify"
