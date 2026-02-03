import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class Init1738200000000 implements MigrationInterface {
    name = 'Init1738200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '120',
                    isNullable: false,
                },
                {
                    name: 'passwordHash',
                    type: 'varchar',
                    length: '200',
                    isNullable: false,
                },
                {
                    name: 'role',
                    type: 'enum',
                    enum: ['ADMIN', 'OPS', 'CUSTOMER'],
                    default: "'CUSTOMER'",
                    isNullable: false,
                    enumName: 'users_role_enum',
                },
                {
                    name: 'isActive',
                    type: 'boolean',
                    default: true,
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
            ],
        }), true);

        await queryRunner.createIndex('users', new TableIndex({
            name: 'IDX_97672ac88f789774dd47f7c8be',
            columnNames: ['email'],
            isUnique: true,
        }));

        // Create transactions table
        await queryRunner.createTable(new Table({
            name: 'transactions',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'idempotencyKey',
                    type: 'varchar',
                    length: '80',
                    isNullable: false,
                },
                {
                    name: 'accountId',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'type',
                    type: 'enum',
                    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'],
                    isNullable: false,
                    enumName: 'transactions_type_enum',
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 18,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['PENDING', 'POSTED', 'REVERSED'],
                    default: "'PENDING'",
                    isNullable: false,
                    enumName: 'transactions_status_enum',
                },
                {
                    name: 'description',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
            ],
        }), true);

        await queryRunner.createIndex('transactions', new TableIndex({
            name: 'IDX_86238dd0ae2d79be941104a584',
            columnNames: ['idempotencyKey'],
            isUnique: true,
        }));

        await queryRunner.createIndex('transactions', new TableIndex({
            name: 'IDX_26d8aec71ae9efbe468043cd2b',
            columnNames: ['accountId'],
        }));

        // Create accounts table
        await queryRunner.createTable(new Table({
            name: 'accounts',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'accountNumber',
                    type: 'varchar',
                    length: '24',
                    isNullable: false,
                },
                {
                    name: 'type',
                    type: 'enum',
                    enum: ['CHECKING', 'SAVINGS'],
                    isNullable: false,
                    enumName: 'accounts_type_enum',
                },
                {
                    name: 'currency',
                    type: 'enum',
                    enum: ['PEN', 'USD'],
                    isNullable: false,
                    enumName: 'accounts_currency_enum',
                },
                {
                    name: 'balance',
                    type: 'decimal',
                    precision: 18,
                    scale: 2,
                    default: '0.00',
                    isNullable: false,
                },
                {
                    name: 'ownerId',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
            ],
        }), true);

        await queryRunner.createIndex('accounts', new TableIndex({
            name: 'IDX_c57d6a982eeaa1d115687b17b6',
            columnNames: ['accountNumber'],
            isUnique: true,
        }));

        // Add foreign key
        await queryRunner.createForeignKey('accounts', new TableForeignKey({
            name: 'FK_2cb7f7a1dc3b84c8cde2b930944',
            columnNames: ['ownerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('accounts', 'FK_2cb7f7a1dc3b84c8cde2b930944');
        await queryRunner.dropTable('accounts');
        await queryRunner.dropTable('transactions');
        await queryRunner.dropTable('users');
    }

}
