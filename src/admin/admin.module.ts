import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [AdminController],
})
export class AdminModule {}
