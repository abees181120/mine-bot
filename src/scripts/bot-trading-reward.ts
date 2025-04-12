import { createBot } from 'mineflayer';
import { loginGrassMineServer } from '../utils/botUtil';
import yargs from 'yargs';
import { findRewards } from '../utils/findQuest';
import { wait } from '../utils/wait';
import { prisma } from '../config/prisma';

const argv = yargs(process.argv.slice(2))
  .option('username', { type: 'string', demandOption: true })
  .option('password', { type: 'string', demandOption: true })
  .option('id', { type: 'string', demandOption: true })
  .parseSync();
let isTrading = false;

const bootstrap = async () => {
  const username = argv.username;
  const bot = createBot({
    host: 'grassmine.vn',
    username: username,
    version: '1.18.2',
  });

  const isLogin = await loginGrassMineServer(bot, username, argv.password);

  if (isLogin) {
    bot.on('windowOpen', async (window) => {
      console.log(`🪟 [${username}] Window open: ${window.title}`);

      if (window.title.includes('Trao đổi với') && !isTrading) {
        isTrading = true;

        const rewards = findRewards(window.slots);
        for (const reward of rewards) {
          if (reward) {
            console.log(`🎁 [${username}] Found reward in slot ${reward.slot}`);
            await bot.clickWindow(reward.slot, 0, 1);
            console.log(
              `🎁 [${username}] Shift-clicked reward in slot ${reward.slot}`,
            );
            await wait(200); // Delay để tránh spam
          }
        }

        await wait(1000);
        bot.clickWindow(0, 0, 0); // Accept trade

        setTimeout(async () => {
          isTrading = false;
        }, 6000);
      }
    });

    setTimeout(() => {
      bot.chat('/trade abees5');
    }, 3000);

    bot.on('message', async (message) => {
      const msg = message.toString();

      if (msg.includes('Giao dịch của bạn với abees5 đã hoàn thành')) {
        await prisma.dailyRewards.updateMany({
          where: {
            botId: argv.id,
          },
          data: {
            inStock: 0,
          },
        });
        process.exit(0);
      }
      if (msg.includes('Máu')) return;
    });

    bot.on('death', () => {
      bot.respawn();
    });

    setTimeout(
      () => {
        bot.quit();
        console.log('Bot quit after 3 minutes.');
        process.exit(0);
      },
      1000 * 60 * 3,
    ); // Thời gian chờ 3 phút
  }
};

bootstrap();
