import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';

@Console()
@Injectable()
export class DexConsole {
  @Command({
    command: 'crawl-dex',
    description: 'Crawl event',
  })
  async handle(): Promise<void> {
    // console.log('222222222222222222222222');
  }
}
