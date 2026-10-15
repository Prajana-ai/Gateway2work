// ============================================================
// ImpactForge — Main Azure Infrastructure Template
// Provisions all resources for a given environment.
//
// Usage:
//   az deployment group create \
//     --resource-group rg-impactforge-<env> \
//     --template-file infra/main.bicep \
//     --parameters infra/parameters/<env>.bicepparam
//
// HIPAA notes:
//   - All data encrypted at rest (Azure-managed keys by default)
//   - TLS 1.2 enforced on all public endpoints
//   - TODO (prod): Enable private endpoints for PostgreSQL, Redis, ACR
//   - TODO (prod): Enable diagnostic settings -> Log Analytics
//   - TODO (prod): Enable Microsoft Defender for Cloud
// ============================================================

targetScope = 'resourceGroup'

// ---- Parameters ----

@allowed(['test', 'staging', 'prod'])
@description('Deployment environment')
param environment string

@description('Azure region for all resources')
param location string = 'westus2'

@description('Project name used in resource naming')
param projectName string = 'impactforge'

@secure()
@description('PostgreSQL administrator password')
param dbAdminPassword string

@secure()
@description('JWT signing secret for the API')
param jwtSecret string

@secure()
@description('Encryption key for sensitive data at rest')
param encryptionKey string = ''

// ---- Variables ----

var envSuffix = environment
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
  compliance: 'hipaa'
}

// SKU mappings per environment
// Test: absolute minimum for 3 users (cheapest possible Azure SKUs)
// Staging: moderate for QA
// Prod: performance + HA
var dbSkuName = environment == 'prod' ? 'Standard_D2s_v3' : 'Standard_B1ms'
var dbSkuTier = environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
var dbStorageGb = environment == 'prod' ? 128 : (environment == 'staging' ? 64 : 32)
var dbBackupRetentionDays = environment == 'prod' ? 35 : (environment == 'staging' ? 14 : 7)
var dbHaMode = environment == 'prod' ? 'ZoneRedundant' : 'Disabled'

// App Service: F1 (Free) for test, S1 for staging, P1v3 for prod
var aspSkuName = environment == 'prod' ? 'P1v3' : (environment == 'staging' ? 'S1' : 'F1')
var aspSkuTier = environment == 'prod' ? 'PremiumV3' : (environment == 'staging' ? 'Standard' : 'Free')

// Redis: skip for test (use in-memory or direct DB), Basic for staging, Standard for prod
var createRedis = environment != 'test'
var redisSkuName = environment == 'prod' ? 'Standard' : 'Basic'
var redisFamily = 'C'
var redisCapacity = environment == 'prod' ? 1 : 0

var createStagingSlot = environment == 'staging' || environment == 'prod'
// Free tier doesn't support AlwaysOn
var enableAlwaysOn = environment != 'test'
var createKeyVault = true // Secure all environments with Key Vault

var acrName = '${projectName}acr'
var dbServerName = '${projectName}-db-${envSuffix}'
var dbName = '${projectName}_${envSuffix}'
var dbAdminLogin = '${projectName}_admin'
var aspName = 'asp-${projectName}-${envSuffix}'
var apiAppName = '${projectName}-api-${envSuffix}'
var webAppName = '${projectName}-web-${envSuffix}'
var kvName = 'kv-${projectName}-${envSuffix}'
var redisName = '${projectName}-redis-${envSuffix}'

// Default container image (overridden at deploy time by pipeline)
var defaultContainerImage = '${acrName}.azurecr.io/${projectName}-api:latest'
var defaultWebImage = '${acrName}.azurecr.io/${projectName}-web:latest'

// ============================================================
// Azure Container Registry (shared, deployed in every env but
// idempotent — the setup script creates it once in the first
// resource group and the pipeline references it by name)
// ============================================================
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Standard' : 'Basic'
  }
  properties: {
    adminUserEnabled: true
    // TODO (prod): Disable admin, use managed identity + RBAC
    // TODO (prod): Enable private endpoint
  }
}

// ============================================================
// Azure Database for PostgreSQL Flexible Server
// ============================================================
resource dbServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: dbServerName
  location: location
  tags: tags
  sku: {
    name: dbSkuName
    tier: dbSkuTier
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: dbStorageGb
    }
    backup: {
      backupRetentionDays: dbBackupRetentionDays
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: dbHaMode
    }
    // HIPAA: Encryption at rest is enabled by default (Azure-managed keys)
    // TODO (prod): Enable customer-managed keys via Key Vault
    // TODO (prod): Enable private endpoint, disable public access
  }
}

// Firewall rule: Allow Azure services
resource dbFirewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: dbServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// PostgreSQL extensions configuration
resource dbExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: dbServer
  name: 'azure.extensions'
  properties: {
    value: 'pgcrypto,pg_trgm'
    source: 'user-override'
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: dbServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ============================================================
// App Service Plan
// ============================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: aspName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: aspSkuName
    tier: aspSkuTier
  }
  properties: {
    reserved: true // Required for Linux
  }
}

// ============================================================
// Azure Cache for Redis
// ============================================================
resource redis 'Microsoft.Cache/redis@2023-08-01' = if (createRedis) {
  name: redisName
  location: location
  tags: tags
  properties: {
    sku: {
      name: redisSkuName
      family: redisFamily
      capacity: redisCapacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
    // TODO (prod): Enable private endpoint
  }
}

// ============================================================
// Azure Key Vault (staging + prod only)
// ============================================================
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = if (createKeyVault) {
  name: kvName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    // Access policies are added after App Services are created (see below)
    accessPolicies: []
  }
}

// Key Vault secrets
resource secretDbPassword 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (createKeyVault) {
  parent: keyVault
  name: 'DATABASE-PASSWORD'
  properties: {
    value: dbAdminPassword
    contentType: 'text/plain'
  }
}

resource secretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (createKeyVault) {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: jwtSecret
    contentType: 'text/plain'
  }
}

resource secretEncryptionKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (createKeyVault) {
  parent: keyVault
  name: 'ENCRYPTION-KEY'
  properties: {
    value: encryptionKey
    contentType: 'text/plain'
  }
}

resource secretDbUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (createKeyVault) {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: 'postgresql://${dbAdminLogin}:${dbAdminPassword}@${dbServerName}.postgres.database.azure.com:5432/${dbName}?sslmode=require'
    contentType: 'text/plain'
  }
}

// ============================================================
// App Service — API
// ============================================================

// Build app settings for API
var apiBaseSettings = [
  { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acrName}.azurecr.io' }
  { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
  { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
  { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' }
  { name: 'DATABASE_HOST', value: '${dbServerName}.postgres.database.azure.com' }
  { name: 'DATABASE_PORT', value: '5432' }
  { name: 'DATABASE_USER', value: dbAdminLogin }
  { name: 'DATABASE_NAME', value: dbName }
  { name: 'REDIS_URL', value: '' } // Overridden below for envs with Redis
  { name: 'API_PORT', value: '3001' }
  { name: 'WEBSITES_PORT', value: '3001' }
  { name: 'CORS_ORIGIN', value: 'https://${webAppName}.azurewebsites.net' }
  { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : environment }
]

// For test env, pass secrets directly; for staging/prod use Key Vault references
var apiSecretsTest = [
  { name: 'DATABASE_PASSWORD', value: dbAdminPassword }
  { name: 'JWT_SECRET', value: jwtSecret }
  { name: 'DATABASE_URL', value: 'postgresql://${dbAdminLogin}:${dbAdminPassword}@${dbServerName}.postgres.database.azure.com:5432/${dbName}?sslmode=require' }
]

var apiSecretsKeyVault = [
  { name: 'DATABASE_PASSWORD', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=DATABASE-PASSWORD)' }
  { name: 'JWT_SECRET', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=JWT-SECRET)' }
  { name: 'ENCRYPTION_KEY', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=ENCRYPTION-KEY)' }
  { name: 'DATABASE_URL', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=DATABASE-URL)' }
]

var apiRedisSettings = createRedis ? [
  { name: 'REDIS_URL', value: 'rediss://:${redis.listKeys().primaryKey}@${redisName}.redis.cache.windows.net:6380' }
] : []

var apiSecrets = createKeyVault ? apiSecretsKeyVault : apiSecretsTest
var apiAppSettings = concat(apiBaseSettings, apiSecrets, apiRedisSettings)

module apiApp 'modules/app-service.bicep' = {
  name: 'deploy-${apiAppName}'
  params: {
    name: apiAppName
    location: location
    appServicePlanId: appServicePlan.id
    containerImage: defaultContainerImage
    appSettings: apiAppSettings
    createStagingSlot: createStagingSlot
    alwaysOn: enableAlwaysOn
    tags: union(tags, { service: 'api' })
  }
}

// ============================================================
// App Service — Web (Next.js frontend)
// ============================================================
var webAppSettings = [
  { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acrName}.azurecr.io' }
  { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
  { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
  { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' }
  { name: 'NEXT_PUBLIC_API_URL', value: 'https://${apiAppName}.azurewebsites.net/v1' }
  { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : environment }
  { name: 'WEBSITES_PORT', value: '3000' }
]

module webApp 'modules/app-service.bicep' = {
  name: 'deploy-${webAppName}'
  params: {
    name: webAppName
    location: location
    appServicePlanId: appServicePlan.id
    containerImage: defaultWebImage
    appSettings: webAppSettings
    createStagingSlot: createStagingSlot
    alwaysOn: enableAlwaysOn
    tags: union(tags, { service: 'web' })
  }
}

// ============================================================
// Key Vault Access Policies for App Services (staging + prod)
// Grants the App Service managed identities GET permission on secrets
// ============================================================
resource kvAccessPolicyApi 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = if (createKeyVault) {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: apiApp.outputs.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: createStagingSlot ? apiApp.outputs.stagingSlotPrincipalId : apiApp.outputs.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// ============================================================
// Azure Front Door (prod only — placeholder)
// TODO: Provision Azure Front Door with:
//   - Custom domain: impactforge.app / api.impactforge.app
//   - WAF policy (OWASP 3.2 ruleset)
//   - CDN caching for static assets
//   - Health probes -> App Service backends
//   - SSL certificate (managed)
// ============================================================

// ============================================================
// Outputs
// ============================================================
output acrLoginServer string = acr.properties.loginServer
output dbServerFqdn string = dbServer.properties.fullyQualifiedDomainName
output dbName string = dbName
output apiAppUrl string = 'https://${apiApp.outputs.defaultHostName}'
output webAppUrl string = 'https://${webApp.outputs.defaultHostName}'
output redisHostName string = createRedis ? redis.properties.hostName : 'none'
output keyVaultName string = createKeyVault ? keyVault.name : 'none'
output keyVaultUri string = createKeyVault ? keyVault.properties.vaultUri : 'none'
