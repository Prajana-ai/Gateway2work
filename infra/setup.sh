#!/usr/bin/env bash
# ============================================================
# ImpactForge Azure Infrastructure Setup
# Provisions all Azure resources for a given environment.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Azure DevOps CLI extension (az extension add --name azure-devops)
#   - Subscription selected (az account set --subscription <id>)
#
# Usage:
#   ./infra/setup.sh <environment>   (test|staging|prod)
#
# Example:
#   ./infra/setup.sh test
#   ./infra/setup.sh staging
#   ./infra/setup.sh prod
# ============================================================

set -euo pipefail

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
header() { echo -e "\n${BLUE}============================================================${NC}"; echo -e "${BLUE}  $*${NC}"; echo -e "${BLUE}============================================================${NC}"; }

# ---- Configuration ----
PROJECT_NAME="impactforge"
LOCATION="westus2"
ACR_NAME="${PROJECT_NAME}acr"

# ---- Validate arguments ----
if [[ $# -lt 1 ]]; then
    error "Usage: $0 <environment> [--clean]"
    error "  environment: test|staging|prod"
    error "  --clean: tear down existing resources before rebuilding"
    exit 1
fi

ENV="$1"
CLEAN=false
if [[ "${2:-}" == "--clean" ]]; then
    CLEAN=true
fi

if [[ "$ENV" != "test" && "$ENV" != "staging" && "$ENV" != "prod" ]]; then
    error "Invalid environment: $ENV. Must be one of: test, staging, prod"
    exit 1
fi

RG_NAME="rg-${PROJECT_NAME}-${ENV}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# Step 1: Validate Prerequisites
# ============================================================
header "Step 1: Validating Prerequisites"

# Check az CLI
if ! command -v az &> /dev/null; then
    error "Azure CLI (az) is not installed. Install from https://aka.ms/installazurecli"
    exit 1
fi
AZ_VERSION=$(az version -o json 2>/dev/null | grep -o '"azure-cli": "[^"]*"' | cut -d'"' -f4)
log "Azure CLI found: ${AZ_VERSION:-unknown}"

# Check login
if ! az account show &> /dev/null; then
    error "Not logged in to Azure. Run: az login"
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log "Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# Check Azure DevOps extension
if az extension show --name azure-devops &> /dev/null; then
    log "Azure DevOps CLI extension installed"
    ADO_AVAILABLE=true
else
    warn "Azure DevOps CLI extension not installed. Skipping ADO setup."
    warn "Install with: az extension add --name azure-devops"
    ADO_AVAILABLE=false
fi

# ============================================================
# Step 1b: Clean up existing resources (if --clean)
# ============================================================
if [[ "$CLEAN" == "true" ]]; then
    header "Cleaning Up Existing Resources"

    if az group show --name "$RG_NAME" &> /dev/null; then
        warn "Deleting resource group '$RG_NAME' and ALL resources inside it..."
        warn "This will destroy the database, app services, redis, etc. for '$ENV'"
        echo ""
        read -r -p "  Type 'yes' to confirm deletion: " CONFIRM
        if [[ "$CONFIRM" == "yes" ]]; then
            az group delete --name "$RG_NAME" --yes --no-wait --output none
            log "Resource group deletion initiated. Waiting for it to fully delete..."
            # Poll until the resource group is truly gone (az group wait is unreliable)
            for i in $(seq 1 60); do
                if ! az group show --name "$RG_NAME" &> /dev/null; then
                    break
                fi
                printf "\r  Waiting... (%ds)" "$((i * 10))"
                sleep 10
            done
            echo ""
            # Final check
            if az group show --name "$RG_NAME" &> /dev/null; then
                error "Resource group still exists after 10 minutes. It may still be deleting."
                error "Wait a few minutes and re-run: $0 $ENV"
                exit 1
            fi
            log "Resource group '$RG_NAME' deleted."
        else
            error "Aborted. No resources were deleted."
            exit 1
        fi
    else
        log "Resource group '$RG_NAME' does not exist. Nothing to clean."
    fi
fi

# ============================================================
# Step 2: Create Resource Group
# ============================================================
header "Step 2: Creating Resource Group"

if az group show --name "$RG_NAME" &> /dev/null; then
    log "Resource group '$RG_NAME' already exists"
else
    az group create \
        --name "$RG_NAME" \
        --location "$LOCATION" \
        --tags project="$PROJECT_NAME" environment="$ENV" managedBy=script compliance=hipaa \
        --output none
    log "Created resource group: $RG_NAME"
fi

# ============================================================
# Step 3: Create ACR (shared, idempotent)
# ============================================================
header "Step 3: Ensuring Azure Container Registry Exists"

# ACR lives in the first resource group created, but we check globally by name
if az acr show --name "$ACR_NAME" &> /dev/null 2>&1; then
    log "ACR '$ACR_NAME' already exists"
    ACR_RG=$(az acr show --name "$ACR_NAME" --query resourceGroup -o tsv)
    log "ACR resource group: $ACR_RG"
else
    log "Creating ACR '$ACR_NAME' in resource group '$RG_NAME'..."
    ACR_SKU="Basic"
    [[ "$ENV" == "prod" ]] && ACR_SKU="Standard"
    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RG_NAME" \
        --sku "$ACR_SKU" \
        --admin-enabled true \
        --tags project="$PROJECT_NAME" environment=shared managedBy=script \
        --output none
    log "Created ACR: $ACR_NAME"
fi

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
log "ACR login server: $ACR_LOGIN_SERVER"

# ============================================================
# Step 4: Collect Secrets
# ============================================================
header "Step 4: Collecting Secrets"

# Generate or prompt for secrets
if [[ -n "${DB_ADMIN_PASSWORD:-}" ]]; then
    log "Using DB_ADMIN_PASSWORD from environment variable"
else
    DB_ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
    warn "Generated random DB admin password (save this securely!)"
fi

if [[ -n "${JWT_SECRET:-}" ]]; then
    log "Using JWT_SECRET from environment variable"
else
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=')
    warn "Generated random JWT secret (save this securely!)"
fi

if [[ -n "${ENCRYPTION_KEY:-}" ]]; then
    log "Using ENCRYPTION_KEY from environment variable"
else
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '/+=')
    warn "Generated random encryption key (save this securely!)"
fi

# ============================================================
# Step 5: Deploy Bicep Template
# ============================================================
header "Step 5: Deploying Bicep Template"

log "Deploying to resource group: $RG_NAME"
log "Using parameter file: ${SCRIPT_DIR}/parameters/${ENV}.bicepparam"

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RG_NAME" \
    --template-file "${SCRIPT_DIR}/main.bicep" \
    --parameters "${SCRIPT_DIR}/parameters/${ENV}.bicepparam" \
    --parameters dbAdminPassword="$DB_ADMIN_PASSWORD" jwtSecret="$JWT_SECRET" encryptionKey="$ENCRYPTION_KEY" \
    --name "${PROJECT_NAME}-${ENV}-$(date +%Y%m%d%H%M%S)" \
    --output json \
    2>&1) || {
    error "Bicep deployment failed!"
    echo "$DEPLOYMENT_OUTPUT"
    exit 1
}

log "Bicep deployment succeeded"

# Extract outputs
DB_SERVER_FQDN=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.dbServerFqdn.value // empty')
DB_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.dbName.value // empty')
API_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.apiAppUrl.value // empty')
WEB_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.webAppUrl.value // empty')
REDIS_HOST=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.redisHostName.value // empty')
KV_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultName.value // empty')

# ============================================================
# Step 6: Configure PostgreSQL
# ============================================================
header "Step 6: Configuring PostgreSQL"

DB_SERVER_NAME="${PROJECT_NAME}-db-${ENV}"

log "Enabling PostgreSQL extensions (pgcrypto, pg_trgm)..."
az postgres flexible-server parameter set \
    --resource-group "$RG_NAME" \
    --server-name "$DB_SERVER_NAME" \
    --name azure.extensions \
    --value pgcrypto,pg_trgm \
    --output none 2>/dev/null || warn "Extensions may already be configured via Bicep"

log "PostgreSQL configured."
echo ""
log "To run migrations manually:"
echo "  DATABASE_URL=\"postgresql://${PROJECT_NAME}_admin:${DB_ADMIN_PASSWORD}@${DB_SERVER_FQDN}:5432/${DB_NAME}?sslmode=require\" \\"
echo "    npx --prefix apps/api node-pg-migrate up --migrations-dir apps/api/src/database/migrations --database-url-var DATABASE_URL"

# ============================================================
# Step 7: Create Azure DevOps Variable Groups
# ============================================================
header "Step 7: Azure DevOps Configuration"

if [[ "$ADO_AVAILABLE" == "true" ]]; then
    ADO_ORG="${AZURE_DEVOPS_ORG:-}"
    ADO_PROJECT="${AZURE_DEVOPS_PROJECT:-}"

    if [[ -z "$ADO_ORG" || -z "$ADO_PROJECT" ]]; then
        warn "Set AZURE_DEVOPS_ORG and AZURE_DEVOPS_PROJECT environment variables to configure ADO automatically."
        warn "Example:"
        echo "  export AZURE_DEVOPS_ORG=https://dev.azure.com/your-org"
        echo "  export AZURE_DEVOPS_PROJECT=ImpactForge"
        ADO_AVAILABLE=false
    fi
fi

VARIABLE_GROUP_NAME="${PROJECT_NAME}-${ENV}"
DATABASE_URL="postgresql://${PROJECT_NAME}_admin:${DB_ADMIN_PASSWORD}@${DB_SERVER_FQDN}:5432/${DB_NAME}?sslmode=require"

if [[ "$ADO_AVAILABLE" == "true" ]]; then
    log "Creating/updating variable group: $VARIABLE_GROUP_NAME"

    # Check if variable group exists
    EXISTING_VG=$(az pipelines variable-group list \
        --org "$ADO_ORG" \
        --project "$ADO_PROJECT" \
        --group-name "$VARIABLE_GROUP_NAME" \
        --query "[0].id" -o tsv 2>/dev/null || echo "")

    if [[ -n "$EXISTING_VG" ]]; then
        log "Variable group '$VARIABLE_GROUP_NAME' already exists (ID: $EXISTING_VG). Updating variables..."
        VG_ID="$EXISTING_VG"
    else
        VG_ID=$(az pipelines variable-group create \
            --org "$ADO_ORG" \
            --project "$ADO_PROJECT" \
            --name "$VARIABLE_GROUP_NAME" \
            --authorize true \
            --variables placeholder=true \
            --query id -o tsv)
        log "Created variable group: $VARIABLE_GROUP_NAME (ID: $VG_ID)"
    fi

    # Add/update variables
    for VAR_PAIR in \
        "DATABASE_HOST=${DB_SERVER_FQDN}" \
        "DATABASE_PORT=5432" \
        "DATABASE_USER=${PROJECT_NAME}_admin" \
        "DATABASE_NAME=${DB_NAME}" \
        "DATABASE_URL=${DATABASE_URL}" \
        "REDIS_URL=rediss://${REDIS_HOST}:6380" \
        "API_PORT=3001" \
        "NODE_ENV=${ENV}" \
        "CORS_ORIGIN=${WEB_URL}" \
        "azureSubscription=ImpactForge-Azure-${ENV}" \
        "resourceGroup=${RG_NAME}"; do

        VAR_NAME="${VAR_PAIR%%=*}"
        VAR_VALUE="${VAR_PAIR#*=}"
        az pipelines variable-group variable create \
            --org "$ADO_ORG" \
            --project "$ADO_PROJECT" \
            --group-id "$VG_ID" \
            --name "$VAR_NAME" \
            --value "$VAR_VALUE" \
            --output none 2>/dev/null || \
        az pipelines variable-group variable update \
            --org "$ADO_ORG" \
            --project "$ADO_PROJECT" \
            --group-id "$VG_ID" \
            --name "$VAR_NAME" \
            --value "$VAR_VALUE" \
            --output none 2>/dev/null || true
    done

    # Add secrets (marked as secret)
    for SECRET_PAIR in \
        "DATABASE_PASSWORD=${DB_ADMIN_PASSWORD}" \
        "JWT_SECRET=${JWT_SECRET}"; do

        SECRET_NAME="${SECRET_PAIR%%=*}"
        SECRET_VALUE="${SECRET_PAIR#*=}"
        az pipelines variable-group variable create \
            --org "$ADO_ORG" \
            --project "$ADO_PROJECT" \
            --group-id "$VG_ID" \
            --name "$SECRET_NAME" \
            --value "$SECRET_VALUE" \
            --secret true \
            --output none 2>/dev/null || \
        az pipelines variable-group variable update \
            --org "$ADO_ORG" \
            --project "$ADO_PROJECT" \
            --group-id "$VG_ID" \
            --name "$SECRET_NAME" \
            --value "$SECRET_VALUE" \
            --secret true \
            --output none 2>/dev/null || true
    done

    # Remove placeholder
    az pipelines variable-group variable delete \
        --org "$ADO_ORG" \
        --project "$ADO_PROJECT" \
        --group-id "$VG_ID" \
        --name placeholder \
        --yes --output none 2>/dev/null || true

    log "Variable group configured: $VARIABLE_GROUP_NAME"

    # ============================================================
    # Step 7b: Create Azure DevOps Environments
    # ============================================================
    log "Creating ADO environment: $ENV"
    az devops invoke \
        --org "$ADO_ORG" \
        --area distributedtask \
        --resource environments \
        --route-parameters project="$ADO_PROJECT" \
        --http-method POST \
        --api-version 7.1 \
        --in-file <(echo "{\"name\": \"${ENV}\", \"description\": \"ImpactForge ${ENV} environment\"}") \
        --output none 2>/dev/null || warn "Environment '$ENV' may already exist"

    if [[ "$ENV" == "staging" || "$ENV" == "prod" ]]; then
        warn "MANUAL STEP: Configure approval gates for the '$ENV' environment in Azure DevOps UI:"
        echo "  1. Go to Pipelines > Environments > $ENV"
        echo "  2. Click '...' > Approvals and checks"
        echo "  3. Add 'Approvals' check"
        if [[ "$ENV" == "staging" ]]; then
            echo "  4. Add 1 required approver"
        else
            echo "  4. Add 2 required approvers"
        fi
    fi
else
    warn "Skipping Azure DevOps configuration."
    echo ""
    echo "  To configure manually, create these variable groups in Azure DevOps:"
    echo "    Variable Group: $VARIABLE_GROUP_NAME"
    echo "    Variables:"
    echo "      DATABASE_HOST    = $DB_SERVER_FQDN"
    echo "      DATABASE_PORT    = 5432"
    echo "      DATABASE_USER    = ${PROJECT_NAME}_admin"
    echo "      DATABASE_NAME    = $DB_NAME"
    echo "      DATABASE_URL     = $DATABASE_URL"
    echo "      DATABASE_PASSWORD = <secret> (mark as secret)"
    echo "      JWT_SECRET       = <secret> (mark as secret)"
    echo "      REDIS_URL        = rediss://${REDIS_HOST}:6380"
    echo "      API_PORT         = 3001"
    echo "      NODE_ENV         = $ENV"
    echo "      CORS_ORIGIN      = $WEB_URL"
    echo "      azureSubscription = ImpactForge-Azure-${ENV}"
    echo "      resourceGroup    = $RG_NAME"
    echo ""
    echo "  Create these ADO Environments with approval gates:"
    if [[ "$ENV" == "test" ]]; then
        echo "    - 'test' (no approval required)"
    elif [[ "$ENV" == "staging" ]]; then
        echo "    - 'staging' (1 approver)"
    else
        echo "    - 'production' (2 approvers)"
    fi
fi

# ============================================================
# Step 8: Service Connection Instructions
# ============================================================
header "Step 8: Azure DevOps Service Connection"

echo ""
echo "  MANUAL STEP: Create an Azure DevOps service connection."
echo "  This requires admin access and cannot be fully automated."
echo ""
echo "  Steps:"
echo "    1. Go to Azure DevOps > Project Settings > Service Connections"
echo "    2. New Service Connection > Azure Resource Manager"
echo "    3. Select 'Service principal (automatic)'"
echo "    4. Scope: Subscription '$SUBSCRIPTION_NAME'"
echo "    5. Resource group: $RG_NAME"
echo "    6. Name: ImpactForge-Azure-${ENV}"
echo "    7. Check 'Grant access permission to all pipelines'"
echo ""
echo "  For ACR service connection:"
echo "    1. New Service Connection > Docker Registry"
echo "    2. Registry type: Azure Container Registry"
echo "    3. Select ACR: $ACR_NAME"
echo "    4. Name: ImpactForge-ACR"
echo ""

# ============================================================
# Step 9: Update azure-pipelines.yml TODOs
# ============================================================
header "Step 9: Updating Pipeline Variables"

PIPELINE_FILE="${SCRIPT_DIR}/../azure-pipelines.yml"

if [[ -f "$PIPELINE_FILE" ]]; then
    # Only update if TODOs are still present
    if grep -q "# TODO:" "$PIPELINE_FILE"; then
        sed -i.bak \
            -e "s|acrName: '.*'.*# TODO:.*|acrName: '${ACR_NAME}'|" \
            -e "s|acrConnection: '.*'.*# TODO:.*|acrConnection: 'ImpactForge-ACR'|" \
            "$PIPELINE_FILE"
        rm -f "${PIPELINE_FILE}.bak"
        log "Updated azure-pipelines.yml with ACR name and connection"
    else
        log "azure-pipelines.yml TODOs already resolved"
    fi
else
    warn "azure-pipelines.yml not found at expected path"
fi

# ============================================================
# Step 10: Summary
# ============================================================
header "Setup Complete - Summary"

echo ""
echo "  Environment:        $ENV"
echo "  Resource Group:     $RG_NAME"
echo "  Location:           $LOCATION"
echo ""
echo "  ACR:                $ACR_LOGIN_SERVER"
echo "  PostgreSQL Server:  $DB_SERVER_FQDN"
echo "  Database:           $DB_NAME"
echo "  API App Service:    $API_URL"
echo "  Web App Service:    $WEB_URL"
echo "  Redis:              $REDIS_HOST"
if [[ "$KV_NAME" != "N/A" ]]; then
echo "  Key Vault:          $KV_NAME"
fi
echo ""
echo "  ---- Credentials (save securely!) ----"
echo "  DB Admin User:      ${PROJECT_NAME}_admin"
echo "  DB Admin Password:  ${DB_ADMIN_PASSWORD}"
echo "  JWT Secret:         ${JWT_SECRET}"
echo "  Encryption Key:     ${ENCRYPTION_KEY}"
echo ""
echo "  ---- Next Steps ----"
echo "  1. Save the credentials above in a password manager"
echo "  2. Create ADO service connections (see Step 8 output above)"
if [[ "$ENV" == "staging" || "$ENV" == "prod" ]]; then
echo "  3. Configure ADO environment approval gates (see Step 7 output)"
fi
echo "  3. Run database migrations:"
echo "     DATABASE_URL=\"${DATABASE_URL}\" \\"
echo "       npx --prefix apps/api node-pg-migrate up \\"
echo "       --migrations-dir apps/api/src/database/migrations \\"
echo "       --database-url-var DATABASE_URL"
echo "  4. Push code to trigger the pipeline"
echo "  5. Verify: curl -sf ${API_URL}/health"
echo ""

if [[ "$ENV" == "prod" ]]; then
    warn "PRODUCTION HARDENING TODO:"
    echo "  - Enable private endpoints for PostgreSQL, Redis, ACR"
    echo "  - Configure Azure Front Door with WAF"
    echo "  - Enable Microsoft Defender for Cloud"
    echo "  - Enable diagnostic settings -> Log Analytics workspace"
    echo "  - Switch ACR from admin auth to managed identity + RBAC"
    echo "  - Enable customer-managed keys for encryption"
    echo "  - Review NSG and firewall rules"
    echo ""
fi

log "Done! Infrastructure for '$ENV' is ready."
