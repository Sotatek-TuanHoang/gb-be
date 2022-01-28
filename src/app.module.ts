import { Module, Logger } from '@nestjs/common';
import Modules from 'src/modules';
@Module({
  imports: [...Modules],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
