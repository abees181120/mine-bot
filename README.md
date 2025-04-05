async syncData(createBotDto: CreateBotDto) {
const bots = await this.prisma.bots.findMany({});

    const mapType = (name: string): number => {
      switch (name) {
        case 'Hòm Quà Vũ Khí':
          return KeyType.WEAPON;
        case 'Hòm Quà Áo Giáp':
          return KeyType.ARMOR;
        case 'Hòm Quà Trang Sức':
          return KeyType.JEWEL;
        default:
          return -1;
      }
    };
    const mappedData = DATA.map((item) => {
      const bot = bots.find((bot) => bot.name === item.bot);
      if (!bot) {
        return null;
      }
      return {
        botId: bot.id,
        dateRewarded: new Date(),
        type: mapType(item.name.trim()),
        name: item.name.trim(),
        description: '',
        inStock: item.status === 0 ? 1 : 0, // 0 = no, 1 = yes
        star: item.star,
      };
    }).filter((item) => item !== null);

    await this.prisma.dailyRewards.createMany({
      data: mappedData,
    });

    const rewards = await this.prisma.dailyRewards.findMany({});

    return await this.prisma.dailyRewardStatus.createMany({
      data: rewards.map((reward) => ({
        botId: reward.botId,
        date: new Date(),
        status: 'rewarded',
        type: reward.type,
      })),
    });

    // return bots;
    // return DATA;

}

// private async runNextBot() {
// if (this.running >= this.maxConcurrent) return;

// const botData = await this.getNextBot();
// if (!botData) {
// console.log('✅ No more bots to run.');
// this.queueRunning = false;
// return;
// }

// const { id, username, password } = botData;

// const isDev = process.env.NODE_ENV === 'development';

// const command = isDev
// ? `${process.cwd()}/node_modules/.bin/ts-node`
// : 'node';

// const scriptPath = isDev
// ? 'src/scripts/auto-daily.ts'
// : 'dist/scripts/auto-daily.js';

// const args = [
// scriptPath,
// `--id=${id}`,
// `--username=${username}`,
// `--password=${password}`,
// ];

// const child = spawn(command, args, {
// stdio: 'pipe',
// shell: process.platform === 'win32', // nếu đang chạy Windows
// });

// this.runningBots.set(username, child); // lưu process theo username

// this.running++;
// console.log(`🚀 Started bot: ${username} (PID ${child.pid})`);

// child.stdout.on('data', (data) => {
// const message = data.toString();
// // console.log(`[${username}] ${message}`);

// if (
// message.includes('quit') ||
// message.includes('exit') ||
// message.includes('Error: client timed out after 30000 milliseconds')
// ) {
// this.runningBots.delete(username);
// console.log(`🛑 Bot ${username} exited.`);
// this.running--;
// this.runNextBot();
// return;
// }
// process.stdout.write(`[${username}] ${data}`);
// });

// child.stderr.on('data', (data) => {
// process.stderr.write(`[${username}] ERROR: ${data}`);
// });

// child.on('exit', (code) => {
// console.log(`🛑 Bot ${username} exited with code ${code}`);
// this.running--;
// this.runNextBot();
// });
// }
