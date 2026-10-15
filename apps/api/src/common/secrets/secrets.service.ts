import { Injectable, Logger } from '@nestjs/common';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private client: SecretClient | null = null;

  private getClient(): SecretClient {
    if (this.client) return this.client;
    const vaultName = process.env.AZURE_KEYVAULT_NAME;
    if (!vaultName) {
      throw new Error(
        'AZURE_KEYVAULT_NAME is not defined — cannot fetch secrets from Key Vault',
      );
    }
    const url = `https://${vaultName}.vault.azure.net`;
    this.client = new SecretClient(url, new DefaultAzureCredential());
    return this.client;
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.getClient().getSecret(secretName);
      if (!secret.value) {
        throw new Error(`Secret ${secretName} has no value`);
      }
      return secret.value;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve secret ${secretName}: ${message}`);
      throw error;
    }
  }
}
