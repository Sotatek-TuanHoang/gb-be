import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class userInfos1646365218108 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_infos',
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
            name: 'user_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'pool_id',
            type: 'int',
            default: '0',
          },
          {
            name: 'reward_debt_1',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'reward_debt_2',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'pending_reward_1',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'pending_reward_2',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'last_block',
            type: 'int',
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
            name: 'score',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: `'pending'`,
          },
          {
            name: 'txid1',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'txid2',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'signed_tx1',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'signed_tx2',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
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
          {
            name: 'current_period',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'current_score_per_block',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_infos');
  }
}
