import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRefreshTokenToUsers1738224000000 implements MigrationInterface {
    name = 'AddRefreshTokenToUsers1738224000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'refreshTokenHash',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));

        await queryRunner.addColumn('users', new TableColumn({
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'updatedAt');
        await queryRunner.dropColumn('users', 'refreshTokenHash');
    }
}
