export type TravelMode = 'walk' | 'bike' | 'drive';

export interface WorldNode {
  id: string;
  x: number;
  y: number;
  name?: string;
}

export interface WorldEdge {
  id: string;
  source: string;
  target: string;
  allowedModes: TravelMode[];
  isOneWay?: boolean;
  roadType?: 'highway' | 'main' | 'street' | 'path';
  name?: string;
}

export interface BuildingTypeDefinition {
  id: string;
  name: string;
  category: 'retail' | 'hospitality' | 'attraction' | 'commercial' | 'civic';
  baseCost: number;
  baseIncomeRate: number; // Cedis per minute
  defaultColor: string;
  defaultIcon: string;
}

export interface WorldProperty {
  id: string;
  name: string;
  typeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  entryNodeId?: string;
  price: number;
  baseIncomeRate: number;
  ownerId?: string | null;
  ownerName?: string | null;
  isForSale: boolean;
  tier: number;
  color?: string;
  lastIncomeCollectedAt?: string;
}

export interface AccraWorldData {
  id: string;
  slug: string;
  name: string;
  version: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  nodes: Record<string, WorldNode>;
  edges: WorldEdge[];
  properties: WorldProperty[];
  buildingTypes: Record<string, BuildingTypeDefinition>;
}

export interface PlayerState {
  id: string;
  name: string;
  avatarColor: string;
  x: number;
  y: number;
  heading: number;
  speed: number;
  travelMode: TravelMode;
  lastSeen: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  role: 'player' | 'admin';
  avatarKey: string;
  balance: number;
  currentVehicle: TravelMode;
  lastX: number;
  lastY: number;
  created_at?: string;
}
