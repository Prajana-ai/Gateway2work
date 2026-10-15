import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SecretsModule } from '../common/secrets/secrets.module';

@Global()
@Module({
  imports: [SecretsModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
