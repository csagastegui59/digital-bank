import { Body, Controller, Get, Param, Patch, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/users/user.entity';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/accounts.dto';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @ApiOperation({ summary: 'Get all accounts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Get()
  @Roles(UserRole.ADMIN)
  async getAllAccounts() {
    return await this.accountsService.findAll();
  }

  @ApiOperation({ summary: 'Get pending accounts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all pending accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Get('pending')
  @Roles(UserRole.ADMIN)
  async getPendingAccounts() {
    return await this.accountsService.findPending();
  }

  @ApiOperation({ summary: 'Get accounts by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Can only view own accounts' })
  @Get('user/:userId')
  async getUserAccounts(
    @Param('userId') userId: string,
    @GetUser() currentUser: any,
  ) {
    // Check authorization: admin or owner
    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== userId) {
      throw new UnauthorizedException('You can only view your own accounts');
    }

    return await this.accountsService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Request a new account' })
  @ApiResponse({ status: 201, description: 'Account request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('request')
  async requestAccount(
    @Body() dto: CreateAccountDto,
    @GetUser() user: any,
  ) {
    return await this.accountsService.requestAccount(user.userId, dto.currency);
  }

  @ApiOperation({ summary: 'Activate an account (Admin only)' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account activated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Patch(':accountId/activate')
  @Roles(UserRole.ADMIN)
  async activateAccount(@Param('accountId') accountId: string) {
    return await this.accountsService.activateAccount(accountId);
  }

  @ApiOperation({ summary: 'Deactivate an account (Admin only)' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Patch(':accountId/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivateAccount(@Param('accountId') accountId: string) {
    return await this.accountsService.deactivateAccount(accountId);
  }
}
