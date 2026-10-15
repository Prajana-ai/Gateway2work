using '../main.bicep'

param environment = 'test'
param location = 'westus2'
param projectName = 'impactforge'

// Secrets — these will be overridden at deploy time via --parameters on the CLI
// e.g.: az deployment group create ... --parameters dbAdminPassword='<value>' jwtSecret='<value>'
param dbAdminPassword = '' // REQUIRED: pass via CLI or pipeline variable
param jwtSecret = ''       // REQUIRED: pass via CLI or pipeline variable
param encryptionKey = ''   // Optional for test
