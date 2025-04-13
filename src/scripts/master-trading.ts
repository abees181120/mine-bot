import { createBot } from 'mineflayer';
import { loginGrassMineServer } from '../utils/botUtil';
import { wait } from '../utils/wait';

const bootstrap = async () => {
  const username = 'abees5';
  const bot = createBot({
    host: 'grassmine.vn',
    username: 'abees5',
    version: '1.18.2',
    checkTimeoutInterval: 60000,
  });

  const isLogin = await loginGrassMineServer(bot, username, 'abeesdev');

  if (isLogin) {
    bot.on('kicked', (reason) => {
      console.log(`Bot kicked: ${reason}`);
      console.log('quit');
      bot.quit();
      process.exit(0);
    });

    await wait(500); // Wait for the bot to process the command
    for (let i = 0; i < 2; i++) {
      bot.setControlState('back', true);
      await wait(200); // Move back for 200ms
      bot.setControlState('back', false);
      await wait(100); // Pause briefly between steps
    }

    bot.on('message', (message) => {
      const msg = message.toString();

      if (msg.includes('Máu')) return;
      console.log(`[${username}] ${msg}`);

      if (msg.includes('/trade accept')) {
        console.log(`🟢 [${username}] Received trade request: ${msg}`);
        const nameAccept = msg.split('/trade accept ')[1];
        bot.chat(`/trade accept ${nameAccept}`);
      }
    });

    let isTrading = false;

    bot.on('windowOpen', async (window) => {
      console.log(`🪟 [${username}] Window open: ${window.title}`);
      if (window.title.includes('Trao đổi với') && !isTrading) {
        isTrading = true;
        await wait(2000);
        bot.clickWindow(0, 0, 0); // Accept trade

        setTimeout(() => {
          isTrading = false;
        }, 6000);
      }
    });

    bot.on('death', () => {
      bot.respawn();
    });
  }
};

bootstrap();
