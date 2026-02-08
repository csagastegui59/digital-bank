import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandardizeAccountNumbers1738500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero, asignar números de cuenta a las cuentas que tengan null
    const accountsWithNull = await queryRunner.query(`
      SELECT id FROM accounts WHERE "accountNumber" IS NULL
    `);

    for (const account of accountsWithNull) {
      // Generar un número de cuenta de 16 dígitos único
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const newAccountNumber = timestamp + random;

      await queryRunner.query(`
        UPDATE accounts SET "accountNumber" = $1 WHERE id = $2
      `, [newAccountNumber, account.id]);
    }

    // Obtener todas las cuentas existentes
    const accounts = await queryRunner.query(`
      SELECT id, "accountNumber" FROM accounts
    `);

    // Actualizar cada número de cuenta a 16 dígitos
    for (const account of accounts) {
      const oldAccountNumber = account.accountNumber;
      
      // Si el número tiene más de 16 dígitos, tomamos los últimos 16
      // Si tiene menos, lo rellenamos con ceros a la izquierda
      let newAccountNumber: string;
      
      if (oldAccountNumber.length > 16) {
        newAccountNumber = oldAccountNumber.slice(-16);
      } else if (oldAccountNumber.length < 16) {
        newAccountNumber = oldAccountNumber.padStart(16, '0');
      } else {
        newAccountNumber = oldAccountNumber;
      }

      // Verificar que el nuevo número no exista ya
      const exists = await queryRunner.query(`
        SELECT id FROM accounts WHERE "accountNumber" = $1 AND id != $2
      `, [newAccountNumber, account.id]);

      // Si existe, añadir sufijo único
      if (exists.length > 0) {
        const timestamp = Date.now().toString().slice(-6);
        newAccountNumber = newAccountNumber.slice(0, 10) + timestamp;
      }

      // Actualizar el número de cuenta
      await queryRunner.query(`
        UPDATE accounts SET "accountNumber" = $1 WHERE id = $2
      `, [newAccountNumber, account.id]);
    }

    // Verificar que no queden valores null antes de modificar la columna
    const nullCheck = await queryRunner.query(`
      SELECT COUNT(*) as count FROM accounts WHERE "accountNumber" IS NULL
    `);
    
    if (parseInt(nullCheck[0].count) > 0) {
      throw new Error(`Todavía hay ${nullCheck[0].count} cuentas con accountNumber null`);
    }

    // Actualizar la longitud de la columna a 16 caracteres exactos
    await queryRunner.query(`
      ALTER TABLE accounts ALTER COLUMN "accountNumber" TYPE varchar(16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar la longitud de la columna a 24 caracteres
    await queryRunner.query(`
      ALTER TABLE accounts ALTER COLUMN "accountNumber" TYPE varchar(24)
    `);
    
    // Nota: No podemos revertir los números de cuenta a sus valores originales
    // porque no los guardamos. Esta migración es irreversible en ese sentido.
  }
}
