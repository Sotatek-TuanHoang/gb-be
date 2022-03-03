import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('events_log')
export class CrawlStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from_address: string;

  @Column()
  block_number: number;

  @Column()
  event_name: string;

  @Column()
  type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
