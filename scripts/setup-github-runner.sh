#!/bin/bash
# Setup GitHub Actions Self-Hosted Runner
# This script configures a self-hosted runner for Festival Lights CI/CD pipeline
#
# Usage: bash scripts/setup-github-runner.sh <github-token> <github-repo>
# Example: bash scripts/setup-github-runner.sh ghp_xxxxx jrosslee/ecomm_demo

set -e

# Configuration
RUNNER_VERSION="2.317.0"
RUNNER_NAME="festival-lights-runner-1"
RUNNER_WORKDIR="/home/jrosslee/actions-runner"
RUNNER_LABELS="self-hosted,linux,x64,festival-lights"
SYSTEMD_SERVICE_FILE="/etc/systemd/system/actions-runner.service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Validate inputs
if [ $# -lt 2 ]; then
    print_error "Missing required arguments"
    echo "Usage: bash scripts/setup-github-runner.sh <github-token> <github-repo>"
    echo "Example: bash scripts/setup-github-runner.sh ghp_xxxxx jrosslee/ecomm_demo"
    exit 1
fi

GITHUB_TOKEN=$1
GITHUB_REPO=$2
GITHUB_URL="https://github.com/${GITHUB_REPO}"

echo "GitHub Actions Self-Hosted Runner Setup"
echo "========================================"
echo "Repository: $GITHUB_REPO"
echo "Runner name: $RUNNER_NAME"
echo "Runner labels: $RUNNER_LABELS"
echo "Working directory: $RUNNER_WORKDIR"
echo ""

# Check if running as root for systemd service
if [ "$EUID" -ne 0 ]; then
    print_warning "This script must be run as root to set up systemd service"
    print_warning "Some steps will require sudo"
fi

# Step 1: Create runner directory
print_status "Creating runner directory..."
mkdir -p "$RUNNER_WORKDIR"
cd "$RUNNER_WORKDIR"

# Step 2: Download runner
print_status "Downloading GitHub Actions runner v${RUNNER_VERSION}..."
RUNNER_ARCHIVE="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

if [ ! -f "$RUNNER_ARCHIVE" ]; then
    wget "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_ARCHIVE}" -q
    if [ $? -eq 0 ]; then
        print_status "Runner downloaded successfully"
    else
        print_error "Failed to download runner"
        exit 1
    fi
else
    print_status "Runner already downloaded"
fi

# Step 3: Extract runner
print_status "Extracting runner..."
if [ ! -d "bin" ]; then
    tar xzf "$RUNNER_ARCHIVE"
    print_status "Runner extracted"
else
    print_status "Runner already extracted"
fi

# Step 4: Get registration token
print_status "Getting registration token from GitHub..."
REGISTRATION_TOKEN=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_REPO}/actions/runners/registration-token" \
    | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$REGISTRATION_TOKEN" ]; then
    print_error "Failed to get registration token"
    print_error "Check your GitHub token and repository access"
    exit 1
fi

print_status "Registration token obtained"

# Step 5: Configure runner
print_status "Configuring runner..."
if [ -f ".runner" ]; then
    print_warning "Runner already configured, skipping configuration"
else
    ./config.sh \
        --url "$GITHUB_URL" \
        --token "$REGISTRATION_TOKEN" \
        --name "$RUNNER_NAME" \
        --labels "$RUNNER_LABELS" \
        --work "_work" \
        --unattended \
        --replace

    if [ $? -eq 0 ]; then
        print_status "Runner configured successfully"
    else
        print_error "Failed to configure runner"
        exit 1
    fi
fi

# Step 6: Install as service
print_status "Installing systemd service..."
if [ "$EUID" -eq 0 ]; then
    # Create systemd service file
    cat > "$SYSTEMD_SERVICE_FILE" <<EOF
[Unit]
Description=GitHub Actions Runner - Festival Lights
After=network.target

[Service]
Type=simple
User=jrosslee
WorkingDirectory=$RUNNER_WORKDIR
ExecStart=$RUNNER_WORKDIR/run.sh
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start service
    systemctl daemon-reload
    systemctl enable actions-runner
    systemctl start actions-runner

    if systemctl is-active --quiet actions-runner; then
        print_status "Systemd service installed and running"
    else
        print_error "Failed to start systemd service"
        exit 1
    fi
else
    print_warning "Not running as root - systemd service setup skipped"
    print_warning "To install as service, run: sudo bash scripts/setup-github-runner.sh $GITHUB_TOKEN $GITHUB_REPO"
fi

# Step 7: Verify installation
print_status "Verifying runner installation..."
echo ""
echo "Runner Status:"
echo "=============="

if systemctl is-active --quiet actions-runner 2>/dev/null; then
    print_status "Service running: actions-runner (active)"
    systemctl status actions-runner --no-pager
else
    print_warning "Service status check skipped (not running as root)"
    print_status "Runner configured at: $RUNNER_WORKDIR"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Verify runner in GitHub:"
echo "   Open: https://github.com/${GITHUB_REPO}/settings/actions/runners"
echo ""
echo "2. Check runner logs:"
echo "   - Real-time: journalctl -u actions-runner -f"
echo "   - Service status: systemctl status actions-runner"
echo ""
echo "3. Trigger a deployment:"
echo "   - Push to main branch or manually trigger workflow"
echo ""
echo "Runner Details:"
echo "  Name: $RUNNER_NAME"
echo "  Labels: $RUNNER_LABELS"
echo "  Directory: $RUNNER_WORKDIR"
echo "  Service: actions-runner.service"
