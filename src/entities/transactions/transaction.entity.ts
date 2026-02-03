import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccountEntity } from '../account/account.entity';

export enum TxType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  TRANSFER = 'TRANSFER',
}

export enum TxStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  idempotencyKey: string;

  @Index()
  @Column()
  accountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  // For transfers
  @Column({ nullable: true })
  destinationAccountId?: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'destinationAccountId' })
  destinationAccount?: AccountEntity;

  @Column({ type: 'enum', enum: TxType })
  type: TxType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  // Exchange rate for cross-currency transfers
  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: string;

  @Column({ type: 'enum', enum: TxStatus, default: TxStatus.PENDING })
  status: TxStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;
}
