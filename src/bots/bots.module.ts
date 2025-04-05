import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bot, BotSchema } from './entities/bot.entity';
import { Rewards, RewardSchema } from './entities/reward.entity';
import {
  DailyRewardStatus,
  DailyRewardStatusSchema,
} from './entities/daily-reward-status.entity';
import { PrismaService } from '../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { BotsGateway } from './bots.gateway';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [BotsController],
  providers: [BotsService, PrismaService, BotsGateway],
})
export class BotsModule {}
