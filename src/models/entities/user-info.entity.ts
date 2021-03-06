import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_infos')
export class UserInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_address: string;

  @Column()
  pool_id: number;

  @Column()
  reward_debt_1: string;

  @Column()
  reward_debt_2: string;

  @Column()
  pending_reward_1: string;

  @Column()
  pending_reward_2: string;

  @Column()
  last_block: string;

  @Column()
  current_period: string;

  @Column()
  current_score_per_block: string;

  @Column()
  amount: string;

  @Column()
  score: string;

  @Column()
  status: UserInfoStatus;

  @Column()
  txid1: string;

  @Column()
  signed_tx1: string;

  @Column()
  txid2: string;

  @Column()
  signed_tx2: string;

  @Column()
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export enum UserInfoStatus {
  Pending = 'pending',
  End = 'end',
  Claim = 'claim',
  Complete = 'complete',
  Failed = 'failed',
}
