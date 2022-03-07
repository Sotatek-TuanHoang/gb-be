import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chain_infos')
export class ChainInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  current_block: string;

  @Column()
  max_block: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
