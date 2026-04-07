# ============================================================================
# Vercel Project IDs (required for GitHub Actions)
# ============================================================================

output "vercel_project_id_production" {
  value       = vercel_project.production.id
  description = "Production Vercel project ID for GitHub Actions VERCEL_PROJECT_ID secret"
}

output "vercel_project_id_staging" {
  value       = vercel_project.staging.id
  description = "Staging Vercel project ID for GitHub Actions VERCEL_PROJECT_ID_STAGING secret"
}

output "vercel_org_id" {
  value       = var.vercel_org_id
  description = "Vercel organization ID for GitHub Actions VERCEL_ORG_ID secret"
}

# ============================================================================
# Deployment URLs
# ============================================================================

output "production_url" {
  value       = "https://${var.production_domain}"
  description = "Production deployment URL"
}

output "staging_url" {
  value       = "https://${var.staging_domain}"
  description = "Staging deployment URL"
}

output "production_project_name" {
  value       = vercel_project.production.name
  description = "Production Vercel project name"
}

output "staging_project_name" {
  value       = vercel_project.staging.name
  description = "Staging Vercel project name"
}

# ============================================================================
# GitHub Actions Setup Helper
# ============================================================================

output "github_actions_secrets_json" {
  value       = jsonencode(local.github_actions_secrets)
  description = "JSON of GitHub Actions secrets - use with 'gh secret set' commands"
  sensitive   = false
}

output "github_actions_setup_commands" {
  value = [
    "# Set GitHub Actions secrets using gh cli:",
    "# Run these commands in your repository directory:",
    "gh secret set VERCEL_ORG_ID --body '${var.vercel_org_id}'",
    "gh secret set VERCEL_PROJECT_ID --body '${vercel_project.production.id}'",
    "gh secret set VERCEL_PROJECT_ID_STAGING --body '${vercel_project.staging.id}'",
  ]
  description = "GitHub CLI commands to set required secrets after Terraform apply"
}

# ============================================================================
# Domain Configuration (Vercel-managed)
# ============================================================================

output "production_domain" {
  value       = var.production_domain
  description = "Production domain (automatically assigned by Vercel)"
}

output "staging_domain" {
  value       = var.staging_domain
  description = "Staging domain (automatically assigned by Vercel)"
}

# ============================================================================
# Post-Deployment Configuration
# ============================================================================

output "next_steps" {
  value = [
    "1. Apply Terraform: terraform apply",
    "2. Copy output values above into GitHub Actions secrets using the gh cli commands",
    "3. Set environment variables in Vercel dashboard for both projects",
    "4. Configure database URLs as secrets in GitHub repository",
    "5. Configure NextAuth secret in GitHub repository secrets",
    "6. Run initial deployment from GitHub Actions or git push to main",
    "7. Verify application health at production_url and staging_url",
  ]
  description = "Next steps after successful Terraform apply"
}
