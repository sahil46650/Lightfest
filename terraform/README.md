# Festival Lights - Terraform Infrastructure

This directory contains Terraform configuration for deploying Festival Lights infrastructure on Vercel using Infrastructure-as-Code (IaC).

## Overview

The Terraform configuration manages:
- **Vercel Projects**: Production and staging project configuration
- **Domains**: Production and staging domain setup
- **GitHub Integration**: Automatic deployment triggers from GitHub
- **Environment Variables**: Application configuration for both environments
- **Outputs**: Project IDs and URLs for GitHub Actions integration

## Prerequisites

### Local Requirements
- Terraform CLI v1.0+ ([Install](https://www.terraform.io/downloads))
- GitHub CLI (`gh`) for setting repository secrets
- Vercel account with organization access

### Access Credentials
1. **Vercel API Token**
   - Go to https://vercel.com/account/tokens
   - Create new token with full scope
   - Keep this secret and safe

2. **Vercel Organization ID**
   - Go to https://vercel.com/teams
   - Click on your organization/team
   - Copy the organization ID from the URL
   - Format: `team_XXXXXXXXXXXXXXXXX`

3. **GitHub Access**
   - Ensure you have push access to the repository
   - GitHub CLI should be authenticated: `gh auth status`

## Setup Process

### Step 1: Prepare Configuration File

```bash
# Navigate to terraform directory
cd terraform

# Copy the example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values to fill in:**
- `vercel_api_token` - Your Vercel API token
- `vercel_org_id` - Your Vercel organization ID
- `github_org` - Your GitHub organization/username
- `github_repo` - Your repository name
- `production_domain` - Your production domain (e.g., festival-lights.com)
- `staging_domain` - Your staging domain (e.g., staging.festival-lights.com)
- `nextauth_url_prod` - Production NextAuth URL
- `nextauth_url_staging` - Staging NextAuth URL

### Step 2: Initialize Terraform

```bash
# Download required providers
terraform init
```

This creates a `.terraform/` directory and downloads the Vercel provider.

### Step 3: Review the Plan

```bash
# Generate execution plan
terraform plan
```

Review the output to ensure all resources will be created correctly. You should see:
- 2 Vercel projects (production + staging)
- 1-2 project domains (production required, staging optional)
- 2 project environments
- 1 GitHub integration resource

### Step 4: Apply Configuration

```bash
# Create the infrastructure
terraform apply
```

Terraform will prompt for confirmation. Review the listed changes and type `yes` to proceed.

**Expected time:** 1-2 minutes

**Output examples:**
```
Apply complete! Resources added: 7

Outputs:

github_actions_secrets_json = {...}
github_actions_setup_commands = [
  "gh secret set VERCEL_ORG_ID --body 'team_XXXXXXXXX'",
  ...
]
production_project_name = "festival-lights"
production_url = "https://festival-lights.com"
staging_project_name = "festival-lights-staging"
staging_url = "https://staging.festival-lights.com"
vercel_org_id = "team_XXXXXXXXX"
vercel_project_id_production = "prj_XXXXXXXXX"
vercel_project_id_staging = "prj_XXXXXXXXX"
```

### Step 5: Set GitHub Actions Secrets

Copy the setup commands from the Terraform output and run them:

```bash
# Set Vercel organization ID
gh secret set VERCEL_ORG_ID --body 'team_XXXXXXXXX'

# Set production project ID
gh secret set VERCEL_PROJECT_ID --body 'prj_XXXXXXXXX'

# Set staging project ID
gh secret set VERCEL_PROJECT_ID_STAGING --body 'prj_XXXXXXXXX'

# Set Vercel token
gh secret set VERCEL_TOKEN --body 'vercel_XXXXX'
```

Verify secrets were created:
```bash
gh secret list
```

### Step 6: Set Database and Auth Secrets

These are required for deployment workflows:

```bash
# Set database URLs (replace with your actual URLs)
gh secret set DATABASE_URL --body 'postgresql://user:pass@host/dbname'
gh secret set STAGING_DATABASE_URL --body 'postgresql://user:pass@host/dbname'
gh secret set DIRECT_DATABASE_URL --body 'postgresql://user:pass@host/dbname'

# Set NextAuth secret (generate with: openssl rand -base64 32)
gh secret set NEXTAUTH_SECRET --body 'your-generated-secret'

# Set email configuration
gh secret set EMAIL_FROM --body 'bookings@festival-lights.com'
```

### Step 7: Configure Domains (DNS Setup)

After Terraform creates the domains in Vercel, configure DNS:

1. **Get Vercel Nameservers**
   - Go to https://vercel.com/dashboard
   - Select your production project
   - Go to Settings → Domains
   - Copy the nameservers provided by Vercel

2. **Update Domain Registrar**
   - Log in to your domain registrar (GoDaddy, Namecheap, etc.)
   - Update nameservers to Vercel's nameservers
   - Wait 24-48 hours for DNS propagation

3. **Verify Domain**
   - In Vercel dashboard, the domain status should change to "Valid"
   - Run health check: `curl -I https://festival-lights.com`

## File Structure

```
terraform/
├── main.tf                      # Main resource definitions
├── variables.tf                 # Input variable declarations
├── outputs.tf                   # Output value definitions
├── terraform.tfvars.example     # Configuration template
├── .gitignore                   # Git ignore rules for secrets/state
└── README.md                    # This file
```

## Configuration Files

### main.tf
Defines all Terraform resources:
- `provider "vercel"` - Vercel provider configuration
- `resource "vercel_project"` - Production and staging projects
- `resource "vercel_project_domain"` - Domain configuration
- `resource "vercel_project_environment"` - Environment setup
- `resource "vercel_github_integration"` - GitHub integration
- `locals` - Local values for computed data

### variables.tf
Input variables with validation:
- Required variables (no default value)
- Optional variables (with sensible defaults)
- Sensitive variables (marked to hide in logs)
- Variable descriptions and types

### outputs.tf
Output values exposed after apply:
- Project IDs for GitHub Actions
- URLs for verification
- Setup commands for GitHub CLI
- Domain configuration

### terraform.tfvars
Local configuration file (NOT committed to git):
- Actual values for your deployment
- Listed in .gitignore for security
- Contains sensitive credentials

## Common Operations

### View Current Infrastructure

```bash
# Show all managed resources
terraform state list

# Show detailed state of specific resource
terraform state show vercel_project.production

# Show output values
terraform output

# Get specific output
terraform output vercel_project_id_production
```

### Update Configuration

```bash
# Modify terraform.tfvars or variables
nano terraform.tfvars

# Review changes
terraform plan

# Apply changes
terraform apply
```

### Destroy Infrastructure

⚠️ **Warning**: This will delete Vercel projects and domains!

```bash
# Show what will be destroyed
terraform plan -destroy

# Permanently remove infrastructure
terraform destroy
```

### Debug Terraform

```bash
# Enable verbose logging
export TF_LOG=DEBUG
terraform plan

# Show expanded plan output
terraform plan -out=tfplan
terraform show tfplan

# Disable debug logging
unset TF_LOG
```

## State Management

### Local State (Development)
- Terraform state stored in `terraform.tfstate`
- Sensitive credentials are encrypted in state file
- **Add to .gitignore - never commit!**

### Remote State (Production)
For production deployments, use Terraform Cloud:

1. **Create Terraform Cloud Account**
   - Go to https://app.terraform.io/
   - Sign up and create organization

2. **Configure Remote Backend**
   ```hcl
   terraform {
     cloud {
       organization = "your-org"
       workspaces {
         name = "festival-lights-prod"
       }
     }
   }
   ```

3. **Authenticate**
   ```bash
   terraform login
   # Paste API token when prompted
   ```

4. **Initialize with Remote State**
   ```bash
   terraform init
   ```

## Troubleshooting

### Error: "Invalid credentials"
**Solution**: Verify Vercel API token is correct and has full scope
```bash
export TF_VAR_vercel_api_token="vercel_XXXXX"
terraform plan
```

### Error: "Organization not found"
**Solution**: Verify organization ID format
- Should start with `team_`
- Check https://vercel.com/teams for correct ID
- Ensure you're part of the organization

### Error: "Domain verification failed"
**Solution**: Check DNS configuration
- Verify nameservers are updated at domain registrar
- Wait 24-48 hours for DNS propagation
- Check Vercel dashboard: Settings → Domains → Status

### Error: "GitHub integration failed"
**Solution**: Verify GitHub repository access
- Ensure GitHub CLI is authenticated: `gh auth status`
- Verify push access to repository
- Check GitHub organization settings for Vercel app authorization

### Terraform State Corrupted
**Solution**: Restore from backup or reset
```bash
# Backup current state
cp terraform.tfstate terraform.tfstate.backup

# Remove local state (careful!)
rm terraform.tfstate*

# Re-import existing resources
terraform init
terraform plan  # This will show what needs to be created
```

## Security Best Practices

### Protecting Secrets
1. ✅ Add `terraform.tfvars` to `.gitignore`
2. ✅ Store sensitive values in environment variables
3. ✅ Use Terraform Cloud for encrypted state storage
4. ✅ Rotate API tokens regularly
5. ❌ Never commit credentials to git

### Access Control
1. Limit Vercel API token scope to minimum required
2. Use GitHub environments for approval gates
3. Restrict terraform state file access
4. Enable MFA on Vercel and GitHub accounts

### Monitoring
1. Monitor Vercel deployments in dashboard
2. Set up alerts for domain configuration changes
3. Review GitHub Actions workflow logs
4. Track Terraform apply history

## Next Steps

After successful Terraform apply:

1. **Verify Deployment**
   ```bash
   # Check production URL
   curl -I https://festival-lights.com

   # Check staging URL
   curl -I https://staging.festival-lights.com
   ```

2. **Test Deployment Pipeline**
   - Push to main branch
   - Verify GitHub Actions workflow runs
   - Confirm staging deployment succeeds
   - Manually approve production deployment

3. **Configure Monitoring**
   - Set up health checks in Vercel
   - Configure error tracking (Sentry)
   - Set up log aggregation

4. **Complete Deployment Guide**
   - See `docs/PHASE_10_DEPLOYMENT_GUIDE.md` for full setup
   - Includes self-hosted runner configuration
   - Database setup and migration procedures
   - Monitoring and maintenance tasks

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Vercel Terraform Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Vercel API Reference](https://vercel.com/docs/api)
- [GitHub CLI Reference](https://cli.github.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Terraform logs: `terraform plan -out=plan.out && terraform show plan.out`
3. Verify all required variables are set correctly
4. Check Vercel dashboard for related errors
5. Review GitHub Actions workflow logs

---

**Last Updated**: 2026-01-09
**Terraform Version**: >= 1.0
**Vercel Provider Version**: ~> 0.16
