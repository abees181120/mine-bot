import { Item } from 'prismarine-item';

type TextComponent = {
  text?: string;
  color?: string;
  [key: string]: any;
};

type QuestNBT = {
  display?: {
    value: {
      Lore: {
        type: string;
        value: {
          type: string;
          value: string[];
        };
      };
    };
  };
};

export const findRewards = (inventorys: any[]) => {
  const rewards = inventorys.filter((item: any) => {
    return item?.nbt?.value?.display?.value?.Name?.value?.includes('Hòm Quà');
  });

  return rewards;
};

export const findQuest = (quest: Item | null | undefined) => {
  if (!quest?.nbt) return null;

  const nbt = quest.nbt.value as QuestNBT;

  try {
    const lore = nbt?.display?.value?.Lore?.value.value;

    if (!Array.isArray(lore) || lore.length < 6) return null;

    const requirementsText = lore[1];
    const statusText = lore[5];

    const requirementsJson = JSON.parse(requirementsText);
    const statusJson = JSON.parse(statusText);

    const requirement =
      requirementsJson?.extra?.find((e: TextComponent) => e.color === 'gray')
        ?.text || null;
    const status =
      statusJson?.extra?.find((e: TextComponent) => e.color === 'red')?.text ||
      null;

    return {
      slot: quest.slot,
      requirement,
      status,
    };
  } catch (error) {
    console.warn('❌ QuestFinder.parse error:', error);
    return null;
  }
};
