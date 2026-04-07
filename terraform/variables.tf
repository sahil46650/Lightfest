variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "vercel_org_id" {
  description = "Vercel organization ID"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "production_domain" {
  description = "Production domain name (e.g., festival-lights.com)"
  type        = string
}

variable "staging_domain" {
  description = "Staging domain name (e.g., staging.festival-lights.com)"
  type        = string
}

variable "nextauth_url_prod" {
  description = "NextAuth URL for production (e.g., https://festival-lights.com)"
  type        = string
}

variable "nextauth_url_staging" {
  description = "NextAuth URL for staging (e.g., https://staging.festival-lights.com)"
  type        = string
}

variable "email_from" {
  description = "Email address for sending booking confirmations"
  type        = string
  default     = "bookings@festival-lights.com"
}

variable "create_staging_domain" {
  description = "Whether to create and configure the staging domain"
  type        = bool
  default     = true
}

variable "project_name" {
  description = "Base name for the Vercel projects"
  type        = string
  default     = "festival-lights"
}

variable "environment_tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    terraform   = "true"
    project     = "festival-lights"
    managed_by  = "terraform"
  }
}
