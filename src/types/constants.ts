// SPEED BUDGET (Pixels per second)
export const VEHICLE_SPEEDS = {
  walk: 130,
  bike: 240,
  drive: 460,
} as const;

// ZERO-PURPLE AVATAR PALETTES (Soft, light, high-visibility pastels)
export const AVATAR_PALETTES = [
  { id: 'kente_gold', name: 'Golden Sun', hex: '#EAB308', textHex: '#292524' },
  { id: 'osuo_blue', name: 'Gulf Sky', hex: '#38BDF8', textHex: '#292524' },
  { id: 'palm_green', name: 'Aburi Palm', hex: '#22C55E', textHex: '#292524' },
  { id: 'clay_coral', name: 'Jamestown Coral', hex: '#FB923C', textHex: '#292524' },
  { id: 'sand_warm', name: 'Labadi Sand', hex: '#E8DFCF', textHex: '#292524' },
] as const;

// DEFAULT BUILDING TYPES (Extensible in Admin World Editor)
export const INITIAL_BUILDING_TYPES: Record<string, import('./world.ts').BuildingTypeDefinition> = {
  mall: {
    id: 'mall',
    name: 'Shopping Mall',
    category: 'retail',
    baseCost: 250000,
    baseIncomeRate: 450,
    defaultColor: '#FDE047', // Soft warm yellow
    defaultIcon: 'Building',
  },
  chop_bar: {
    id: 'chop_bar',
    name: 'Chop Bar & Eatery',
    category: 'hospitality',
    baseCost: 35000,
    baseIncomeRate: 80,
    defaultColor: '#FB923C', // Terracotta orange
    defaultIcon: 'Utensils',
  },
  club: {
    id: 'club',
    name: 'Lounge & Night Club',
    category: 'hospitality',
    baseCost: 120000,
    baseIncomeRate: 260,
    defaultColor: '#0284C7', // Gulf deep cyan
    defaultIcon: 'Music',
  },
  resort: {
    id: 'resort',
    name: 'Beach Resort',
    category: 'hospitality',
    baseCost: 500000,
    baseIncomeRate: 950,
    defaultColor: '#38BDF8', // Sky lagoon blue
    defaultIcon: 'Palmtree',
  },
  fuel_station: {
    id: 'fuel_station',
    name: 'Filling Station',
    category: 'commercial',
    baseCost: 80000,
    baseIncomeRate: 180,
    defaultColor: '#22C55E', // Palm green
    defaultIcon: 'Fuel',
  },
  market: {
    id: 'market',
    name: 'Open Market Stall',
    category: 'retail',
    baseCost: 15000,
    baseIncomeRate: 35,
    defaultColor: '#D97706', // Warm amber
    defaultIcon: 'Store',
  },
  office: {
    id: 'office',
    name: 'Corporate Office',
    category: 'commercial',
    baseCost: 180000,
    baseIncomeRate: 380,
    defaultColor: '#78716C', // Stone gray
    defaultIcon: 'Briefcase',
  },
};
