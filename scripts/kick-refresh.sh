#!/bin/bash
# Start one AI Drudge refresh on GitHub Actions.
# The Mac launch agent calls gh directly (it cannot read this Documents folder).
# This script is the same command for a manual kick.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
exec /opt/homebrew/bin/gh workflow run "Refresh and deploy" \
  --repo PNelsonFTP/ai-drudge \
  --ref main
