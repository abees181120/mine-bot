const weaponeKey = 'ᴡᴇᴀᴘᴏɴ ᴋᴇʏ';
const armorKey = 'ᴀʀᴍᴏʀ ᴋᴇʏ';
const jewelKey = 'ᴊᴇᴡᴇʟʀʏ ᴋᴇʏ';
import { Vec3 } from 'vec3';
import { Bot } from 'mineflayer';
import { wait } from './wait';

import { goals } from 'mineflayer-pathfinder';
import { cratePos } from './CratePos';
const { GoalBlock } = goals;

export async function moveTo(bot, x: number, y: number, z: number, range = 0) {
  return new Promise<void>((resolve, reject) => {
    bot.pathfinder.setGoal(new GoalBlock(x, y, z));

    const onArrived = () => {
      bot.removeListener('goal_reached', onArrived);
      bot.removeListener('path_update', onStuck);
      resolve();
    };

    const onStuck = (r) => {
      if (r.status === 'noPath') {
        reject(new Error('No path'));
      }
    };

    bot.once('goal_reached', onArrived);
    bot.once('path_update', onStuck);
  });
}

const keyOpenLocation = (key: string) => {
  if (key === weaponeKey)
    return {
      moveVec: new Vec3(
        cratePos.weapon.move.x,
        cratePos.weapon.move.y,
        cratePos.weapon.move.z,
      ),
      chestVec: new Vec3(
        cratePos.weapon.chest.x,
        cratePos.weapon.chest.y,
        cratePos.weapon.chest.z,
      ),
      key: weaponeKey,
    };
  if (key === armorKey)
    return {
      moveVec: new Vec3(
        cratePos.armor.move.x,
        cratePos.armor.move.y,
        cratePos.armor.move.z,
      ),
      chestVec: new Vec3(
        cratePos.armor.chest.x,
        cratePos.armor.chest.y,
        cratePos.armor.chest.z,
      ),
      key: armorKey,
    };
  if (key === jewelKey)
    return {
      moveVec: new Vec3(
        cratePos.jewelry.move.x,
        cratePos.jewelry.move.y,
        cratePos.jewelry.move.z,
      ),
      chestVec: new Vec3(
        cratePos.jewelry.chest.x,
        cratePos.jewelry.chest.y,
        cratePos.jewelry.chest.z,
      ),
      key,
    };
  return null;
};

export const getKeyReward = (msg: string) => {
  const getKeys = () => {
    if (msg.includes(weaponeKey)) return weaponeKey;
    if (msg.includes(armorKey)) return armorKey;
    if (msg.includes(jewelKey)) return jewelKey;
    return null;
  };

  const key = getKeys();
  if (!key) return null;
  return keyOpenLocation(key);
};

function lookAtBlock(bot, target: Vec3) {
  const dx = target.x + 0.5 - bot.entity.position.x;
  const dy = target.y + 0.5 - (bot.entity.position.y + bot.entity.height);
  const dz = target.z + 0.5 - bot.entity.position.z;

  const distanceXZ = Math.sqrt(dx * dx + dz * dz);
  const yaw = Math.atan2(-dx, -dz);
  const pitch = -Math.atan2(dy, distanceXZ);

  bot.entity.yaw = yaw;
  bot.entity.pitch = pitch;
  bot._client.write('look', {
    yaw,
    pitch,
    onGround: false,
  });
}

export async function openExcellentCrate(bot, chestVec: Vec3) {
  const block = bot.blockAt(chestVec);
  if (!block) {
    bot.chat('/msg ABeess ❌ Không tìm thấy block crate.');
    return openExcellentCrate(bot, chestVec);
  }

  const dist = bot.entity.position.distanceTo(chestVec);
  if (dist > 2.5) {
    bot.chat('/msg ABeess ❌ Bot chưa đủ gần crate.');
    return openExcellentCrate(bot, chestVec);
  }

  const target = chestVec.plus(new Vec3(0.5, 0.5, 0.5));
  await bot.lookAt(target, true);
  await wait(300);

  bot.setControlState('sneak', true);
  await wait(100);

  let opened = false;
  const timeout = setTimeout(() => {
    if (!opened) {
      bot.chat('/msg ABeess ❌ Không mở được crate.');
      bot.setControlState('sneak', false);
    }
  }, 2500);

  bot.once('windowOpen', () => {
    opened = true;
    clearTimeout(timeout);
    bot.setControlState('sneak', false);
    bot.chat('/msg ABeess Đã mở crate thành công.');
  });

  bot._client.write('use_item', {
    hand: 0,
    sequence: 0,
  });
}

export async function openRewardChest(bot: Bot, reward) {
  try {
    // Di chuyển đến vị trí nhận thưởng
    await moveTo(
      bot,
      reward.moveVec.x,
      reward.moveVec.y,
      reward.moveVec.z,
      0.5,
    );

    const chestVec = new Vec3(
      reward.chestVec.x,
      reward.chestVec.y,
      reward.chestVec.z,
    );
    lookAtBlock(bot, chestVec); // 👈 dùng thủ công

    // Chờ bot đứng yên khoảng 2 giây để chắc chắn đã đến nơi
    await wait(5000); // 2s

    const block = bot.blockAt(reward.chestVec);
    if (!block) {
      bot.chat('/msg ABeess Không tìm thấy chest.');
      return;
    }
    await openExcellentCrate(bot, reward.chestVec);
  } catch (err) {
    bot.chat('/msg ABeess Lỗi khi mở chest: ' + err.message);
  }
}
