import { Module } from '@nestjs/common';
import { BgRemovalController } from './bg-removal.controller';
import { BgRemovalService } from './bg-removal.service';

@Module({
  controllers: [BgRemovalController],
  providers: [BgRemovalService],
  exports: [BgRemovalService],
})
export class BgRemovalModule {}
