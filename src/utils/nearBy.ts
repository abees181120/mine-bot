import { Vec3 } from 'vec3';

interface BlockInfo {
  name: string;
  position: Vec3;
  boundingBox: string;
  hardness: number;
  diggable: boolean;
  displayName: string;
}
function getNearbyBlocks(bot, radius = 1) {
  const blocks: BlockInfo[] = [];
  const pos = bot.entity.position;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const offset = new Vec3(pos.x + dx, pos.y + dy, pos.z + dz);
        const block = bot.blockAt(offset);
        if (block) {
          blocks.push({
            name: block.name,
            position: block.position,
            boundingBox: block.boundingBox,
            hardness: block.hardness,
            diggable: block.diggable,
            displayName: block.displayName,
          });
        }
      }
    }
  }

  return blocks;
}

export { getNearbyBlocks };
