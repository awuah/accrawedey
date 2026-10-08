import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { RealtimeNetworkManager } from '@/network/RealtimeNetworkManager';
import { ACCRA_STARTER_WORLD } from '@/data/accraWorld';
import { AccraWorldData, TravelMode, WorldProperty, PlayerState } from '@/types/world';
import { GameHUD } from '@/components/GameHUD';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import { AuthModal } from '@/components/AuthModal';
import { WorldEditor } from '@/components/WorldEditor';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const networkRef = useRef<RealtimeNetworkManager | null>(null);

  // App State
  const [worldData, setWorldData] = useState<AccraWorldData>(ACCRA_STARTER_WORLD);
  const [balance, setBalance] = useState<number>(50000); // GH₵ 50,000 starting cash
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const [nearProperty, setNearProperty] = useState<WorldProperty | null>(null);
  const [ownedPropertyIds, setOwnedPropertyIds] = useState<Set<string>>(new Set());
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(true); // Default to admin for co-founder editor access
  const [isEditorOpen, setIsEditorOpen] = useState(() => {
    return window.location.search.includes('admin') || window.location.hash.includes('admin');
  });

  // 1. Initialize Game Engine when login completes
  const handleJoin = (name: string, color: string) => {
    const generatedId = 'user_' + Math.random().toString(36).substring(2, 9);
    setUsername(name);
    setAvatarColor(color);
    setUserId(generatedId);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (!isLoggedIn || !containerRef.current) return;

    // Create Engine
    const engine = new GameEngine(worldData, {
      onNearProperty: (prop) => {
        setNearProperty(prop);
      },
      onPositionChange: (x, y, heading, speed) => {
        networkRef.current?.broadcastPosition(username, avatarColor, x, y, heading, speed, travelMode);
      },
    });

    engine.setPlayerName(username);
    engine.setAvatarColor(avatarColor);
    engine.setTravelMode(travelMode);

    engine.init(containerRef.current).then(() => {
      engineRef.current = engine;
    });

    // Create Realtime Network Manager
    const network = new RealtimeNetworkManager(userId, (remotePlayers: PlayerState[]) => {
      engineRef.current?.updateRemotePlayers(remotePlayers);
    });

    network.connect({
      name: username,
      avatarColor: avatarColor,
      x: 1200,
      y: 900,
      travelMode: travelMode,
    });
    networkRef.current = network;

    return () => {
      network.disconnect();
      engine.destroy();
      engineRef.current = null;
      networkRef.current = null;
    };
  }, [isLoggedIn]);

  // Handle Travel Mode Switch
  const handleSelectTravelMode = (mode: TravelMode) => {
    setTravelMode(mode);
    engineRef.current?.setTravelMode(mode);
  };

  // Property Purchase Action (Optimistic with Ledger Update)
  const handleBuyProperty = (prop: WorldProperty) => {
    if (balance < prop.price) return;

    // Deduct cash and assign ownership
    setBalance((prev) => prev - prop.price);
    setOwnedPropertyIds((prev) => new Set(prev).add(prop.id));

    // Update property in world state
    const updatedProperties = worldData.properties.map((p) =>
      p.id === prop.id ? { ...p, ownerId: userId, ownerName: username, isForSale: false } : p
    );

    const updatedWorld = { ...worldData, properties: updatedProperties };
    setWorldData(updatedWorld);
    engineRef.current?.updateWorldData(updatedWorld);

    // Celebration Confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#EAB308', '#22C55E', '#FB923C', '#38BDF8'],
    });
  };

  // Passive Rental Income Collection
  const handleCollectIncome = (prop: WorldProperty) => {
    const yieldAmount = prop.baseIncomeRate * prop.tier * 5; // e.g. 5 minutes accrued
    setBalance((prev) => prev + yieldAmount);

    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.2 },
      colors: ['#EAB308', '#22C55E'],
    });
  };

  // Admin World Editor Save & Republish
  const handleSaveWorld = (newWorld: AccraWorldData) => {
    const incremented = { ...newWorld, version: newWorld.version + 1 };
    setWorldData(incremented);
    engineRef.current?.updateWorldData(incremented);
    setIsEditorOpen(false);
  };

  const ownedProperties = worldData.properties.filter((p) => ownedPropertyIds.has(p.id));

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FBF9F5]">
      {/* Pixi 2D Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Auth Screen */}
      {!isLoggedIn && (
        <AuthModal
          onJoinAsGuest={handleJoin}
          onOpenEditor={() => {
            setIsEditorOpen(true);
            setIsLoggedIn(true);
            setUsername('Admin_CoFounder');
            setAvatarColor('#EAB308');
            setUserId('admin_founder');
          }}
        />
      )}

      {/* In-Game HUD Overlays */}
      {isLoggedIn && !isEditorOpen && (
        <>
          <GameHUD
            balance={balance}
            travelMode={travelMode}
            onSelectTravelMode={handleSelectTravelMode}
            ownedProperties={ownedProperties}
            nearProperty={nearProperty}
            onBuyProperty={handleBuyProperty}
            onCollectIncome={handleCollectIncome}
            isAdmin={isAdmin}
            onOpenAdmin={() => setIsEditorOpen(true)}
          />

          {/* Virtual Joystick for Mobile Touch Devices */}
          <div className="absolute bottom-6 left-6 z-30 md:hidden">
            <VirtualJoystick
              onMove={(vec) => {
                engineRef.current?.setJoystickVector(vec.x, vec.y);
              }}
            />
          </div>
        </>
      )}

      {/* Admin World Editor */}
      {isEditorOpen && (
        <WorldEditor
          initialWorld={worldData}
          onSave={handleSaveWorld}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};
