import { Bot } from 'mineflayer';
import { wait } from '../utils/wait';

let bot: Bot | null = null;

export function setBot(newBot: Bot) {
  bot = newBot;
}

export function getBot(): Bot | null {
  return bot;
}

export function loginGrassMineServer(
  bot: Bot,
  username: string,
  password: string,
  kill = true,
  register = false,
): Promise<boolean> {
  const onMessage = (message: any, resolve) => {
    const msg = message.toString();
    // console.log(`[${username}] ${msg}`);
    if (
      msg.includes(
        `Sử dụng lệnh '/L <mật khẩu đã đăng ký trước đó>' để đăng nhập`,
      )
    ) {
      console.log(`🟢 [BOT: ${username}] Logging in...`);
      bot.chat(`/l ${password}`);
    }

    console.log(`[${username}] ${msg}`);

    if (msg.includes("Sử dụng lệnh '/register <mật khẩu>") && register) {
      console.log(`🟢 [BOT: ${username}] Registering...`);
      bot.chat(`/register ${password} ${password}`);
    }

    if (msg.includes('Chào mừng bạn đã đến với GrassMineVN PE')) {
      setTimeout(() => {
        console.log(`🟢 [BOT: ${username}] Logging in...`);
        bot.setQuickBarSlot(0);
        bot.activateItem();
      }, 5000);
    }

    const messageJoin = `[Dungeons RPG] ${username} vừa vào máy chủ`;

    if (msg.includes(messageJoin)) {
      if (kill) {
        bot.chat('/kill');
        bot.once('windowOpen', async (window) => {
          if (window.title.includes('TỰ HỦY')) {
            bot.clickWindow(4, 0, 0);
            console.log(`🟢 [BOT: ${username}] Clicked TỰ HỦY window.`);
          }
        });
      } else {
        resolve(true);
      }
    }
  };

  const onWindowOpen = async (window: any) => {
    if (!window.title.includes('CHỌN THỂ LOẠI SERVER')) return;
    console.log(`🟢 [BOT: ${username}] Selecting server...`);
    await wait(1000);
    await bot.clickWindow(36, 1, 0);
    console.log(`🟢 [BOT: ${username}] Selected server.`);
    await wait(3000);
    await bot.clickWindow(20, 0, 0);
    console.log(`🟢 [BOT: ${username}] Selected server 2`);
    await wait(3000);
    await bot.clickWindow(21, 0, 0);
    console.log(`🟢 [BOT: ${username}] Logging in...`);
  };
  return new Promise((resolve, reject) => {
    bot.on('message', (message) => onMessage(message, resolve));

    bot.once('windowOpen', onWindowOpen);

    setTimeout(() => {
      resolve(false);
    }, 300000); // 5 minutes

    bot.once('death', () => {
      setTimeout(() => {
        bot.respawn();
        resolve(true);
      }, 3000);
      // bot.removeListener('message', onMessage);
      bot.removeListener('windowOpen', onWindowOpen);
    });
  });
}
