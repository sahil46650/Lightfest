# GitHub Actions Self-Hosted Runner Setup

This guide walks through setting up a GitHub Actions self-hosted runner for the Festival Lights deployment pipeline.

## Why Self-Hosted Runner?

The deployment workflow requires:
- **Database migrations** (Prisma ORM operations)
- **Direct database access** (with DIRECT_DATABASE_URL)
- **Persistent workspace** (for build artifacts)
- **Custom environment** (Node.js, npm, Prisma CLI)

GitHub-hosted runners are ephemeral and can't efficiently handle complex database operations. A self-hosted runner provides persistent state and direct access to local infrastructure.

## Prerequisites

- GitHub personal access token with `repo` and `admin:repo_hook` scopes
- Linux server (Ubuntu 20.04+ or similar)
- sudo/root access to install systemd service
- Node.js 18+ (optional, but recommended)
- `curl` and `wget` commands available

## Quick Start

### Step 1: Create GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Set token name: `Festival Lights CI/CD Runner`
4. Select scopes:
   - `repo` (all)
   - `admin:repo_hook`
   - `workflow`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### Step 2: Run Setup Script

```bash
cd /home/jrosslee/src/ecomm_demo

# Run setup with your token and repo
bash scripts/setup-github-runner.sh <YOUR_GITHUB_TOKEN> jrosslee/ecomm_demo

# Example:
# bash scripts/setup-github-runner.sh ghp_1234567890abcdefghijklmnop jrosslee/ecomm_demo
```

The script will:
- Create `/home/jrosslee/actions-runner` directory
- Download GitHub Actions runner v2.317.0
- Configure runner with labels: `self-hosted,linux,x64,festival-lights`
- Install and start systemd service: `actions-runner`

### Step 3: Verify Installation

```bash
# Check service status
systemctl status actions-runner

# View logs
journalctl -u actions-runner -f

# Check GitHub dashboard
# Open: https://github.com/jrosslee/ecomm_demo/settings/actions/runners
# You should see the runner marked as "Idle" (green)
```

## Manual Setup (If Script Fails)

If the automated script doesn't work, you can set up manually:

### 1. Create Runner Directory

```bash
mkdir -p ~/actions-runner
cd ~/actions-runner
```

### 2. Download Runner

```bash
# Download latest runner
curl -o actions-runner-linux-x64-2.317.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz

# Extract
tar xzf actions-runner-linux-x64-2.317.0.tar.gz
```

### 3. Get Registration Token

```bash
# Replace with your GitHub token
GITHUB_TOKEN="ghp_your_token_here"
REGISTRATION_TOKEN=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/jrosslee/ecomm_demo/actions/runners/registration-token \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo $REGISTRATION_TOKEN
```

### 4. Configure Runner

```bash
./config.sh \
  --url https://github.com/jrosslee/ecomm_demo \
  --token $REGISTRATION_TOKEN \
  --name festival-lights-runner-1 \
  --labels self-hosted,linux,x64,festival-lights \
  --work _work \
  --unattended
```

### 5. Install Systemd Service

```bash
sudo cat > /etc/systemd/system/actions-runner.service <<EOF
[Unit]
Description=GitHub Actions Runner - Festival Lights
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/actions-runner
ExecStart=$HOME/actions-runner/run.sh
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable actions-runner
sudo systemctl start actions-runner
```

### 6. Verify

```bash
sudo systemctl status actions-runner
sudo journalctl -u actions-runner -f
```

## Runner Configuration

**Service Name:** `actions-runner`
**User:** Current user (usually `jrosslee`)
**Working Directory:** `/home/jrosslee/actions-runner`
**Labels:** `self-hosted`, `linux`, `x64`, `festival-lights`
**Restart Policy:** Always (with 15s delay between restarts)

## Managing the Runner

### View Status

```bash
systemctl status actions-runner
```

### View Logs

```bash
# Real-time logs
journalctl -u actions-runner -f

# Last 50 lines
journalctl -u actions-runner -n 50

# Last hour
journalctl -u actions-runner --since "1 hour ago"
```

### Stop/Start/Restart

```bash
# Stop
sudo systemctl stop actions-runner

# Start
sudo systemctl start actions-runner

# Restart
sudo systemctl restart actions-runner
```

### Uninstall Runner

```bash
# Stop service
sudo systemctl stop actions-runner

# Disable from startup
sudo systemctl disable actions-runner

# Remove service file
sudo rm /etc/systemd/system/actions-runner.service

# Reload systemd
sudo systemctl daemon-reload

# Remove runner directory (optional)
rm -rf ~/actions-runner
```

## Troubleshooting

### Runner Not Showing in GitHub

**Issue:** Runner doesn't appear at https://github.com/jrosslee/ecomm_demo/settings/actions/runners

**Solutions:**
1. Check if service is running: `systemctl status actions-runner`
2. Check logs: `journalctl -u actions-runner -n 20`
3. Verify token has correct permissions (repo + admin:repo_hook)
4. Verify repository URL is correct: `jrosslee/ecomm_demo`

### Service Fails to Start

**Issue:** `systemctl start actions-runner` returns error

**Solutions:**
1. Check systemd syntax: `systemd-analyze verify /etc/systemd/system/actions-runner.service`
2. Check user permissions: Verify user can execute `run.sh`
3. Check paths: Verify `/home/jrosslee/actions-runner` exists and is readable
4. View error logs: `journalctl -u actions-runner -n 50`

### Workflows Timeout

**Issue:** GitHub Actions workflow times out waiting for runner

**Solutions:**
1. Verify runner is online: `systemctl is-active actions-runner`
2. Check labels match workflow requirements: `self-hosted,linux,x64,festival-lights`
3. Verify runner isn't busy with another job
4. Check disk space: `df -h` (need at least 5GB free)

### Database Migrations Fail

**Issue:** Prisma migrations fail in workflow

**Solutions:**
1. Verify DATABASE_URL is accessible from runner
2. Check network connectivity: `curl -I https://accelerate.prisma-data.net`
3. Verify Prisma CLI is installed: `npx prisma --version`
4. Check migration files exist in repo

## Security Considerations

⚠️ **Important:** The runner executes code from your repository. Only use self-hosted runners with trusted repositories.

### Best Practices

1. **Limit Permissions:** Use a dedicated GitHub token with minimal scopes
2. **Rotate Tokens:** Regenerate runner token periodically
3. **Monitor Logs:** Regularly check `journalctl -u actions-runner` for suspicious activity
4. **Network Isolation:** If possible, restrict runner network access
5. **Disk Space:** Monitor `/home/jrosslee/actions-runner` for disk usage
6. **Keep Updated:** Update runner software periodically

## Advanced Configuration

### Run Multiple Runners

For load balancing or redundancy:

```bash
# Runner 1 (existing)
# ~/actions-runner-1

# Runner 2 (new)
mkdir -p ~/actions-runner-2
cd ~/actions-runner-2
# Download and configure as above
# Use name: festival-lights-runner-2

# Create separate systemd service
sudo tee /etc/systemd/system/actions-runner-2.service > /dev/null <<EOF
[Unit]
Description=GitHub Actions Runner - Festival Lights (2)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/actions-runner-2
ExecStart=$HOME/actions-runner-2/run.sh
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF
```

### Custom Build Cache

Configure npm cache for faster builds:

```bash
# In ~/.bashrc or ~/.profile
export npm_config_cache="$HOME/.npm-cache"

# Create cache directory
mkdir -p ~/.npm-cache
```

## Next Steps

1. ✅ Set up self-hosted runner (this guide)
2. ⏳ Trigger deployment workflow
3. ⏳ Monitor GitHub Actions logs
4. ⏳ Verify staging deployment
5. ⏳ Approve production deployment

## Support

For issues:
1. Check logs: `journalctl -u actions-runner -f`
2. Verify network connectivity
3. Consult GitHub Actions documentation: https://docs.github.com/en/actions/hosting-your-own-runners
4. Check Festival Lights deployment guide: `docs/PHASE_10_DEPLOYMENT_GUIDE.md`

---

**Runner Labels:** `[self-hosted, linux, x64, festival-lights]`
**Last Updated:** January 9, 2026
