import { Module, Logger } from '@nestjs/common';
import Modules from 'src/modules';
import { DexModule } from 'src/modules/dex/dex.module';
@Module({
  imports: [...Modules, DexModule],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
