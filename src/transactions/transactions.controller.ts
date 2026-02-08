import { Body, Controller, Get, Param, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/users/user.entity';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transactions.dto';
import { GetUser } from '../auth/get-user.decorator';
import { AccountsService } from '../accounts/accounts.service';

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private accountsService: AccountsService,
  ) {}

  @ApiOperation({ summary: 'Get all transactions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Get()
  @Roles(UserRole.ADMIN)
  async getAllTransactions() {
    return await this.transactionsService.findAll();
  }

  @ApiOperation({ summary: 'Get transactions by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only view own transactions' })
  @Get('user/:userId')
  async getUserTransactions(
    @Param('userId') userId: string,
    @GetUser() currentUser: any,
  ) {
    // Check authorization: admin or owner
    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== userId) {
      throw new ForbiddenException('You can only view your own transactions');
    }

    return await this.transactionsService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Create a transfer between accounts' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only transfer from own accounts' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Post('transfer')
  async transfer(
    @Body() dto: TransferDto,
    @GetUser() user: any,
  ) {
    // Verify that the user owns the source account
    const fromAccount = await this.accountsService.findById(dto.fromAccountId);
    
    if (fromAccount.ownerId !== user.userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only transfer from your own accounts');
    }

    // Find destination account by account number
    const toAccount = await this.accountsService.findByAccountNumber(dto.toAccountNumber);

    return await this.transactionsService.transfer(
      dto.fromAccountId,
      toAccount.id,
      dto.amount.toString(),
      dto.description,
    );
  }
}
