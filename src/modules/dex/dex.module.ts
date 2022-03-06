import { Module, Logger } from '@nestjs/common';
import { DatabaseCommonRepository } from 'src/models/repositories/repository';
import { DexConsole } from 'src/modules/dex/dex.console';
import { DexController } from 'src/modules/dex/dex.controller';
import { DexService } from 'src/modules/dex/dex.service';

@Module({
  imports: [DatabaseCommonRepository, Logger],
  controllers: [DexController],
  providers: [DexService, DexConsole],
  exports: [DexService],
})
export class DexModule {}
