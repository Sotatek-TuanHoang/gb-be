import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class userHistories1646381336601 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_histories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'pool_id',
            type: 'int',
            default: '0',
          },
          {
            name: 'user_address',
            type: 'varchar',
            default: '0',
          },
          {
            name: 'tx_hash',
            type: 'varchar',
            default: '0',
          },
          {
            name: 'action',
            type: 'varchar',
            default: '0',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'created_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
