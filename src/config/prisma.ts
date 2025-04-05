import { PrismaClient } from '@prisma/client';
import { KeyType } from '../enum/KeyType';
import { startOfDay } from 'date-fns';

export const prisma = new PrismaClient();
export const logReward = async (
  botName: string,
  rewardName: string,
  star: number,
) => {
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

  const trimRewardName = rewardName.trim();

  const type = mapType(trimRewardName);

  const bot = await prisma.bots.findFirst({
    where: {
      name: botName,
    },
  });
  if (!bot) {
    console.log(`Bot ${botName} not found`);
    return;
  }

  // const dailyStatus = await prisma.dailyRewardStatus.create({
  //   data: {
  //     botId: bot?.id,
  //     date: new Date(),
  //     status: 'rewarded',
  //     type,
  //   },
  // });

  await prisma.dailyRewardStatus.updateMany({
    where: {
      botId: bot?.id,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
      status: 'pending',
    },
    data: {
      status: 'rewarded',
      date: startOfDay(new Date()),
    },
  });
  const dailyRewards = await prisma.dailyRewards.create({
    data: {
      botId: bot?.id,
      type,
      star,
      description: trimRewardName,
      inStock: 1,
      name: trimRewardName,
      dateRewarded: new Date(),
    },
  });

  console.log('dailyRewards', dailyRewards);
};
