import { Controller, Get, UseGuards, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/users/user.entity';
import { AccountsService } from '../accounts/accounts.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private accountsService: AccountsService) {}

  @Roles(UserRole.ADMIN)
  @Get('ping')
  ping() {
    return { ok: true };
  }

  @ApiOperation({ summary: 'Get all blocked accounts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all blocked accounts' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Roles(UserRole.ADMIN)
  @Get('accounts/blocked')
  async getBlockedAccounts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return await this.accountsService.findBlocked(pageNum, limitNum);
  }

  @ApiOperation({ summary: 'Get accounts with unlock requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns accounts with unlock requests' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Roles(UserRole.ADMIN)
  @Get('accounts/unlock-requests')
  async getUnlockRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return await this.accountsService.findUnlockRequests(pageNum, limitNum);
  }

  @ApiOperation({ summary: 'Search accounts by ID, user ID, or account number (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns matching accounts' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Roles(UserRole.ADMIN)
  @Get('accounts/search')
  async searchAccounts(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    if (!query || query.trim() === '') {
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return await this.accountsService.searchAccounts(query, pageNum, limitNum);
  }

  @ApiOperation({ summary: 'Unblock an account (Admin only)' })
  @ApiResponse({ status: 200, description: 'Account unblocked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Roles(UserRole.ADMIN)
  @Patch('accounts/:accountId/unblock')
  async unblockAccount(@Param('accountId') accountId: string) {
    return await this.accountsService.unblockAccount(accountId);
  }
}
