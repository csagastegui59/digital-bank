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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('accounts', 'isUnlockRequest');
  }
}
