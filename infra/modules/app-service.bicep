// ============================================================
// Module: App Service + Optional Staging Slot
// Deploys a Linux container-based App Service with optional
// staging slot for blue-green deployments.
// ============================================================

@description('Name of the App Service')
param name string

@description('Resource ID of the App Service Plan')
param appServicePlanId string

@description('Full container image reference (e.g., myacr.azurecr.io/app:tag)')
param containerImage string

@description('Application settings as key-value pairs')
param appSettings array

@description('Whether to create a staging deployment slot')
param createStagingSlot bool = false

@description('Enable AlwaysOn (not supported on Free/Shared tier)')
param alwaysOn bool = true

@description('Azure region')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Enable system-assigned managed identity')
param enableManagedIdentity bool = true

// ---- App Service ----
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: enableManagedIdentity ? {
    type: 'SystemAssigned'
  } : null
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: alwaysOn
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      http20Enabled: true
      appSettings: appSettings
    }
    clientAffinityEnabled: false
  }
}

// ---- Staging Slot (optional) ----
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = if (createStagingSlot) {
  parent: appService
  name: 'staging'
  location: location
  tags: union(tags, { slot: 'staging' })
  kind: 'app,linux,container'
  identity: enableManagedIdentity ? {
    type: 'SystemAssigned'
  } : null
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: alwaysOn
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      appSettings: appSettings
    }
    clientAffinityEnabled: false
  }
}

// ---- Outputs ----
@description('The principal ID of the App Service managed identity')
output principalId string = enableManagedIdentity ? appService.identity.principalId : ''

@description('The principal ID of the staging slot managed identity')
output stagingSlotPrincipalId string = (createStagingSlot && enableManagedIdentity) ? stagingSlot.identity.principalId : ''

@description('The default hostname of the App Service')
output defaultHostName string = appService.properties.defaultHostName

@description('The resource ID of the App Service')
output id string = appService.id
