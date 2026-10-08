import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AccraWorldData, TravelMode, PlayerState, WorldProperty } from '@/types/world';
import { VEHICLE_SPEEDS, AVATAR_PALETTES } from '@/types/constants';

export interface GameEngineCallbacks {
  onPositionChange?: (x: number, y: number, heading: number, speed: number) => void;
  onNearProperty?: (property: WorldProperty | null) => void;
}

export class GameEngine {
  private app: Application | null = null;
  private container: HTMLDivElement | null = null;
  
  // Scene hierarchy
  private worldContainer = new Container();
  private groundLayer = new Graphics();
  private roadLayer = new Graphics();
  private propertyLayer = new Container();
  private otherPlayersLayer = new Container();
  private localPlayerLayer = new Container();
  
  // Local Player State
  public localPlayer: PlayerState = {
    id: 'local',
    name: 'Player',
    avatarColor: AVATAR_PALETTES[0].hex,
    x: 1200,
    y: 900,
    heading: 0,
    speed: 0,
    travelMode: 'walk',
    lastSeen: Date.now(),
  };

  // Remote players container map
  private remotePlayerGraphics = new Map<string, Container>();

  // World Data
  private worldData: AccraWorldData;
  private callbacks: GameEngineCallbacks;

  // Input states
  private keysPressed: Record<string, boolean> = {};
  private joystickVector = { x: 0, y: 0 };
  private isDestroyed = false;
  private lastBroadcastTime = 0;
  private propertyEntryNodes = new Map<string, { prop: WorldProperty; x: number; y: number }>();

  constructor(worldData: AccraWorldData, callbacks: GameEngineCallbacks = {}) {
    this.worldData = worldData;
    this.callbacks = callbacks;
    this.indexPropertyLocations();
  }

  private indexPropertyLocations() {
    this.propertyEntryNodes.clear();
    for (const prop of this.worldData.properties) {
      this.propertyEntryNodes.set(prop.id, {
        prop,
        x: prop.x + prop.width / 2,
        y: prop.y + prop.height / 2,
      });
    }
  }

  public updateWorldData(newWorld: AccraWorldData) {
    this.worldData = newWorld;
    this.indexPropertyLocations();
    this.renderWorldStatic();
    this.renderProperties();
  }

  public async init(container: HTMLDivElement) {
    this.container = container;
    
    // Initialize Pixi Application (v8)
    const app = new Application();
    await app.init({
      resizeTo: container,
      backgroundColor: 0xFBF9F5, // Warm Ivory (NO PURPLE)
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    container.appendChild(app.canvas);

    // Build scene graph
    this.worldContainer.addChild(this.groundLayer);
    this.worldContainer.addChild(this.roadLayer);
    this.worldContainer.addChild(this.propertyLayer);
    this.worldContainer.addChild(this.otherPlayersLayer);
    this.worldContainer.addChild(this.localPlayerLayer);
    app.stage.addChild(this.worldContainer);

    // Initial render
    this.renderWorldStatic();
    this.renderProperties();
    this.createLocalPlayerSprite();

    // Event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    // Main Game Loop Ticker
    app.ticker.add((ticker) => {
      this.gameLoop(ticker.deltaTime / 60);
    });
  }

  private handleResize = () => {
    if (!this.app || !this.container) return;
    this.app.renderer.resize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  public setJoystickVector(x: number, y: number) {
    this.joystickVector = { x, y };
  }

  public setTravelMode(mode: TravelMode) {
    this.localPlayer.travelMode = mode;
    this.createLocalPlayerSprite();
  }

  public setAvatarColor(colorHex: string) {
    this.localPlayer.avatarColor = colorHex;
    this.createLocalPlayerSprite();
  }

  public setPlayerName(name: string) {
    this.localPlayer.name = name;
    this.createLocalPlayerSprite();
  }

  // Draw Accra base terrain, coastlines and roads
  private renderWorldStatic() {
    const gGround = this.groundLayer;
    gGround.clear();

    const { minX, minY, maxX, maxY } = this.worldData.bounds;
    
    // Land surface (Warm Ivory Sand)
    gGround.rect(minX - 500, minY - 500, maxX + 1000, maxY + 1000);
    gGround.fill(0xF4EFE6);

    // Gulf of Guinea Ocean along the southern edge
    const coastY = 1550;
    gGround.rect(minX - 500, coastY, maxX + 1000, 1000);
    gGround.fill(0x7DD3FC); // Sky / Gulf blue (pastels)

    // Sandy beach buffer
    gGround.rect(minX - 500, coastY - 60, maxX + 1000, 60);
    gGround.fill(0xE8DFCF); // Warm beach sand

    // Draw Roads (Vector Edges)
    const gRoads = this.roadLayer;
    gRoads.clear();

    const nodes = this.worldData.nodes;
    for (const edge of this.worldData.edges) {
      const src = nodes[edge.source];
      const tgt = nodes[edge.target];
      if (!src || !tgt) continue;

      const roadWidth = edge.roadType === 'highway' ? 36 : edge.roadType === 'main' ? 24 : 16;

      // Road outer border / kerb
      gRoads.moveTo(src.x, src.y);
      gRoads.lineTo(tgt.x, tgt.y);
      gRoads.stroke({ width: roadWidth + 6, color: 0xD6C7AF, cap: 'round', join: 'round' });

      // Asphalt Surface (Soft slate/stone)
      gRoads.moveTo(src.x, src.y);
      gRoads.lineTo(tgt.x, tgt.y);
      gRoads.stroke({ width: roadWidth, color: 0x57534E, cap: 'round', join: 'round' });

      // Yellow Center Line
      gRoads.moveTo(src.x, src.y);
      gRoads.lineTo(tgt.x, tgt.y);
      gRoads.stroke({ width: 2, color: 0xEAB308, cap: 'round' });
    }

    // Junction Nodes
    for (const nodeKey of Object.keys(nodes)) {
      const node = nodes[nodeKey];
      gRoads.circle(node.x, node.y, 16);
      gRoads.fill(0x57534E);
      gRoads.circle(node.x, node.y, 8);
      gRoads.fill(0xEAB308);
    }
  }

  // Draw Properties & Landmarks
  private renderProperties() {
    this.propertyLayer.removeChildren();

    for (const prop of this.worldData.properties) {
      const c = new Container();
      c.x = prop.x;
      c.y = prop.y;

      const g = new Graphics();
      // Drop Shadow
      g.rect(4, 4, prop.width, prop.height);
      g.fill({ color: 0x292524, alpha: 0.12 });

      // Building Body
      const colorNum = parseInt((prop.color || '#FB923C').replace('#', ''), 16);
      g.roundRect(0, 0, prop.width, prop.height, 8);
      g.fill(colorNum);
      g.stroke({ width: 2, color: 0x292524 });

      // Entrance Indicator
      g.circle(prop.width / 2, prop.height, 6);
      g.fill(0xEAB308); // Gold entrance mat
      g.stroke({ width: 1.5, color: 0x292524 });

      c.addChild(g);

      // Building Label
      const style = new TextStyle({
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x292524,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: prop.width + 30,
      });
      const label = new Text({ text: prop.name, style });
      label.anchor.set(0.5, 1);
      label.x = prop.width / 2;
      label.y = -6;
      c.addChild(label);

      // Owner or Price tag
      const tagStyle = new TextStyle({
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 9,
        fontWeight: '600',
        fill: prop.ownerName ? 0x15803D : 0x78716C,
      });
      const tagText = prop.ownerName ? `Owned: ${prop.ownerName}` : `GH₵ ${(prop.price).toLocaleString()}`;
      const tag = new Text({ text: tagText, style: tagStyle });
      tag.anchor.set(0.5, 0);
      tag.x = prop.width / 2;
      tag.y = prop.height + 4;
      c.addChild(tag);

      this.propertyLayer.addChild(c);
    }
  }

  // Local Player Avatar
  private createLocalPlayerSprite() {
    this.localPlayerLayer.removeChildren();

    const c = new Container();
    const g = new Graphics();

    const colorNum = parseInt(this.localPlayer.avatarColor.replace('#', ''), 16);
    const radius = this.localPlayer.travelMode === 'drive' ? 18 : this.localPlayer.travelMode === 'bike' ? 14 : 12;

    // Shadow
    g.ellipse(0, 4, radius + 2, radius - 2);
    g.fill({ color: 0x292524, alpha: 0.2 });

    // Mode-specific outline
    if (this.localPlayer.travelMode === 'drive') {
      g.roundRect(-22, -14, 44, 28, 6);
      g.fill(colorNum);
      g.stroke({ width: 2, color: 0x292524 });
      // Headlights
      g.rect(18, -10, 4, 6);
      g.rect(18, 4, 4, 6);
      g.fill(0xFEF9C3);
    } else {
      g.circle(0, 0, radius);
      g.fill(colorNum);
      g.stroke({ width: 2, color: 0x292524 });

      // Nose / Heading pointer
      g.circle(radius - 2, 0, 3);
      g.fill(0x292524);
    }

    c.addChild(g);

    // Name Label Above Player
    const nameText = new Text({
      text: `${this.localPlayer.name} (${this.localPlayer.travelMode})`,
      style: new TextStyle({
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x292524,
      }),
    });
    nameText.anchor.set(0.5, 1);
    nameText.y = -radius - 8;
    c.addChild(nameText);

    this.localPlayerLayer.addChild(c);
  }

  // Update remote multiplayer players
  public updateRemotePlayers(players: PlayerState[]) {
    const activeIds = new Set(players.map(p => p.id));

    // Remove left players
    for (const [id, container] of this.remotePlayerGraphics.entries()) {
      if (!activeIds.has(id)) {
        this.otherPlayersLayer.removeChild(container);
        this.remotePlayerGraphics.delete(id);
      }
    }

    // Update or add remote players
    for (const p of players) {
      if (p.id === this.localPlayer.id) continue;

      let c = this.remotePlayerGraphics.get(p.id);
      if (!c) {
        c = new Container();
        const g = new Graphics();
        const colorNum = parseInt((p.avatarColor || '#38BDF8').replace('#', ''), 16);
        
        g.circle(0, 0, 12);
        g.fill(colorNum);
        g.stroke({ width: 1.5, color: 0x292524 });
        c.addChild(g);

        const label = new Text({
          text: p.name,
          style: new TextStyle({
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 10,
            fontWeight: '600',
            fill: 0x292524,
          }),
        });
        label.anchor.set(0.5, 1);
        label.y = -16;
        c.addChild(label);

        this.otherPlayersLayer.addChild(c);
        this.remotePlayerGraphics.set(p.id, c);
      }

      // Smooth lerp remote player position (interpolation)
      c.x += (p.x - c.x) * 0.25;
      c.y += (p.y - c.y) * 0.25;
      c.rotation = p.heading;
    }
  }

  // Main game tick
  private gameLoop(dt: number) {
    if (!this.app) return;

    // 1. Gather directional input (Keyboard + Touch Joystick)
    let dx = 0;
    let dy = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) dy -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) dy += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) dx -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) dx += 1;

    // Blend in joystick
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      dx += this.joystickVector.x;
      dy += this.joystickVector.y;
    }

    // Normalize diagonal velocity
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx = (dx / len) * Math.min(len, 1);
      dy = (dy / len) * Math.min(len, 1);
    }

    const currentSpeed = VEHICLE_SPEEDS[this.localPlayer.travelMode];
    this.localPlayer.speed = len > 0.05 ? currentSpeed : 0;

    if (len > 0.05) {
      this.localPlayer.x += dx * currentSpeed * dt;
      this.localPlayer.y += dy * currentSpeed * dt;
      this.localPlayer.heading = Math.atan2(dy, dx);

      // Clamp inside world bounds
      const b = this.worldData.bounds;
      this.localPlayer.x = Math.max(b.minX + 30, Math.min(b.maxX - 30, this.localPlayer.x));
      this.localPlayer.y = Math.max(b.minY + 30, Math.min(b.maxY - 30, this.localPlayer.y));
    }

    // Update local player container transform
    this.localPlayerLayer.x = this.localPlayer.x;
    this.localPlayerLayer.y = this.localPlayer.y;
    this.localPlayerLayer.rotation = this.localPlayer.heading;

    // 2. Camera follow (center local player in viewport)
    const viewWidth = this.app.screen.width;
    const viewHeight = this.app.screen.height;
    this.worldContainer.x = viewWidth / 2 - this.localPlayer.x;
    this.worldContainer.y = viewHeight / 2 - this.localPlayer.y;

    // 3. Proximity Check for nearby properties (within 70 units of entrance)
    let closestProperty: WorldProperty | null = null;
    let minDist = 75;

    for (const [, item] of this.propertyEntryNodes.entries()) {
      const dist = Math.hypot(this.localPlayer.x - item.x, this.localPlayer.y - item.y);
      if (dist < minDist) {
        minDist = dist;
        closestProperty = item.prop;
      }
    }

    if (this.callbacks.onNearProperty) {
      this.callbacks.onNearProperty(closestProperty);
    }

    // 4. Rate-limited position broadcast callback (every 90ms)
    const now = performance.now();
    if (now - this.lastBroadcastTime > 90) {
      this.lastBroadcastTime = now;
      if (this.callbacks.onPositionChange) {
        this.callbacks.onPositionChange(
          this.localPlayer.x,
          this.localPlayer.y,
          this.localPlayer.heading,
          this.localPlayer.speed
        );
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
