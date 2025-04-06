const questLocations = {
  'Giết 30 Cừu Non (Đảo 1)': {
    warp: 'dao1',
    locations: [
      [1246, 77, 968],
      [1229, 79, 966],
    ],
  },
  'Giết 30 Heo Con (Đảo 1)': {
    warp: 'dao1',
    locations: [
      [1266.5774621820776, 78.0, 900.1367000517738],
      [1278, 79, 919],
    ],
  },
  'Giết 30 Bò Sữa (Đảo 1)': {
    warp: 'dao1',
    locations: [
      [1242, 79, 923],
      [1224, 82, 931],
    ],
  },
  'Giết 30 Mèo Cát (Đảo 2)': {
    warp: 'dao2',
    locations: [
      [226, 82, -166],
      [243, 83, -143],
    ],
  },
  'Giết 30 Thây Ma (Đảo 3)': {
    warp: 'dao3',
    locations: [
      [56, 66, -13],
      [13, 67, -43],
    ],
  },
  'Giết 30 Thây Ma Chết Đuối (Đảo 3)': {
    warp: 'dao3',
    locations: [
      [1, 65, -25],
      [-13, 65, -13],
    ],
  },
};
// 1261,79,926
export const getQuestLocation = (key: string) => {
  const location = questLocations[key];
  if (!location || !location.locations.length) {
    return null;
  }

  const randomLoc =
    location.locations[Math.floor(Math.random() * location.locations.length)];
  return {
    warp: location.warp,
    x: randomLoc[0],
    y: randomLoc[1],
    z: randomLoc[2],
  };
};
