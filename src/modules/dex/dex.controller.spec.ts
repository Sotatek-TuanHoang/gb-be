import { Test, TestingModule } from '@nestjs/testing';
import { DexController } from './dex.controller';

describe('DexController', () => {
  let controller: DexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DexController],
    }).compile();

    controller = module.get<DexController>(DexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
