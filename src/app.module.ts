import { Module, Logger } from '@nestjs/common';
import Modules from 'src/modules';
import { OrdersConsole } from './models/repositories/index';
import { DexModule } from 'src/modules/dex/dex.module';
@Module({
  imports: [...Modules, DexModule],
  controllers: [],
  providers: [Logger, OrdersConsole],
})
export class AppModule {}
