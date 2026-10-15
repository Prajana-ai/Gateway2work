# ImpactForge Azure Infrastructure

Infrastructure-as-Code (Bicep) and setup automation for the ImpactForge platform.

## Prerequisites

1. **Azure CLI** (v2.50+): https://aka.ms/installazurecli
2. **Azure DevOps CLI extension**:
   ```bash
   az extension add --name azure-devops
   ```
3. **Azure subscription** with Contributor access
4. **Logged in**:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

## What Gets Created

| Resource | Naming Pattern | Test | Staging | Prod |
|----------|---------------|------|---------|------|
| Resource Group | `rg-impactforge-{env}` | Yes | Yes | Yes |
| Container Registry | `impactforgeacr` (shared) | Yes | -- | -- |
| PostgreSQL Flexible Server | `impactforge-db-{env}` | B1ms / 32GB | B1ms / 64GB | D2s_v3 / 128GB |
| App Service Plan | `asp-impactforge-{env}` | B1 | S1 | P1v3 |
| App Service - API | `impactforge-api-{env}` | Yes | + staging slot | + staging slot |
| App Service - Web | `impactforge-web-{env}` | Yes | + staging slot | + staging slot |
| Key Vault | `kv-impactforge-{env}` | -- | Yes | Yes |
| Redis Cache | `impactforge-redis-{env}` | Basic C0 | Basic C0 | Standard C1 |

## Quick Start

### Deploy Test Environment

```bash
chmod +x infra/setup.sh
./infra/setup.sh test
```

### Deploy All Environments (in order)

```bash
./infra/setup.sh test
./infra/setup.sh staging
./infra/setup.sh prod
```

### Deploy with Pre-set Secrets

```bash
export DB_ADMIN_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
export ENCRYPTION_KEY="your-encryption-key"
./infra/setup.sh staging
```

## File Structure

```
infra/
  main.bicep                    # Main Bicep template (all resources)
  modules/
    app-service.bicep           # Reusable App Service + slot module
  parameters/
    test.bicepparam             # Test environment parameters
    staging.bicepparam          # Staging environment parameters
    prod.bicepparam             # Production environment parameters
  setup.sh                      # Automated setup script
  README.md                     # This file
```

## Manual Bicep Deployment

If you prefer to deploy without the setup script:

```bash
# Create resource group
az group create --name rg-impactforge-test --location westus2

# Deploy
az deployment group create \
  --resource-group rg-impactforge-test \
  --template-file infra/main.bicep \
  --parameters infra/parameters/test.bicepparam \
  --parameters dbAdminPassword='<password>' jwtSecret='<secret>'
```

## Azure DevOps Configuration

### Service Connections (Manual)

After running setup.sh, create these service connections in Azure DevOps:

1. **Azure Resource Manager** connection:
   - Project Settings > Service Connections > New > Azure Resource Manager
   - Name: `ImpactForge-Azure-{env}` (one per environment)
   - Scope to the environment's resource group

2. **Docker Registry** connection:
   - Project Settings > Service Connections > New > Docker Registry
   - Type: Azure Container Registry
   - Name: `ImpactForge-ACR`

### Approval Gates (Manual)

Configure in Azure DevOps UI under Pipelines > Environments:

| Environment | Approvers Required |
|------------|-------------------|
| test | None |
| staging | 1 approver |
| production | 2 approvers |

Steps:
1. Go to Pipelines > Environments > select environment
2. Click "..." > Approvals and checks
3. Add "Approvals" check with the required number of approvers

### Variable Groups

The setup script creates these automatically (if ADO CLI is configured):

- `impactforge-test` - plain variables
- `impactforge-staging` - linked to Key Vault
- `impactforge-prod` - linked to Key Vault

To configure ADO CLI access:
```bash
export AZURE_DEVOPS_ORG=https://dev.azure.com/your-org
export AZURE_DEVOPS_PROJECT=ImpactForge
```

## Verifying the Setup

After deployment, verify each environment:

```bash
# Health check
curl -sf https://impactforge-api-test.azurewebsites.net/health

# Database connectivity
curl -sf https://impactforge-api-test.azurewebsites.net/health/db

# List all resources in a resource group
az resource list --resource-group rg-impactforge-test --output table
```

## Production Hardening

Before going live, complete these tasks:

- [ ] Enable private endpoints for PostgreSQL, Redis, and ACR
- [ ] Configure Azure Front Door with WAF (OWASP 3.2 ruleset)
- [ ] Enable Microsoft Defender for Cloud
- [ ] Set up diagnostic settings to Log Analytics workspace
- [ ] Switch ACR from admin auth to managed identity + RBAC
- [ ] Enable customer-managed encryption keys
- [ ] Configure Azure Monitor alerts
- [ ] Review network security groups and firewall rules
- [ ] Enable geo-redundant backups for PostgreSQL
- [ ] Set up Azure Backup for critical data

## Cost Estimates (Monthly)

| Resource | Test | Staging | Prod |
|----------|------|---------|------|
| App Service Plan | ~$13 (B1) | ~$73 (S1) | ~$138 (P1v3) |
| PostgreSQL | ~$25 (B1ms) | ~$25 (B1ms) | ~$196 (D2s_v3) |
| Redis | ~$16 (Basic C0) | ~$16 (Basic C0) | ~$81 (Standard C1) |
| ACR | ~$5 (Standard, shared) | -- | -- |
| Key Vault | -- | ~$0.03/op | ~$0.03/op |
| **Total** | **~$59** | **~$114** | **~$415** |

Estimates based on West US 2 pricing. Actual costs may vary.
