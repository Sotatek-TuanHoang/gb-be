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
  amount: string;

  @Column()
  score: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
