import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class poolInfos1646364503477 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pool_infos',
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
            name: 'start_block',
            type: 'int',
            default: '0',
          },
          {
            name: 'reward_token_1',
            type: 'varchar',
            default: '0',
          },
          {
            name: 'reward_token_2',
            type: 'varchar',
            default: '0',
          },
          {
            name: 'reward_per_block_1',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'reward_per_block_2',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'lp_token',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lp_token_amount',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'score_per_block',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'last_reward_block',
            type: 'int',
            default: '0',
          },
          {
            name: 'period',
            type: 'int',
            default: '0',
          },
          {
            name: 'reduction_rate',
            type: 'decimal',
            precision: 40,
            scale: 0,
            default: '0',
          },
          {
            name: 'end_reduce_block',
            type: 'int',
            default: '0',
          },
          {
            name: 'total_score',
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
    await queryRunner.dropTable('pool_infos');
  }
}
