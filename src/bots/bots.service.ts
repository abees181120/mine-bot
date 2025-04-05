import { Injectable, NotFoundException } from '@nestjs/common';
import { decrypt } from '../utils/crypto';
import { PrismaService } from '../prisma.service';
import { fork, spawn } from 'child_process';
import { QueryRewardDto } from './dto/query-reward.dto';
import { BotsGateway } from './bots.gateway';
import * as path from 'path';

@Injectable()
export class BotsService {
  constructor(
    private prisma: PrismaService,
    private gateway: BotsGateway,
  ) {}

  private maxConcurrent = process.env.MAX_CONCURRENT
    ? +process.env.MAX_CONCURRENT
    : 1;
  private running = 0;
  private queueRunning = false;
  private runningBots: Map<string, ReturnType<typeof spawn>> = new Map();
  private masterTradingBot: ReturnType<typeof spawn> | null = null;

  private async getNextBot() {
    console.log('maxConcurrent', this.maxConcurrent);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handled = await this.prisma.dailyRewardStatus.findMany({
      where: { date: { gte: today } },
      select: { botId: true },
    });

    const handledIds = handled.map((r) => r.botId);

    const bot = await this.prisma.bots.findFirst({
      where: { id: { notIn: handledIds } },
    });

    if (!bot) return null;

    await this.prisma.dailyRewardStatus.create({
      data: {
        botId: bot.id,
        date: new Date(),
        status: 'pending',
        type: 1, // 1 là daily quest
      },
    });

    return {
      id: bot.id,
      username: bot.name,
      password: decrypt(bot.password),
    };
  }

  async startQueue() {
    if (this.queueRunning) return;

    this.queueRunning = true;
    for (let i = 0; i < this.maxConcurrent; i++) {
      await this.runNextBot();
    }

    return { message: '✅ Bot queue started.' };
  }

  // private async runNextBot() {
  //   if (this.running >= this.maxConcurrent) return;

  //   const botData = await this.getNextBot();
  //   if (!botData) {
  //     if (this.running === 0) {
  //       this.queueRunning = false;
  //     }
  //     return;
  //   }

  //   const { id, username, password } = botData;

  //   const isDev = process.env.NODE_ENV === 'development';

  //   const command = isDev
  //     ? `${process.cwd()}/node_modules/.bin/ts-node`
  //     : 'node';

  //   const scriptPath = isDev
  //     ? 'src/scripts/auto-daily.ts'
  //     : 'dist/scripts/auto-daily.js';

  //   const args = [
  //     scriptPath,
  //     `--id=${id}`,
  //     `--username=${username}`,
  //     `--password=${password}`,
  //   ];

  //   const child = spawn(command, args, {
  //     stdio: 'pipe',
  //     shell: process.platform === 'win32',
  //   });

  //   this.runningBots.set(username, child);
  //   this.running++;
  //   console.log(`🚀 Started bot: ${username} (PID ${child.pid})`);

  //   // ⏱️ Timeout tự kill sau 5 phút
  //   const timeout = setTimeout(
  //     () => {
  //       if (!child.killed) {
  //         console.log(`⏰ [${username}] Timeout 5m - Killing PID ${child.pid}`);
  //         child.kill('SIGTERM');
  //         this.runningBots.delete(username);
  //         this.running = Math.max(0, this.running - 1);
  //         this.gateway.processKill(username, {
  //           message: 'Timeout 5m',
  //           pid: child.pid,
  //           username,
  //           status: 'stopped',
  //         });
  //         this.runNextBot();
  //       }
  //     },
  //     5 * 60 * 1000,
  //   ); // 5 phút

  //   child.stdout.on('data', (data) => {
  //     const message = data.toString();

  //     this.gateway.sendBotLog(username, {
  //       message: message.toString(),
  //       pid: child.pid,
  //       username,
  //       status: 'running',
  //     });
  //     process.stdout.write(`[${username}] ${data}`);
  //   });

  //   child.stderr.on('data', (data) => {
  //     process.stderr.write(`[${username}] ERROR: ${data}`);
  //   });

  //   child.on('exit', (code, signal) => {
  //     clearTimeout(timeout);

  //     this.runningBots.delete(username);
  //     this.running = Math.max(0, this.running - 1);

  //     const reason =
  //       signal === 'SIGTERM'
  //         ? 'killed (SIGTERM)'
  //         : code === 0
  //           ? 'exited normally'
  //           : `exited with code ${code}`;

  //     console.log(`🛑 Bot ${username} ${reason}`);

  //     this.gateway.processKill(username, {
  //       message: `Bot ${reason}`,
  //       pid: child.pid,
  //       username,
  //       status: 'stopped',
  //     });

  //     this.runNextBot(); // ✅ gọi đúng lúc và chỉ gọi 1 lần
  //   });

  //   this.gateway.processStart(username, {
  //     message: 'Bot started',
  //     pid: child.pid,
  //     username,
  //     status: 'running',
  //   });
  // }

  private async runNextBot() {
    if (this.running >= this.maxConcurrent) return;

    const botData = await this.getNextBot();
    if (!botData) {
      if (this.running === 0) {
        this.queueRunning = false;
      }
      return;
    }

    const { id, username, password } = botData;

    const isDev = process.env.NODE_ENV === 'development';

    const scriptPath = isDev
      ? path.resolve('src/scripts/auto-daily.ts')
      : path.resolve('dist/scripts/auto-daily.js');

    const args = [
      `--id=${id}`,
      `--username=${username}`,
      `--password=${password}`,
    ];

    const child = fork(scriptPath, args, {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      execArgv: isDev ? ['-r', 'ts-node/register'] : [],
    });

    this.runningBots.set(username, child);
    this.running++;
    console.log(`🚀 Started bot: ${username} (PID ${child.pid})`);

    // Emit start
    this.gateway.processStart(username, {
      message: 'Bot started',
      pid: child.pid,
      username,
      status: 'running',
    });

    // Log stdout
    child.stdout?.on('data', (data) => {
      const message = data.toString();
      this.gateway.sendBotLog(username, {
        message,
        pid: child.pid,
        username,
        status: 'running',
      });
      process.stdout.write(`[${username}] ${message}`);
    });

    // Log stderr
    child.stderr?.on('data', (data) => {
      process.stderr.write(`[${username}] ERROR: ${data}`);
    });

    // IPC communication (optional)
    child.on('message', (msg) => {
      console.log(`[${username}] IPC message:`, msg);
    });

    // Timeout kill sau 5 phút
    const timeout = setTimeout(
      () => {
        if (child.exitCode === null) {
          console.log(`⏰ [${username}] Timeout 5m - Killing PID ${child.pid}`);
          child.kill();
          this.gateway.processKill(username, {
            message: 'Timeout 5m',
            pid: child.pid,
            username,
            status: 'stopped',
          });
        }
      },
      5 * 60 * 1000,
    );

    child.on('exit', (code, signal) => {
      clearTimeout(timeout);

      const reason =
        signal === 'SIGTERM'
          ? 'killed (SIGTERM)'
          : code === 0
            ? 'exited normally'
            : `exited with code ${code}`;

      console.log(`🛑 Bot ${username} ${reason}`);

      this.runningBots.delete(username);
      this.running = Math.max(0, this.running - 1);

      this.gateway.processKill(username, {
        message: `Bot ${reason}`,
        pid: child.pid,
        username,
        status: 'stopped',
      });

      this.runNextBot();
    });
  }

  async stopBot(username: string): Promise<{ message: string }> {
    const botProcess = this.runningBots.get(username);

    if (!botProcess) {
      return { message: `❌ Bot ${username} is not running.` };
    }

    botProcess.kill('SIGTERM'); // hoặc 'SIGKILL' nếu cần ép

    this.runningBots.delete(username);
    this.running = Math.max(0, this.running - 1); // giảm đếm để slot trống

    console.log(`🛑 Stopped bot: ${username}`);
    return { message: `✅ Bot ${username} stopped.` };
  }

  async getAllProcesses() {
    const processes = Array.from(this.runningBots.entries()).map(
      ([username, child]) => ({
        username,
        pid: child.pid,
        status: child.killed ? 'stopped' : 'running',
      }),
    );

    return processes;
  }

  async getRewards(query: QueryRewardDto) {
    const { page = 1, limit = 10, type } = query;
    const offset = (page - 1) * +limit;

    const grouped = await this.prisma.dailyRewards.groupBy({
      by: ['botId'],
      _max: { star: true },
      orderBy: {
        _max: {
          star: 'desc',
        },
      },
      where: {
        inStock: 1,
        ...(type ? { type } : {}),
      },
      take: +limit,
      skip: offset,
    });

    // Lọc ra các group có _max.star hợp lệ
    const filteredGroups = grouped.filter((g) => g._max.star !== null);

    const botIds = filteredGroups.map((g) => g.botId);

    const rewards = await this.prisma.dailyRewards.findMany({
      where: {
        OR: filteredGroups.map((g) => ({
          botId: g.botId,
          star: g._max.star ?? undefined, // tránh null
        })),
        inStock: 1,
        ...(type ? { type } : {}),
      },
      orderBy: {
        star: 'desc',
      },
    });
    // 3. Lấy thông tin bot
    const bots = await this.prisma.bots.findMany({
      where: { id: { in: botIds } },
    });

    const botMap = new Map(
      bots.map((bot) => [bot.id, { name: bot.name, id: bot.id }]),
    );

    const result = rewards.map((reward) => ({
      ...reward,
      bot: botMap.get(reward.botId),
    }));

    return result;
  }

  async tradeProcess(username: string) {
    const isDev = process.env.NODE_ENV === 'development';

    const masterScriptPath = isDev
      ? path.resolve('src/scripts/master-trading.ts')
      : path.resolve('dist/scripts/master-trading.js');

    // ⚙️ Khởi động master trading bot nếu chưa có
    if (!this.masterTradingBot) {
      const master = fork(masterScriptPath, [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: isDev ? ['-r', 'ts-node/register'] : [],
      });

      this.masterTradingBot = master;

      master.stdout?.on('data', (data) => {
        console.log(`[Master] ${data.toString()}`);
      });

      master.stderr?.on('data', (data) => {
        console.error(`[Master ERROR] ${data.toString()}`);
      });

      master.on('exit', (code) => {
        console.log(`Master trading bot exited with code ${code}`);
        this.masterTradingBot = null;
      });
    }

    const bot = await this.prisma.bots.findFirst({
      where: { name: username },
    });

    if (!bot) {
      throw new NotFoundException(`Bot ${username} not found`);
    }

    return new Promise((resolve, reject) => {
      const tradeBotScriptPath = isDev
        ? path.resolve('src/scripts/bot-trading-reward.ts')
        : path.resolve('dist/scripts/bot-trading-reward.js');

      const args = [
        `--username=${bot.name}`,
        `--password=${decrypt(bot.password)}`,
        `--id=${bot.id}`,
      ];

      const child = fork(tradeBotScriptPath, args, {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: isDev ? ['-r', 'ts-node/register'] : [],
      });

      child.stdout?.on('data', (data) => {
        console.log(`[Trade:${username}] ${data.toString()}`);
      });

      child.stderr?.on('data', (data) => {
        console.error(`[Trade:${username} ERROR] ${data.toString()}`);
      });

      child.on('exit', (code) => {
        console.log(`Trading bot [${username}] exited with code ${code}`);
        resolve({ message: 'Trading bot stopped', code });
      });

      child.on('error', (err) => {
        console.error(`Error in trading bot [${username}]:`, err);
        reject(err);
      });
    });
  }
  onModuleDestroy() {
    this.queueRunning = false;
    this.runningBots.forEach((child, username) => {
      child.kill('SIGTERM');
      console.log(`🛑 Stopped bot: ${username}`);
    });
  }
}
