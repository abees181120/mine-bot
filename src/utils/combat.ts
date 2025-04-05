import { Bot } from 'mineflayer';
import { plugin as pvp } from 'mineflayer-pvp';
import { Vec3 } from 'vec3';
import { moveTo } from './keyLocation';

let lastBossId: number | null = null;
let lastLogged = 0;
let lastLogTime = 0;

export function startAuraBoss(bot: Bot) {
  setInterval(() => {
    let boss: any = null;
    const now = Date.now();

    // // Chỉ log mỗi 5 giây
    // if (now - lastLogTime > 5000) {
    //   const filterdEntities = Object.values(bot.entities).filter(
    //     (e) =>
    //       e.type === 'player' &&
    //       e.displayName !== 'armor_stand' &&
    //       e.username !== bot.username,
    //   );
    //   const timestamp = new Date().toISOString();
    //   const logEntry = `[${timestamp}]\n${JSON.stringify(
    //     filterdEntities,
    //     null,
    //     2,
    //   )}\n\n`;

    //   fs.appendFileSync('entities.log', logEntry);
    //   lastLogTime = now;
    // }
    for (const id in bot.entities) {
      const e = bot.entities[id];

      if (e.type !== 'player') continue;

      const meta = e.metadata?.[2];
      if (!meta || typeof meta !== 'string') continue;

      if ((meta as any).includes('BOSS')) {
        boss = e;
        break;
      }
    }

    if (!boss) return;

    console.log('🎯 Found boss:', boss.username);

    if (bot.pvp.target?.id !== boss.id) {
      bot.lookAt = async () => Promise.resolve();
      bot.pvp.attackRange = 6;
      bot.pvp.followRange = 6;
      bot.pvp.movements = undefined;
      bot.pvp.attack(boss);
    }
  }, 100); // 100ms là hợp lý (10 lần/giây)
}

export function startCombatLoop(bot: Bot, location: Vec3) {
  if (!bot.pvp) {
    bot.loadPlugin(pvp);
  }
  setInterval(() => {
    const distanceToTargetPos = bot.entity.position.distanceTo(location);

    if (distanceToTargetPos > 10) {
      // ❌ Quá xa mục tiêu → không đánh
      if (bot.pvp.target) {
        console.log('⛔ Too far from target position. Cancel attack.');
      }

      if (distanceToTargetPos > 20 && distanceToTargetPos < 10) {
        moveTo(bot, location.x, location.y, location.z, 0.5);
      }

      return;
    }

    const target = findNearestMob(bot);
    if (target) {
      if (
        bot.pvp.target !== target &&
        bot.entity.position.distanceTo(target.position) < 6
      ) {
        const swordSlot = bot.inventory.slots.findIndex((item) => {
          return (
            item &&
            item.name === 'diamond_sword' &&
            item.slot >= 36 &&
            item.slot <= 44
          );
        });

        if (swordSlot >= 36 && swordSlot <= 44) {
          const hotbarSlot = swordSlot - 36;
          bot.setQuickBarSlot(hotbarSlot);
        }
        console.log(`🎯 Attacking ${target.name}`);
        bot.lookAt = async () => Promise.resolve();
        bot.pvp.attackRange = 6;
        bot.pvp.followRange = 6;
        bot.pvp.attack(target as any);
        bot.pvp.movements = undefined;
      }
    }
  }, 300);
}

function findNearestMob(bot: Bot) {
  const entities = Object.values(bot.entities);
  const valid = entities.filter(
    (e) =>
      ['hostile', 'animal'].includes(e.type) &&
      e !== bot.entity &&
      e.position &&
      typeof e.metadata[9] === 'number' &&
      e.metadata[9] > 0,
  );

  if (valid.length === 0) return null;

  return valid.reduce((a, b) =>
    bot.entity.position.distanceTo(a.position) <
    bot.entity.position.distanceTo(b.position)
      ? a
      : b,
  );
}
