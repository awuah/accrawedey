import { AccraWorldData } from '@/types/world';
import { INITIAL_BUILDING_TYPES } from '@/types/constants';

// Accra Real-World Landmarks Starter Seed
// Coordinates are mapped to a continuous 2D plane centered around Central Accra:
// Osu (Oxford St), Airport City (Accra Mall), Jamestown (Lighthouse), Labadi (Beach), Makola
export const ACCRA_STARTER_WORLD: AccraWorldData = {
  id: 'world-accra-core',
  slug: 'accra-main',
  name: 'Greater Accra Central',
  version: 1,
  bounds: {
    minX: 0,
    minY: 0,
    maxX: 2400,
    maxY: 1800,
  },
  nodes: {
    // 1. Danquah Circle (Osu)
    danquah_circle: { id: 'danquah_circle', x: 1200, y: 900, name: 'Danquah Circle' },
    // 2. Oxford Street South (Osu)
    oxford_st_south: { id: 'oxford_st_south', x: 1200, y: 1200, name: 'Oxford Street South' },
    // 3. Oxford Street North
    oxford_st_north: { id: 'oxford_st_north', x: 1200, y: 700, name: 'Oxford St Junction' },
    // 4. Ring Road East to Labone
    labone_junction: { id: 'labone_junction', x: 1600, y: 900, name: 'Labone Junction' },
    // 5. Labadi Beach Road
    labadi_coast: { id: 'labadi_coast', x: 1900, y: 1350, name: 'Labadi Beach Coast' },
    // 6. Cantonments Road
    cantonments_rd: { id: 'cantonments_rd', x: 1350, y: 550, name: 'Cantonments Roundabout' },
    // 7. Airport City Roundabout
    airport_roundabout: { id: 'airport_roundabout', x: 1400, y: 300, name: 'Airport City' },
    // 8. Tetteh Quarshie Interchange (Accra Mall)
    tetteh_quarshie: { id: 'tetteh_quarshie', x: 1650, y: 200, name: 'Tetteh Quarshie Interchange' },
    // 9. Ridge Roundabout (Ministries)
    ridge_roundabout: { id: 'ridge_roundabout', x: 800, y: 900, name: 'Ridge Roundabout' },
    // 10. Makola Market Central
    makola_central: { id: 'makola_central', x: 500, y: 1100, name: 'Makola Market Square' },
    // 11. High Street / Jamestown
    jamestown_high_st: { id: 'jamestown_high_st', x: 450, y: 1450, name: 'Jamestown High Street' },
    // 12. Black Star Square / Independence Arch
    independence_square: { id: 'independence_square', x: 950, y: 1350, name: 'Independence Square' },
  },
  edges: [
    // Danquah Circle <-> Oxford Street South
    {
      id: 'e_oxford_south',
      source: 'danquah_circle',
      target: 'oxford_st_south',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'main',
      name: 'Oxford Street Osu',
    },
    // Danquah Circle <-> Oxford St North
    {
      id: 'e_oxford_north',
      source: 'oxford_st_north',
      target: 'danquah_circle',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'main',
      name: 'Ring Road Osu',
    },
    // Danquah Circle <-> Labone Junction
    {
      id: 'e_ring_road_east',
      source: 'danquah_circle',
      target: 'labone_junction',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'highway',
      name: 'Ring Road East',
    },
    // Labone <-> Labadi Coast
    {
      id: 'e_labadi_bypass',
      source: 'labone_junction',
      target: 'labadi_coast',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'main',
      name: 'Labadi Beach Road',
    },
    // Danquah Circle <-> Cantonments
    {
      id: 'e_cantonments_rd',
      source: 'oxford_st_north',
      target: 'cantonments_rd',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'main',
      name: 'Cantonments Road',
    },
    // Cantonments <-> Airport City
    {
      id: 'e_airport_rd',
      source: 'cantonments_rd',
      target: 'airport_roundabout',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'highway',
      name: 'Liberation Road',
    },
    // Airport <-> Tetteh Quarshie (Accra Mall)
    {
      id: 'e_tetteh_quarshie',
      source: 'airport_roundabout',
      target: 'tetteh_quarshie',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'highway',
      name: 'Legon Bypass',
    },
    // Danquah Circle <-> Ridge Roundabout
    {
      id: 'e_ring_road_central',
      source: 'danquah_circle',
      target: 'ridge_roundabout',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'highway',
      name: 'Ring Road Central',
    },
    // Ridge <-> Makola Market
    {
      id: 'e_makola_access',
      source: 'ridge_roundabout',
      target: 'makola_central',
      allowedModes: ['walk', 'bike'],
      roadType: 'street',
      name: 'Kojo Thompson Road',
    },
    // Makola <-> Jamestown High Street
    {
      id: 'e_jamestown_path',
      source: 'makola_central',
      target: 'jamestown_high_st',
      allowedModes: ['walk', 'bike'],
      roadType: 'street',
      name: 'High Street Jamestown',
    },
    // Oxford St South <-> Independence Square
    {
      id: 'e_osu_to_square',
      source: 'oxford_st_south',
      target: 'independence_square',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'main',
      name: 'Castle Road',
    },
    // Independence Square <-> Jamestown
    {
      id: 'e_coastal_boulevard',
      source: 'independence_square',
      target: 'jamestown_high_st',
      allowedModes: ['walk', 'bike', 'drive'],
      roadType: 'highway',
      name: 'Atta Mills High St Promenade',
    },
  ],
  properties: [
    {
      id: 'prop_accra_mall',
      name: 'Accra Mall',
      typeId: 'mall',
      x: 1720,
      y: 160,
      width: 120,
      height: 90,
      entryNodeId: 'tetteh_quarshie',
      price: 280000,
      baseIncomeRate: 520,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#FDE047',
    },
    {
      id: 'prop_republic_bar',
      name: 'Republic Bar & Grill',
      typeId: 'club',
      x: 1250,
      y: 1140,
      width: 75,
      height: 65,
      entryNodeId: 'oxford_st_south',
      price: 95000,
      baseIncomeRate: 210,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#0284C7',
    },
    {
      id: 'prop_buka_restaurant',
      name: 'Buka Restaurant Osu',
      typeId: 'chop_bar',
      x: 1120,
      y: 980,
      width: 80,
      height: 70,
      entryNodeId: 'danquah_circle',
      price: 45000,
      baseIncomeRate: 110,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#FB923C',
    },
    {
      id: 'prop_labadi_beach_hotel',
      name: 'Labadi Beach Resort',
      typeId: 'resort',
      x: 1980,
      y: 1380,
      width: 140,
      height: 100,
      entryNodeId: 'labadi_coast',
      price: 480000,
      baseIncomeRate: 920,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#38BDF8',
    },
    {
      id: 'prop_makola_stalls',
      name: 'Makola Central Market Stalls',
      typeId: 'market',
      x: 440,
      y: 1060,
      width: 90,
      height: 80,
      entryNodeId: 'makola_central',
      price: 25000,
      baseIncomeRate: 65,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#D97706',
    },
    {
      id: 'prop_jamestown_cafe',
      name: 'Jamestown Lighthouse Cafe',
      typeId: 'chop_bar',
      x: 390,
      y: 1490,
      width: 70,
      height: 60,
      entryNodeId: 'jamestown_high_st',
      price: 32000,
      baseIncomeRate: 75,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#FB923C',
    },
    {
      id: 'prop_airport_total_fuel',
      name: 'Airport City Energy Hub',
      typeId: 'fuel_station',
      x: 1480,
      y: 350,
      width: 85,
      height: 65,
      entryNodeId: 'airport_roundabout',
      price: 110000,
      baseIncomeRate: 240,
      ownerId: null,
      isForSale: true,
      tier: 1,
      color: '#22C55E',
    },
  ],
  buildingTypes: INITIAL_BUILDING_TYPES,
};
