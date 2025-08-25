import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { BgRemovalModule } from './lb-remove-image/bg-removal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BgRemovalModule,
  ],
  controllers: [AppController, ImageController],
  providers: [AppService, ImageService],
})
export class AppModule {}
