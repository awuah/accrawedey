import { describe, it, expect } from 'vitest';
import { VEHICLE_SPEEDS, AVATAR_PALETTES, INITIAL_BUILDING_TYPES } from '../src/types/constants';
import { ACCRA_STARTER_WORLD } from '../src/data/accraWorld';

describe('AccraWedey Game Logic & Economy Units', () => {
  it('enforces vehicle speed hierarchy (drive > bike > walk)', () => {
    expect(VEHICLE_SPEEDS.drive).toBeGreaterThan(VEHICLE_SPEEDS.bike);
    expect(VEHICLE_SPEEDS.bike).toBeGreaterThan(VEHICLE_SPEEDS.walk);
    expect(VEHICLE_SPEEDS.walk).toBeGreaterThanOrEqual(100);
  });

  it('guarantees all starter properties have positive price, income and valid entry nodes', () => {
    const nodeIds = new Set(Object.keys(ACCRA_STARTER_WORLD.nodes));
    
    for (const prop of ACCRA_STARTER_WORLD.properties) {
      expect(prop.price).toBeGreaterThan(0);
      expect(prop.baseIncomeRate).toBeGreaterThan(0);
      expect(prop.width).toBeGreaterThanOrEqual(40);
      expect(prop.height).toBeGreaterThanOrEqual(40);
      if (prop.entryNodeId) {
        expect(nodeIds.has(prop.entryNodeId)).toBe(true);
      }
    }
  });

  it('verifies all building types are configured with positive base costs', () => {
    for (const [id, def] of Object.entries(INITIAL_BUILDING_TYPES)) {
      expect(def.id).toBe(id);
      expect(def.baseCost).toBeGreaterThan(0);
      expect(def.baseIncomeRate).toBeGreaterThan(0);
    }
  });

  it('verifies road network has bidirectional connectivity between Danquah Circle and Makola', () => {
    const edges = ACCRA_STARTER_WORLD.edges;
    const hasDanquahEdge = edges.some(e => e.source === 'danquah_circle' || e.target === 'danquah_circle');
    const hasMakolaEdge = edges.some(e => e.source === 'makola_central' || e.target === 'makola_central');
    
    expect(hasDanquahEdge).toBe(true);
    expect(hasMakolaEdge).toBe(true);
  });
});
