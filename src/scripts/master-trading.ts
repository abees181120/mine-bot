import { createBot } from 'mineflayer';
import { loginGrassMineServer } from '../utils/botUtil';
import { wait } from '../utils/wait';

const bootstrap = async () => {
  const username = 'abees5';
  const bot = createBot({
    host: 'grassmine.vn',
    username: 'abees5',
    version: '1.18.2',
  });

  const isLogin = await loginGrassMineServer(bot, username, 'abeesdev');

  if (isLogin) {
    bot.on('kicked', (reason) => {
      console.log(`Bot kicked: ${reason}`);
      console.log('quit');
      bot.quit();
      process.exit(0);
    });

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
