import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserNames1738400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add firstname column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'firstname',
      type: 'varchar',
      length: '255',
      isNullable: false,
      default: "'Roberto'",
    }));

    // Add lastname column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'lastname',
      type: 'varchar',
      length: '255',
      isNullable: false,
      default: "'Test'",
    }));

    // Update existing users with default values (already applied by default)
    // Remove default constraint after initial values are set
    await queryRunner.changeColumn('users', 'firstname', new TableColumn({
      name: 'firstname',
      type: 'varchar',
      length: '255',
      isNullable: false,
    }));

    await queryRunner.changeColumn('users', 'lastname', new TableColumn({
      name: 'lastname',
      type: 'varchar',
      length: '255',
      isNullable: false,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove firstname column
    await queryRunner.dropColumn('users', 'firstname');

    // Remove lastname column
    await queryRunner.dropColumn('users', 'lastname');
  }
}
