import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class crawlStatus1643362782714 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'crawl_status',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: false,
            isNullable: false,
          },
          {
            name: 'contract_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'contract_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'block_number',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('crawl_status');
  }
}
