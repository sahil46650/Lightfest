terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.16"
    }
  }

  # Configure backend for state management
  # Uncomment after first apply
  # backend "s3" {
  #   bucket         = "festival-lights-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

# ============================================================================
# Vercel Project - Production
# ============================================================================
resource "vercel_project" "production" {
  name             = "festival-lights"
  git_repository = {
    type = "github"
    repo = "${var.github_org}/${var.github_repo}"
  }

  framework         = "nextjs"
  build_command     = "npm run build"
  output_directory  = ".next"
  install_command   = "npm ci"
}

# ============================================================================
# Vercel Project - Staging
# ============================================================================
resource "vercel_project" "staging" {
  name             = "festival-lights-staging"
  git_repository = {
    type = "github"
    repo = "${var.github_org}/${var.github_repo}"
  }

  framework         = "nextjs"
  build_command     = "npm run build"
  output_directory  = ".next"
  install_command   = "npm ci"
}

# ============================================================================
# Note: Default Vercel Domains
# ============================================================================
# Vercel automatically assigns default domains:
# - Production: ecomm-demo.vercel.app
# - Staging: ecomm-demo-staging.vercel.app
#
# For custom domains, configure directly in Vercel dashboard or API.
# Domain resources have been removed as Vercel manages them automatically.

# ============================================================================
# Note: Environment configuration (NODE_ENV, NEXTAUTH_URL, etc.) should be
# set via GitHub Actions secrets or the Vercel UI dashboard, not through
# Terraform, as the Vercel provider v0.16 has limited environment variable
# support.
#
# Environment variables can be set through:
# 1. GitHub Actions Secrets -> Vercel Integration
# 2. Vercel Dashboard -> Project Settings -> Environment Variables
# 3. Vercel API directly (if needed)
# ============================================================================

# ============================================================================
# Security Groups & Network Configuration
# ============================================================================

# Note: Network configuration for Vercel is handled through:
# - Project settings in Vercel UI
# - IP allowlist (if using Enterprise)
# - WAF rules (if using Enterprise)

# ============================================================================
# Local Configuration
# ============================================================================

# Store values for reference in GitHub Actions setup
locals {
  github_actions_secrets = {
    VERCEL_PROJECT_ID        = vercel_project.production.id
    VERCEL_PROJECT_ID_STAGING = vercel_project.staging.id
    VERCEL_ORG_ID            = var.vercel_org_id
  }
}
