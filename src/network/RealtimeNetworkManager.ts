import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { PlayerState, TravelMode } from '@/types/world';

export class RealtimeNetworkManager {
  private channel: RealtimeChannel | null = null;
  private localPlayerId: string;
  private onRemotePlayersUpdate: (players: PlayerState[]) => void;
  private remotePlayers = new Map<string, PlayerState>();

  constructor(localPlayerId: string, onRemotePlayersUpdate: (players: PlayerState[]) => void) {
    this.localPlayerId = localPlayerId;
    this.onRemotePlayersUpdate = onRemotePlayersUpdate;
  }

  public connect(initialPlayer: { name: string; avatarColor: string; x: number; y: number; travelMode: TravelMode }) {
    // Spatial grid channel for Central Accra (can shard dynamically by coordinates)
    const channelName = 'accra:grid:central';

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: this.localPlayerId },
      },
    });

    // 1. Listen for position broadcasts
    this.channel.on('broadcast', { event: 'pos' }, ({ payload }) => {
      if (!payload || payload.id === this.localPlayerId) return;

      const remote: PlayerState = {
        id: payload.id,
        name: payload.name || 'Accra Resident',
        avatarColor: payload.avatarColor || '#38BDF8',
        x: payload.x,
        y: payload.y,
        heading: payload.heading || 0,
        speed: payload.speed || 0,
        travelMode: payload.travelMode || 'walk',
        lastSeen: Date.now(),
      };

      this.remotePlayers.set(payload.id, remote);
      this.notifyUpdates();
    });

    // 2. Track presence joins/leaves
    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      for (const p of leftPresences) {
        if (p.presence_ref) {
          // Player left
          this.remotePlayers.delete(p.key);
        }
      }
      this.notifyUpdates();
    });

    // Subscribe and track presence
    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          id: this.localPlayerId,
          name: initialPlayer.name,
          avatarColor: initialPlayer.avatarColor,
          onlineAt: new Date().toISOString(),
        });
      }
    });

    // Cleanup stale players (>8 seconds without packets)
    setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, p] of this.remotePlayers.entries()) {
        if (now - p.lastSeen > 8000) {
          this.remotePlayers.delete(id);
          changed = true;
        }
      }
      if (changed) this.notifyUpdates();
    }, 3000);
  }

  public broadcastPosition(
    name: string,
    avatarColor: string,
    x: number,
    y: number,
    heading: number,
    speed: number,
    travelMode: TravelMode
  ) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'pos',
      payload: {
        id: this.localPlayerId,
        name,
        avatarColor,
        x,
        y,
        heading,
        speed,
        travelMode,
      },
    });
  }

  private notifyUpdates() {
    this.onRemotePlayersUpdate(Array.from(this.remotePlayers.values()));
  }

  public disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
