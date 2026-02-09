import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionEntity, TxType, TxStatus } from '../entities/transactions/transaction.entity';
import { AccountsService, PaginatedResult } from '../accounts/accounts.service';
import { Currency } from '../entities/account/account.entity';
import { 
  InvalidOperationException,
  TransactionNotFoundException
} from '../common/exceptions/business.exception';

// Simulated exchange rates (in production, this would come from an external API)
const EXCHANGE_RATES = {
  USD_TO_PEN: 3.75,
  PEN_TO_USD: 0.2667,
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionsRepo: Repository<TransactionEntity>,
    private accountsService: AccountsService,
    private dataSource: DataSource,
  ) {}

  // Transfer between accounts
  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: string,
    description?: string,
  ): Promise<TransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate amount
      const amountNum = parseFloat(amount);
      if (amountNum <= 0) {
        throw new InvalidOperationException('Amount must be greater than 0');
      }

      // Round to 2 decimal places
      const roundedAmount = this.roundToTwo(amountNum).toString();

      // Get accounts
      const fromAccount = await this.accountsService.validateAccountForTransaction(
        fromAccountId,
        roundedAmount,
      );
      const toAccount = await this.accountsService.findById(toAccountId);

      if (!toAccount.isActive) {
        throw new InvalidOperationException('Destination account is not active');
      }

      // Calculate exchange rate and converted amount if needed
      let exchangeRate: string | undefined;
      let destinationAmount = roundedAmount;

      if (fromAccount.currency !== toAccount.currency) {
        const rate = this.getExchangeRate(fromAccount.currency, toAccount.currency);
        exchangeRate = rate.toString();
        const convertedAmount = amountNum * rate;
        destinationAmount = this.roundToTwo(convertedAmount).toString();
      }

      // Update balances
      const newFromBalance = this.roundToTwo(
        parseFloat(fromAccount.balance) - parseFloat(roundedAmount)
      ).toString();
      
      const newToBalance = this.roundToTwo(
        parseFloat(toAccount.balance) + parseFloat(destinationAmount)
      ).toString();

      await queryRunner.manager.update(
        'accounts',
        { id: fromAccountId },
        { balance: newFromBalance }
      );

      await queryRunner.manager.update(
        'accounts',
        { id: toAccountId },
        { balance: newToBalance }
      );

      // Create transaction record
      const idempotencyKey = this.generateIdempotencyKey();
      const transaction = this.transactionsRepo.create({
        idempotencyKey,
        accountId: fromAccountId,
        destinationAccountId: toAccountId,
        type: TxType.TRANSFER,
        amount: roundedAmount,
        exchangeRate,
        status: TxStatus.POSTED,
        description: description || `Transfer to account ${toAccount.accountNumber}`,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Get transaction by ID
  async findById(transactionId: string): Promise<TransactionEntity> {
    const transaction = await this.transactionsRepo.findOne({
      where: { id: transactionId },
      relations: ['account', 'destinationAccount', 'account.owner', 'destinationAccount.owner'],
    });

    if (!transaction) {
      throw new TransactionNotFoundException();
    }

    return transaction;
  }

  // Get all transactions (admin only)
  async findAll(): Promise<TransactionEntity[]> {
    return await this.transactionsRepo.find({
      relations: ['account', 'destinationAccount', 'account.owner', 'destinationAccount.owner'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to last 100 transactions
    });
  }

  // Get transactions by user ID
  async findByUserId(userId: string): Promise<TransactionEntity[]> {
    // Get user's accounts
    const accounts = await this.accountsService.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id);

    if (accountIds.length === 0) {
      return [];
    }

    // Get transactions where user is sender or receiver
    const transactions = await this.transactionsRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.account', 'account')
      .leftJoinAndSelect('tx.destinationAccount', 'destinationAccount')
      .leftJoinAndSelect('account.owner', 'accountOwner')
      .leftJoinAndSelect('destinationAccount.owner', 'destinationOwner')
      .where('tx.accountId IN (:...accountIds)', { accountIds })
      .orWhere('tx.destinationAccountId IN (:...accountIds)', { accountIds })
      .orderBy('tx.createdAt', 'DESC')
      .getMany();

    return transactions;
  }

  // Get transactions by account ID
  async findByAccountId(accountId: string): Promise<TransactionEntity[]> {
    return await this.transactionsRepo.find({
      where: [
        { accountId },
        { destinationAccountId: accountId },
      ],
      relations: ['account', 'destinationAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  // Search transactions with filters (admin only)
  async searchTransactions(filters: {
    transactionId?: string;
    accountId?: string;
    userId?: string;
    minAmount?: string;
    maxAmount?: string;
    currency?: Currency;
  }, page: number = 1, limit: number = 10): Promise<PaginatedResult<TransactionEntity>> {
    const queryBuilder = this.transactionsRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.account', 'account')
      .leftJoinAndSelect('tx.destinationAccount', 'destinationAccount')
      .leftJoinAndSelect('account.owner', 'accountOwner')
      .leftJoinAndSelect('destinationAccount.owner', 'destinationOwner');

    // Filter by transaction ID
    if (filters.transactionId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(filters.transactionId)) {
        queryBuilder.andWhere('tx.id = :transactionId', { transactionId: filters.transactionId });
      } else {
        // If not a valid UUID, return empty
        return { data: [], total: 0, page, totalPages: 0 };
      }
    }

    // Filter by account ID
    if (filters.accountId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(filters.accountId)) {
        queryBuilder.andWhere(
          '(tx.accountId = :accountId OR tx.destinationAccountId = :accountId)',
          { accountId: filters.accountId }
        );
      } else {
        // Try to find account by account number
        const account = await this.accountsService.findByAccountNumber(filters.accountId);
        if (account) {
          queryBuilder.andWhere(
            '(tx.accountId = :accountId OR tx.destinationAccountId = :accountId)',
            { accountId: account.id }
          );
        } else {
          return { data: [], total: 0, page, totalPages: 0 };
        }
      }
    }

    // Filter by user ID
    if (filters.userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(filters.userId)) {
        queryBuilder.andWhere(
          '(account.ownerId = :userId OR destinationAccount.ownerId = :userId)',
          { userId: filters.userId }
        );
      } else {
        return { data: [], total: 0, page, totalPages: 0 };
      }
    }

    // Filter by amount range
    if (filters.minAmount) {
      queryBuilder.andWhere('CAST(tx.amount AS DECIMAL) >= :minAmount', { 
        minAmount: parseFloat(filters.minAmount) 
      });
    }
    if (filters.maxAmount) {
      queryBuilder.andWhere('CAST(tx.amount AS DECIMAL) <= :maxAmount', { 
        maxAmount: parseFloat(filters.maxAmount) 
      });
    }

    // Filter by currency
    if (filters.currency) {
      queryBuilder.andWhere('account.currency = :currency', { currency: filters.currency });
    }

    queryBuilder.orderBy('tx.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private getExchangeRate(fromCurrency: Currency, toCurrency: Currency): number {
    if (fromCurrency === Currency.USD && toCurrency === Currency.PEN) {
      return EXCHANGE_RATES.USD_TO_PEN;
    } else if (fromCurrency === Currency.PEN && toCurrency === Currency.USD) {
      return EXCHANGE_RATES.PEN_TO_USD;
    }
    return 1; // Same currency
  }

  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }

  private generateIdempotencyKey(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
