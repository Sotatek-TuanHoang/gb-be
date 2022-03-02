import { EntityRepository, Repository } from 'typeorm';
import { CrawlStatus } from 'src/models/entities/crawler-status.entity';

@EntityRepository(CrawlStatus)
export class CrawlStatusRepository extends Repository<CrawlStatus> {}
