import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { QueryRewardDto } from './dto/query-reward.dto';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post('start')
  start() {
    return this.botsService.startQueue();
  }

  @Get('/rewards')
  getRewards(@Query() query: QueryRewardDto) {
    return this.botsService.getRewards(query);
  }

  @Get('/process')
  getAllProcess() {
    return this.botsService.getAllProcesses();
  }

  @Get('/trade/:username')
  tradeProcess(@Param('username') username: string) {
    return this.botsService.tradeProcess(username);
  }
}
