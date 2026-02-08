import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUnlockRequestToAccounts1738600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'isUnlockRequest',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'blockedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'unlockRequestedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('accounts', 'unlockRequestedAt');
    await queryRunner.dropColumn('accounts', 'blockedAt');
    await queryRunner.dropColumn('accounts', 'isUnlockRequest');
  }
}
