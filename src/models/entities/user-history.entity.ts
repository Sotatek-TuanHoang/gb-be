import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_histories')
export class UserHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pool_id: number;

  @Column()
  user_address: string;

  @Column()
  pool_address: string;

  @Column()
  tx_hash: string;

  @Column()
  action: string;

  @Column()
  amount: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
