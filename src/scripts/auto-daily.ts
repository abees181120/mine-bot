import { Bot, createBot } from 'mineflayer';
import { Vec3 } from 'vec3';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { startCombatLoop } from '../utils/combat';
import { findQuest } from '../utils/findQuest';
import { getQuestLocation } from '../utils/questLocations';
import { getKeyReward, moveTo, openRewardChest } from '../utils/keyLocation';
import { loginGrassMineServer } from '../utils/botUtil';
import { wait } from '../utils/wait';
import { logReward, prisma } from '../config/prisma';
import yargs from 'yargs';
import { p } from 'react-router/dist/development/fog-of-war-BaM-ohjc';

const botState: {
  isDailySuccess: boolean;
  isKill: boolean;
  isGoingToWarp: boolean;
  reconnecting: boolean;
  lastDailyCheck: number;
  isStartDaily?: boolean;
  quest?: {
    requirement: string;
    location: {
      x: number;
      y: number;
      z: number;
      warp: string;
    };
  };
} = {
  isDailySuccess: false,
  isKill: false,
  isGoingToWarp: false,
  reconnecting: false,
  lastDailyCheck: 0,
  isStartDaily: false,
};

let reward: {
  moveVec: Vec3;
  chestVec: Vec3;
  key: string;
  reward?: string;
} | null = null;

const argv = yargs(process.argv.slice(2))
  .option('username', {
    alias: 'u',
    type: 'string',
    description: 'Username of the bot',
  })
  .option('password', {
    alias: 'p',
    type: 'string',
    description: 'Password of the bot',
  })
  .option('server', {
    alias: 's',
    type: 'string',
    description: 'Server of the bot',
    default: 'grassmine.vn',
  })
  .option('id', {
    alias: 'i',
    type: 'string',
    description: 'ID of the bot',
  })
  .parseSync();

const username = argv.username || 'ShadowNinja1';
const password = argv.password || 'abeesdev';
const server = argv.server || 'grassmine.vn';
const id = argv.id || null;

const handleGetDailyQuest = async (bot) => {
  setInterval(() => {
    if (!bot || !bot.entity || !bot.entity.position || botState.isDailySuccess)
      return;

    const currentTime = Date.now();
    if (currentTime - botState.lastDailyCheck < 1000 * 60 * 5) return; // 5 phút

    botState.lastDailyCheck = currentTime;

    const currentPos = bot.entity.position;
    const respawnPos = new Vec3(-718, 164, 1336);

    const respawnDistance = currentPos.distanceTo(respawnPos);

    if (!botState.isStartDaily && respawnDistance < 10) {
      bot.chat('/dailyquests');
      botState.lastDailyCheck = currentTime;
      bot.once('windowOpen', async (window) => {
        if (window.title.includes('NHIỆM VỤ HẰNG NGÀY')) {
          const dailyQuest = window.slots.find((item) => item?.slot === 20);
          const quest = findQuest(dailyQuest);

          console.log('quest.requirement', quest?.requirement);

          if (!quest || !quest.requirement) {
            if (id) {
              await prisma.dailyRewardStatus.create({
                data: {
                  botId: id, // change to your bot id
                  status: 'skipped',
                  date: new Date(),
                  type: 1,
                },
              });
            }

            console.log('quit');
            bot.quit();
            return process.exit(0);
          }

          if (quest.status === 'HOÀN THÀNH') {
            if (id) {
              await prisma.dailyRewardStatus.create({
                data: {
                  botId: id, // change to your bot id
                  status: 'skipped',
                  date: new Date(),
                  type: 1,
                },
              });
            }
            console.log('quit');
            bot.quit();
            return process.exit(0);
          }

          const location = getQuestLocation(quest.requirement);
          if (!location) {
            if (id) {
              await prisma.dailyRewardStatus.create({
                data: {
                  botId: id, // change to your bot id
                  status: 'skipped',
                  date: new Date(),
                  type: 1,
                },
              });
            }
            console.log('quit');
            bot.quit();
            return process.exit(0);
          }

          botState.quest = {
            requirement: quest.requirement,
            location,
          };
          bot.chat(`/msg ABeess ${quest.requirement}`);
          bot.chat(`/msg ABeess I'm ready! go to the warp! ${location.warp}`);

          if (!botState.isGoingToWarp) {
            botState.isGoingToWarp = true;
            bot.chat(`/warp ${location.warp}`);

            setTimeout(async () => {
              botState.isGoingToWarp = false;
              bot.setQuickBarSlot(0);
              await moveTo(bot, location.x, location.y, location.z);
              startCombatLoop(
                bot,
                new Vec3(location.x, location.y, location.z),
              );
            }, 5000);
          }
        }
      });
    }
  }, 1000);
};

const handleBotDeath = async (bot: Bot) => {
  bot.on('death', () => {
    console.log('💀 Bot died! Respawning in 3s...');
    setTimeout(async () => {
      bot.respawn();

      if (botState.isKill && reward) {
        await wait(3000);
        await openRewardChest(bot, reward);
      }

      if (!botState.isKill && botState.quest) {
        if (botState.quest) {
          await wait(11000);
          console.log('Bot is going to warp...', botState.quest.location.warp);
          bot.chat(`/warp ${botState.quest.location.warp}`);
          botState.isGoingToWarp = true;
          setTimeout(async () => {
            botState.isGoingToWarp = false;
            if (!botState.quest) return;
            console.log('Bot is going to quest location...');
            await moveTo(
              bot,
              botState.quest.location.x,
              botState.quest.location.y,
              botState.quest.location.z,
            );
            startCombatLoop(
              bot,
              new Vec3(
                botState.quest.location.x,
                botState.quest.location.y,
                botState.quest.location.z,
              ),
            );
          }, 5000);
        }
      }
    }, 3000);
  });
};

const handleReward = async (bot: Bot, username: string) => {
  bot.on('message', async (message) => {
    const msg = message.toString();

    if (msg.includes('Máu')) {
      return;
    }
    console.log(msg);

    if (msg.includes('Chào mừng bạn đã đến với GrassMineVN PE')) {
      console.log('🔍 Logging in...');
      await wait(3000);
      bot.setQuickBarSlot(0);
      bot.activateItem();

      console.log('🔍 Logging in...');
    }

    if (msg.includes('Bạn đã quay được Hòm')) {
      if (!message.extra) return;
      const rewardName = (message.extra[1] as any).text;
      const star = (message.extra[4] as any)?.text.length;

      // await logQuestComplete(name, rewardName, star);
      await logReward(username, rewardName, star);

      setTimeout(() => {
        console.log(' handleReward');
        bot.quit();
        process.exit(0);
      }, 1000);
    }

    if (msg.includes('Bạn đã nhận được x1 chìa khóa')) {
      const crateLocation = getKeyReward(msg);
      if (crateLocation) {
        reward = crateLocation;
        console.log('🎁 Found reward:', reward);
      }
    }

    if (msg.includes('Bạn đã hoàn thành tất cả các nhiệm vụ dễ!')) {
      bot.chat('/kill');
      botState.isDailySuccess = true;
      botState.isKill = true;
      bot.once('windowOpen', async (window) => {
        if (window.title.includes('TỰ HỦY')) {
          bot.clickWindow(4, 0, 0);
          console.log(`🟢 [BOT] Clicked TỰ HỦY window.`);
        }
      });
    }
  });
};

async function main() {
  const bot = createBot({
    host: server,
    username: username,
    version: '1.18.2',
  });

  prisma.$connect();

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);

  const isLogin = await loginGrassMineServer(bot, username, password);

  if (isLogin) {
    handleGetDailyQuest(bot);
    handleBotDeath(bot);
    handleReward(bot, username);

    bot.on('kicked', (reason) => {
      console.log(`Bot kicked: ${reason}`);
      console.log('quit');
      bot.quit();
      prisma.$disconnect();
      process.exit(0);
    });
  }
}
main();
