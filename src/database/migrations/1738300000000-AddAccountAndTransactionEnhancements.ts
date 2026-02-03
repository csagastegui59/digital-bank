import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddAccountAndTransactionEnhancements1738300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isActive column to accounts
    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'isActive',
      type: 'boolean',
      default: true,
      isNullable: false,
    }));

    // Add destinationAccountId to transactions
    await queryRunner.addColumn('transactions', new TableColumn({
      name: 'destinationAccountId',
      type: 'uuid',
      isNullable: true,
    }));

    // Add exchangeRate to transactions
    await queryRunner.addColumn('transactions', new TableColumn({
      name: 'exchangeRate',
      type: 'decimal',
      precision: 18,
      scale: 6,
      isNullable: true,
    }));

    // Add foreign key for destinationAccountId
    await queryRunner.createForeignKey('transactions', new TableForeignKey({
      name: 'FK_transactions_destination_account',
      columnNames: ['destinationAccountId'],
      referencedTableName: 'accounts',
      referencedColumnNames: ['id'],
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    }));

    // Add index for destinationAccountId
    await queryRunner.createIndex('transactions', new TableIndex({
      name: 'IDX_transactions_destination_account',
      columnNames: ['destinationAccountId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.dropIndex('transactions', 'IDX_transactions_destination_account');

    // Remove foreign key
    await queryRunner.dropForeignKey('transactions', 'FK_transactions_destination_account');

    // Remove columns from transactions
    await queryRunner.dropColumn('transactions', 'exchangeRate');
    await queryRunner.dropColumn('transactions', 'destinationAccountId');

    // Remove column from accounts
    await queryRunner.dropColumn('accounts', 'isActive');
  }
}
