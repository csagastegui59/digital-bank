import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPendingToAccounts1738224001000 implements MigrationInterface {
    name = 'AddIsPendingToAccounts1738224001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "isPending" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "isPending"`);
    }
}
