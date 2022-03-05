import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pool_infos')
export class PoolInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  start_block: string;

  @Column()
  reward_token_1: string;

  @Column()
  reward_token_2: string;

  @Column()
  reward_per_block_1: string;

  @Column()
  reward_per_block_2: string;

  @Column()
  lp_token: string;

  @Column()
  score_per_block: string;

  @Column()
  last_reward_block: string;

  @Column()
  period: string;

  @Column()
  reduction_rate: string;

  @Column()
  end_reduce_block: string;

  @Column()
  total_score: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
