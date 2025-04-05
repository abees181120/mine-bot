import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BotsModule } from './bots/bots.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), BotsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
