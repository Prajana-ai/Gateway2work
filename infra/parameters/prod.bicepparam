using '../main.bicep'

param environment = 'prod'
param location = 'westus2'
param projectName = 'impactforge'

// Secrets — MUST be passed at deploy time via CLI or pipeline variables
// e.g.: az deployment group create ... --parameters dbAdminPassword='<value>' jwtSecret='<value>' encryptionKey='<value>'
param dbAdminPassword = '' // REQUIRED: pass via CLI or pipeline variable
param jwtSecret = ''       // REQUIRED: pass via CLI or pipeline variable
param encryptionKey = ''   // REQUIRED for staging/prod
