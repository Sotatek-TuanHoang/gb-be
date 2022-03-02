import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('crawl_status')
export class CrawlStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contract_name: string;

  @Column()
  contract_address: string;

  @Column()
  block_number: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
