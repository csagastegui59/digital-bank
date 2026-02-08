import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountType, Currency } from '../entities/account/account.entity';
import { 
  AccountAlreadyExistsException, 
  AccountNotFoundException,
  InvalidOperationException 
} from '../common/exceptions/business.exception';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private accountsRepo: Repository<AccountEntity>,
  ) {}

  // Create initial account for new user
  async createInitialAccount(userId: string): Promise<AccountEntity> {
    const accountNumber = this.generateAccountNumber();
    
    const account = this.accountsRepo.create({
      accountNumber,
      type: AccountType.CHECKING,
      currency: Currency.USD,
      balance: '1000.00',
      ownerId: userId,
      isActive: true,
    });

    return await this.accountsRepo.save(account);
  }

  // Request new account in different currency
  async requestAccount(userId: string, currency: Currency): Promise<AccountEntity> {
    // Check if user already has an account in this currency
    const existing = await this.accountsRepo.findOne({
      where: { ownerId: userId, currency },
    });

    if (existing) {
      throw new AccountAlreadyExistsException(`You already have an account in ${currency}`);
    }

    const accountNumber = this.generateAccountNumber();
    
    const account = this.accountsRepo.create({
      accountNumber,
      type: AccountType.CHECKING,
      currency,
      balance: '0.00',
      ownerId: userId,
      isActive: false, // Requires admin approval
    });

    return await this.accountsRepo.save(account);
  }

  // Get account by ID
  async findById(accountId: string): Promise<AccountEntity> {
    const account = await this.accountsRepo.findOne({
      where: { id: accountId },
      relations: ['owner'],
    });

    if (!account) {
      throw new AccountNotFoundException();
    }

    return account;
  }

  // Get account by account number
  async findByAccountNumber(accountNumber: string): Promise<AccountEntity> {
    const account = await this.accountsRepo.findOne({
      where: { accountNumber },
      relations: ['owner'],
    });

    if (!account) {
      throw new AccountNotFoundException();
    }

    return account;
  }

  // Get user's accounts
  async findByUserId(userId: string): Promise<AccountEntity[]> {
    return await this.accountsRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'ASC' },
    });
  }

  // Get all accounts (admin only)
  async findAll(): Promise<AccountEntity[]> {
    return await this.accountsRepo.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get pending accounts (admin only)
  async findPending(): Promise<AccountEntity[]> {
    return await this.accountsRepo.find({
      where: { isActive: false },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  // Activate account (admin only)
  async activateAccount(accountId: string): Promise<AccountEntity> {
    const account = await this.findById(accountId);
    account.isActive = true;
    return await this.accountsRepo.save(account);
  }

  // Deactivate account (admin only)
  async deactivateAccount(accountId: string): Promise<AccountEntity> {
    const account = await this.findById(accountId);
    account.isActive = false;
    return await this.accountsRepo.save(account);
  }

  // Update balance (internal use)
  async updateBalance(accountId: string, newBalance: string): Promise<void> {
    const account = await this.findById(accountId);
    
    if (!account.isActive) {
      throw new InvalidOperationException('Cannot operate with inactive account');
    }

    account.balance = newBalance;
    await this.accountsRepo.save(account);
  }

  // Validate account for transaction
  async validateAccountForTransaction(accountId: string, amount: string): Promise<AccountEntity> {
    const account = await this.findById(accountId);

    if (!account.isActive) {
      throw new InvalidOperationException('Account is not active');
    }

    const balance = parseFloat(account.balance);
    const amountNum = parseFloat(amount);

    if (balance < amountNum) {
      throw new InvalidOperationException('Insufficient funds');
    }

    return account;
  }

  private generateAccountNumber(): string {
    // Generate a 16-digit account number for consistency
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return timestamp + random; // 16 digits total
  }
}
