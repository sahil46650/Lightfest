# Phase 10: Deployment & Infrastructure - Complete Setup Guide

This guide provides step-by-step instructions for deploying Festival Lights to production using self-hosted GitHub Actions runners, GitHub CLI, and Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Self-Hosted Runner Setup](#self-hosted-runner-setup)
3. [GitHub Configuration](#github-configuration)
4. [Vercel Setup](#vercel-setup)
5. [Database Configuration](#database-configuration)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [GitHub Environments](#github-environments)
8. [Deployment Process](#deployment-process)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Emergency Rollback](#emergency-rollback)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Self-Hosted Runner**: Ubuntu 20.04+ or macOS 12+
- **Required Software**:
  - Git 2.30+
  - Node.js 18+
  - npm 8+
  - Docker (optional, for containerization)
  - PostgreSQL client tools (psql)

### Credentials & Access
- GitHub account with admin access to repository
- Vercel account with organization access
- PostgreSQL database credentials (production)
- Email service API key (Resend)
- Storage token (Vercel Blob)

### DNS & Domain
- Custom domain (e.g., festival-lights.com)
- Domain registrar access
- SSL/TLS certificate (auto-managed by Vercel)

---

## Self-Hosted Runner Setup

### Step 1: Create GitHub Actions Runner

#### On GitHub Repository:
1. Navigate to **Settings** → **Actions** → **Runners**
2. Click **New self-hosted runner**
3. Select **Linux** and **x64**
4. Choose **Ubuntu 20.04+** (or your OS)

#### On Your Server:

```bash
# Create directory for runner
mkdir -p /opt/github-actions
cd /opt/github-actions

# Download runner (use the download link from GitHub UI)
curl -o actions-runner-linux-x64-latest.tar.gz -L https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-linux-x64-2.x.x.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-latest.tar.gz

# Configure runner (use token from GitHub UI)
./config.sh --url https://github.com/YOUR_ORG/festival-lights \
  --token YOUR_REGISTRATION_TOKEN \
  --name festival-lights-runner-1 \
  --labels self-hosted,linux,x64,festival-lights \
  --runnergroup default \
  --work _work

# Install as service (Linux)
sudo ./svc.sh install runner

# Start service
sudo ./svc.sh start

# Verify
sudo ./svc.sh status
```

### Step 2: Configure Runner Security

```bash
# Create non-root user for runner
sudo useradd -m -s /bin/bash github-runner
sudo chown -R github-runner:github-runner /opt/github-actions

# Configure sudo access for package installation
echo 'github-runner ALL=(ALL) NOPASSWD: ALL' | sudo tee /etc/sudoers.d/github-runner

# Set secure permissions
sudo chmod 0440 /etc/sudoers.d/github-runner
```

### Step 3: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (via nvm)
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 18
nvm alias default 18

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Install Vercel CLI
npm install -g vercel

# Install GitHub CLI
sudo apt install -y gh

# Verify installations
node --version  # v18.x.x
npm --version   # 8.x.x
psql --version  # 12.x+
gh --version    # 2.x+
vercel --version # x.x.x
```

### Step 4: Configure GitHub CLI

```bash
# Authenticate with GitHub
gh auth login

# Select: HTTPS
# Paste your personal access token

# Verify authentication
gh auth status

# Set default repository
gh config set -h github.com prompt disabled
```

---

## GitHub Configuration

### Step 1: Create Repository Secrets

Navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**Required Secrets:**

```
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://festival-lights.vercel.app
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=<key>
DIRECT_DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>
TEST_DATABASE_URL=postgresql://<user>:<pass>@<test-host>/<test-db>
STAGING_DATABASE_URL=postgresql://<user>:<pass>@<staging-host>/<staging-db>

VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<organization-id>
VERCEL_PROJECT_ID=<project-id>
VERCEL_PROJECT_ID_STAGING=<staging-project-id>

RESEND_API_KEY=re_<your-key>
EMAIL_FROM=bookings@festival-lights.com
BLOB_READ_WRITE_TOKEN=vercel_blob_<token>

GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>

SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Step 2: Generate NEXTAUTH_SECRET

```bash
# On your local machine
openssl rand -base64 32

# Copy the output to NEXTAUTH_SECRET secret
```

### Step 3: Create GitHub Environments

Navigate to **Settings** → **Environments** → **New environment**

#### Create 4 Environments:

1. **staging**
   - Deployment branches: Allow deployment from main branch
   - Environment secrets: None (use repo secrets)
   - Reviewers: Optional (your team)

2. **production**
   - Deployment branches: Allow deployment from main branch
   - Environment secrets: None (use repo secrets)
   - Required reviewers: Yes (your team members)

3. **production-approval**
   - Deployment branches: Allow deployment from main branch
   - Reviewers: Your team members
   - Timeout: 1 day

4. **rollback-approval**
   - Deployment branches: Allow manual only
   - Reviewers: Your team members
   - Timeout: 30 minutes

---

## Vercel Setup

### Step 1: Create Vercel Project

```bash
# Login to Vercel
vercel login

# Create project for production
vercel project add festival-lights

# Create project for staging
vercel project add festival-lights-staging
```

### Step 2: Set Environment Variables in Vercel

```bash
# For production project
vercel env add DATABASE_URL production < /dev/null
vercel env add NEXTAUTH_SECRET production < /dev/null
vercel env add NEXTAUTH_URL production < /dev/null
# ... add remaining secrets

# For staging project
vercel env add DATABASE_URL staging < /dev/null
# ... repeat for staging
```

### Step 3: Configure Vercel Project Settings

Visit [Vercel Dashboard](https://vercel.com/dashboard) → Project Settings:

**Build Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

**Environment:**
- Add all secrets from GitHub Actions

**Cron Jobs:**
```bash
# Vercel provides cron job support via API routes
# See: vercel.json for cron configuration
```

### Step 4: Link Repository

```bash
# In your repo directory
vercel link

# Select:
# - Organization: Your Vercel org
# - Project: festival-lights
# - Connected to git: Yes

# Verify vercel.json is in repo root
cat vercel.json
```

---

## Database Configuration

### Option 1: Neon (Recommended for Vercel)

```bash
# 1. Create account at neon.tech
# 2. Create project: "festival-lights"
# 3. Get connection string

# Database URL format:
# postgresql://user:password@ep-xxx.neon.tech/festival-lights?sslmode=require

# For Prisma Accelerate:
# 1. Visit https://www.prisma.io/data-platform
# 2. Create Accelerate connection
# 3. Connection string: prisma+postgres://accelerate.prisma-data.net/?api_key=xxx
```

### Option 2: AWS RDS

```bash
# 1. Create RDS PostgreSQL instance
# 2. Configure security groups
# 3. Get connection details

# Update secrets with connection string:
# postgresql://admin:password@rds-instance.xxx.us-east-1.rds.amazonaws.com:5432/festival_lights
```

### Option 3: Supabase

```bash
# 1. Create account at supabase.com
# 2. Create project in desired region
# 3. Get connection string from Settings → Database

# Connection string format:
# postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Step 1: Create Production Database

```sql
-- Connect to your database
psql postgresql://user:password@host:5432/postgres

-- Create database
CREATE DATABASE festival_lights;

-- Connect to new database
\c festival_lights

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 2: Run Initial Migration

```bash
# Using DIRECT_DATABASE_URL (not Accelerate)
npx prisma migrate deploy --skip-generate

# Verify schema
npx prisma db execute --stdin < scripts/verify-schema.sql
```

### Step 3: Seed Production Database

```bash
# Optional: Seed with test data (production usually omits this)
DATABASE_URL=your_direct_url npm run prisma:seed
```

---

## Environment Variables & Secrets

### Complete Environment Setup

Create `.env.local` (do not commit):

```bash
# Database
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/festival_lights"

# NextAuth
NEXTAUTH_SECRET="generated-secret-key"
NEXTAUTH_URL="https://festival-lights.vercel.app"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Email
RESEND_API_KEY="re_xxx"
EMAIL_FROM="bookings@festival-lights.com"

# Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_xxx"

# Vercel
VERCEL_TOKEN="xxx"
VERCEL_ORG_ID="xxx"
VERCEL_PROJECT_ID="xxx"

# Monitoring (Optional)
SENTRY_AUTH_TOKEN="sntrys_xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```

### GitHub Secrets Sync

Use this script to sync secrets:

```bash
#!/bin/bash
# sync-secrets.sh

REPO="YOUR_ORG/festival-lights"

gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)" -R $REPO
gh secret set DATABASE_URL --body "$DATABASE_URL" -R $REPO
gh secret set DIRECT_DATABASE_URL --body "$DIRECT_DATABASE_URL" -R $REPO
gh secret set NEXTAUTH_URL --body "https://festival-lights.vercel.app" -R $REPO

# ... repeat for all secrets

echo "✅ Secrets synchronized"
```

---

## GitHub Environments

### Staging Environment

1. **Auto-deploy**: Yes (on main branch push)
2. **Health checks**: Automatic
3. **Rollback**: Manual
4. **Approvers**: Optional

### Production Environment

1. **Auto-deploy**: No (manual approval required)
2. **Health checks**: Mandatory
3. **Rollback**: Manual with approval
4. **Approvers**: Required (team members)

---

## Deployment Process

### Automated Workflow

1. **Push to main** → Triggers `deploy.yml`
2. **Build & Test** → Runs on self-hosted runner
3. **Database Migration** → Staging only
4. **Deploy to Staging** → Smoke tests
5. **Approval Gate** → Wait for team approval
6. **Database Migration** → Production
7. **Deploy to Production** → Smoke tests
8. **Verification** → Health checks
9. **Cleanup** → Remove artifacts

### Manual Trigger (if needed)

```bash
gh workflow run deploy.yml \
  --ref main \
  -f environment=production
```

### Database Migration Workflow

```bash
# Dry-run migration
gh workflow run migrate.yml \
  -f environment=staging \
  -f dry_run=true

# Execute migration
gh workflow run migrate.yml \
  -f environment=production \
  -f dry_run=false
```

### Rollback Workflow

```bash
# Emergency rollback
gh workflow run rollback.yml \
  -f environment=production \
  -f rollback_type=full_rollback
```

---

## Post-Deployment Verification

### Health Checks

```bash
# 1. Test API health endpoint
curl -f https://festival-lights.vercel.app/api/health

# 2. Test events endpoint
curl -f https://festival-lights.vercel.app/api/events

# 3. Check database connectivity
curl -f https://festival-lights.vercel.app/api/bookings

# 4. Verify Prisma state
npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM "Event";
SELECT COUNT(*) FROM "TicketType";
SELECT COUNT(*) FROM "User";
EOF
```

### Application Testing

```bash
# 1. Frontend smoke test
curl -f https://festival-lights.vercel.app/

# 2. Test authentication
curl -f https://festival-lights.vercel.app/api/auth/session

# 3. Test with token
TOKEN=$(npx ts-node scripts/get-admin-token.ts)
curl -f https://festival-lights.vercel.app/api/admin/events \
  -H "Authorization: Bearer $TOKEN"
```

### Database Verification

```bash
# 1. Check schema
npx prisma db execute --stdin <<EOF
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF

# 2. Verify data integrity
npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as total_events FROM "Event";
SELECT COUNT(*) as published_events FROM "Event" WHERE status = 'PUBLISHED';
SELECT COUNT(*) as total_bookings FROM "Booking";
EOF

# 3. Check indexes
npx prisma db execute --stdin <<EOF
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
EOF
```

---

## Emergency Rollback

### Database Rollback

```bash
# 1. Identify safe rollback point
npx prisma migrate status

# 2. Resolve to previous migration
npx prisma migrate resolve --rolled-back <migration_name>

# 3. Re-run migrations if needed
npx prisma migrate deploy
```

### Deployment Rollback

```bash
# 1. Identify previous working commit
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Push to rollback branch
git push -u origin rollback/<description>

# 4. Trigger manual deployment
gh workflow run deploy.yml -f environment=production
```

### Full System Rollback

```bash
# 1. Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=production \
  -f rollback_type=full_rollback

# 2. Monitor logs
gh run list --workflow=rollback.yml -L 1

# 3. Verify system health
curl -f https://festival-lights.vercel.app/api/health

# 4. Document incident
echo "Incident: $(date)" >> INCIDENTS.md
```

---

## Monitoring & Maintenance

### Production Health Checks

```bash
# Daily health check script
#!/bin/bash
# health-check.sh

URL="https://festival-lights.vercel.app"

echo "Checking $URL..."

# API Health
curl -s -f "$URL/api/health" || echo "❌ API health check failed"

# Database connectivity
curl -s -f "$URL/api/events" | jq '.length' || echo "❌ Database check failed"

# Booking creation test
curl -s -X POST "$URL/api/cart/initialize" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"test"}' | jq '.success' || echo "❌ Cart test failed"

echo "✅ Health check complete"
```

### Scheduled Maintenance

Schedule these tasks:

```bash
# Daily (2 AM UTC)
- Database backup verification
- Log rotation
- Cache cleanup

# Weekly (Sunday 3 AM UTC)
- Database integrity check
- Performance metrics review
- Security patching check

# Monthly (1st of month, 4 AM UTC)
- Full database backup
- Dependency update review
- Cost analysis
```

### Monitoring Setup (Optional)

```bash
# Install Sentry monitoring
npm install --save @sentry/nextjs

# Configure in app/globals.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Runner Connection Issues

**Problem**: Runner shows "offline" in GitHub

```bash
# Solution 1: Check service status
sudo systemctl status github-actions

# Solution 2: Restart service
sudo systemctl restart github-actions

# Solution 3: Check logs
sudo journalctl -u github-actions -n 100

# Solution 4: Re-authenticate runner
cd /opt/github-actions
./config.sh --url https://github.com/YOUR_ORG/festival-lights \
  --token YOUR_NEW_TOKEN
```

### Database Connection Errors

**Problem**: `ECONNREFUSED` or `timeout`

```bash
# Solution 1: Check database status
psql $DIRECT_DATABASE_URL -c "SELECT 1"

# Solution 2: Verify credentials
echo $DATABASE_URL
echo $DIRECT_DATABASE_URL

# Solution 3: Check network connectivity
nc -zv <database-host> 5432

# Solution 4: Check Prisma Accelerate
curl https://accelerate.prisma-data.net/health
```

### Deployment Failures

**Problem**: Deployment fails at migration step

```bash
# Solution 1: Check migration status
npx prisma migrate status

# Solution 2: Resolve failed migration
npx prisma migrate resolve --rolled-back <migration>

# Solution 3: Manual fix
npx prisma db execute --stdin < fix-migration.sql
npx prisma migrate deploy
```

**Problem**: Vercel deployment timeout

```bash
# Solution 1: Increase timeout in vercel.json
{
  "buildCommand": "npm run build",
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}

# Solution 2: Use Build Cache
gh secret set VERCEL_BUILD_CACHE --body "true"
```

### Secret Management Issues

**Problem**: Secret not found during deploy

```bash
# Solution 1: Verify secret exists
gh secret list

# Solution 2: Re-set secret
gh secret set NEXTAUTH_SECRET --body "value"

# Solution 3: Check workflow environment
grep -A 5 "environment:" .github/workflows/deploy.yml
```

---

## Security Best Practices

### 1. Secret Rotation

```bash
# Generate new secrets quarterly
openssl rand -base64 32  # NEXTAUTH_SECRET
# Update Vercel token
# Update database password
```

### 2. Runner Maintenance

```bash
# Keep runner updated
cd /opt/github-actions
./config.sh --update

# Review runner logs monthly
sudo tail -f /var/log/github-actions/worker.log
```

### 3. Database Backups

```bash
# Automated backups (with your database provider)
# Neon: Automatic daily backups
# AWS RDS: Enable automated backups (7-35 days)
# Supabase: Automatic backups included

# Manual backup
pg_dump $DIRECT_DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 4. Access Control

```bash
# Limit runner access
- Restrict to main branch deployments
- Require approvals for production
- Regular access reviews
- Audit logs monitoring
```

---

## Deployment Checklist

Before first production deployment:

- [ ] Self-hosted runner installed and verified
- [ ] All GitHub secrets configured
- [ ] Vercel project created and linked
- [ ] Database created and migrated
- [ ] GitHub environments created
- [ ] Approval reviewers added
- [ ] Monitoring/Sentry configured
- [ ] Slack notifications set up
- [ ] DNS/domain configured
- [ ] SSL certificate verified
- [ ] Email service verified (Resend)
- [ ] Blob storage token verified
- [ ] Test booking flow end-to-end
- [ ] Admin dashboard access verified
- [ ] Backup procedures documented
- [ ] Incident response plan ready

---

## Support & References

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Vercel Documentation**: https://vercel.com/docs
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Self-Hosted Runners**: https://docs.github.com/en/actions/hosting-your-own-runners
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

**Next**: After completing Phase 10 setup, proceed with Phase 11: Monitoring & Analytics
