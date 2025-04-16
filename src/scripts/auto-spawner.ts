import { createBot } from 'mineflayer';
import { loginGrassMineServer } from '../utils/botUtil';
import { wait } from '../utils/wait';
import { getNearbyBlocks } from 'src/utils/nearBy';

const bootstrap = async () => {
  const username = 'abees1';
  const bot = createBot({
    host: 'grassmine.vn',
    username: 'abees1',
    version: '1.18.2',
  });

  const isLogin = await loginGrassMineServer(bot, username, 'abeesdev', false);

  console.log('isLogin', isLogin);

  if (isLogin) {
    bot.on('kicked', (reason) => {
      console.log(`Bot kicked: ${reason}`);
      console.log('quit');
      bot.quit();
      process.exit(0);
    });

    bot.on('message', (message) => {
      const msg = message.toString();

      if (!msg.includes('Bạn đã nhận được')) return;
      console.log(`[${username}] ${msg}`);
    });

    let isInteracting = false;

    setInterval(async () => {
      if (isInteracting || !bot.entity) return;

      isInteracting = true;

      try {
        console.log('🔍 Checking nearby blocks...');
        const nearbyBlocks = getNearbyBlocks(bot, 1);
        const spawner = nearbyBlocks.find((block) => block.name === 'spawner');

        if (spawner) {
          console.log('🧱 Found spawner block', spawner.position);

          await bot.lookAt(spawner.position, true);
          await wait(500);

          const block = bot.blockAt(spawner.position);
          if (!block) {
            console.warn('⚠️ Block no longer exists.');
            return;
          }

          await bot.activateBlock(block);
          console.log('🖱️ Activated spawner');

          await wait(1000);

          const window1 = bot.currentWindow;
          if (window1) {
            bot.clickWindow(13, 1, 0); // click item
            await wait(1000);
          }

          await bot.activateBlock(block);
          await wait(500);

          const window2 = bot.currentWindow;
          if (window2) {
            bot.clickWindow(15, 0, 0);
            await wait(1000);
          }

          bot.chat('/key');
          await wait(1000);
          const window3 = bot.currentWindow;
          if (window3) {
            bot.clickWindow(3, 1, 0);
            await wait(1000);
          }
        }
      } catch (err) {
        console.error('❌ Error interacting with spawner:', err);
      } finally {
        isInteracting = false;
      }
    }, 5000); // 👈 tăng thời gian một chút để tránh spam (có thể chỉnh lại 1500–3000ms)

    bot.on('windowOpen', (window) => {
      console.log(`🪟 [${username}] Window open: ${window.title}`);
    });

    let isTrading = false;

    bot.on('death', () => {
      bot.respawn();
    });
  }
};

bootstrap();
