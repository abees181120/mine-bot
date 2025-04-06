import { createBot } from 'mineflayer';
import { loginGrassMineServer } from '../utils/botUtil';
import { wait } from '../utils/wait';
import { prisma } from '../config/prisma';

async function registerBot(username: string) {
  const bot = createBot({
    host: 'grassmine.vn',
    username,
    version: '1.18.2',
  });

  const isLogin = await loginGrassMineServer(
    bot,
    username,
    'abeesdev',
    true,
    true,
  );
  console.log('isLogin', isLogin);

  if (!isLogin) return;

  bot.on('kicked', (reason) => {
    console.log(`Bot kicked: ${reason}`);
    bot.quit();
    createBotWithRandomName(); // Retry with new name
    process.exit(0);
  });

  bot.on('message', (message) => {
    const msg = message.toString();
    if (msg.includes('Bạn đã nhận được')) {
      console.log(`[${username}] ${msg}`);
    }
  });

  bot.chat('/class');
  await wait(2000);

  const window = bot.currentWindow;

  if (window?.title.includes('Chọn Tộc Hệ')) {
    await bot.clickWindow(12, 0, 0);
    await wait(1000);
  }

  if (bot.currentWindow?.title?.includes('Xác Nhận')) {
    await bot.clickWindow(12, 0, 0);
    await wait(1000);
    bot.chat('/voucher redeem grass');
    await wait(1000);

    await prisma.$connect();
    await prisma.bots.create({
      data: {
        name: bot.username,
        password: '7b0d84fc0a66e9bc72a48047fa9f5eb4',
      },
    });
    await prisma.$disconnect();

    console.log('✅ Bot registered successfully');
    createBotWithRandomName(); // Spawn new bot after register
    bot.quit();
  }

  bot.on('death', () => {
    bot.respawn();
  });
}

function getRandomUsername(): string {
  const adjectives = ['Cool', 'Fast', 'Lazy', 'Happy', 'Epic'];
  const animals = ['Panda', 'Wolf', 'Tiger', 'Eagle', 'Sloth'];
  const number = Math.floor(Math.random() * 1000);
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${number}`;
}

async function createBotWithRandomName() {
  while (true) {
    const username = getRandomUsername();
    console.log('Generated username:', username);

    const exists = await prisma.bots.findFirst({
      where: { name: username },
    });

    if (!exists) {
      await registerBot(username);
      break;
    }

    console.log(`⚠️ Username "${username}" already exists. Retrying...`);
  }
}

(async function bootstrap() {
  await createBotWithRandomName();
})();
