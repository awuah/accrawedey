import React from 'react';
import { TravelMode, WorldProperty } from '@/types/world';
import { Coins, Car, Bike, Footprints, MapPin, Building, ChevronUp } from 'lucide-react';

interface GameHUDProps {
  balance: number;
  travelMode: TravelMode;
  onSelectTravelMode: (mode: TravelMode) => void;
  ownedProperties: WorldProperty[];
  nearProperty: WorldProperty | null;
  onBuyProperty: (prop: WorldProperty) => void;
  onCollectIncome: (prop: WorldProperty) => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  balance,
  travelMode,
  onSelectTravelMode,
  ownedProperties,
  nearProperty,
  onBuyProperty,
  onCollectIncome,
  onOpenAdmin,
  isAdmin,
}) => {
  const [showDrawer, setShowDrawer] = React.useState(false);

  return (
    <>
      {/* TOP BAR: Balance & Quick Stats */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Cedis Balance Capsule */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FBF9F5]/90 border border-[#E8DFCF] backdrop-blur-md shadow-md">
          <div className="w-8 h-8 rounded-xl bg-[#EAB308] flex items-center justify-center text-[#292524] font-black text-sm">
            ₵
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider leading-none">
              Accra Wealth
            </div>
            <div className="text-lg font-extrabold text-[#292524] leading-tight">
              GH₵ {balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Action buttons (Admin + Properties Drawer toggle) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              World Editor
            </button>
          )}

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="px-3.5 py-2 rounded-xl bg-[#FBF9F5]/90 hover:bg-[#F4EFE6] border border-[#E8DFCF] text-[#292524] text-xs font-bold backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-[#FB923C]" />
            <span>Properties ({ownedProperties.length})</span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showDrawer ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* TRAVEL MODE SWITCHER (Top Right / Center Floating) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-1.5 bg-[#FBF9F5]/90 border border-[#E8DFCF] p-1.5 rounded-2xl shadow-md backdrop-blur-md">
        <button
          onClick={() => onSelectTravelMode('walk')}
          title="Walk"
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            travelMode === 'walk'
              ? 'bg-[#EAB308] text-[#292524] shadow-sm font-bold'
              : 'text-[#78716C] hover:bg-[#F4EFE6]'
          }`}
        >
          <Footprints className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectTravelMode('bike')}
          title="Bicycle"
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            travelMode === 'bike'
              ? 'bg-[#EAB308] text-[#292524] shadow-sm font-bold'
              : 'text-[#78716C] hover:bg-[#F4EFE6]'
          }`}
        >
          <Bike className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectTravelMode('drive')}
          title="Drive Car"
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            travelMode === 'drive'
              ? 'bg-[#EAB308] text-[#292524] shadow-sm font-bold'
              : 'text-[#78716C] hover:bg-[#F4EFE6]'
          }`}
        >
          <Car className="w-4 h-4" />
        </button>
      </div>

      {/* PROXIMITY ACTION BANNER (When standing near a landmark) */}
      {nearProperty && (
        <div className="absolute bottom-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-20">
          <div className="p-4 rounded-3xl bg-[#FBF9F5] border-2 border-[#292524] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] bg-[#F4EFE6] px-2 py-0.5 rounded-full">
                  {nearProperty.typeId.replace('_', ' ')}
                </span>
                <h3 className="text-base font-extrabold text-[#292524] mt-1">
                  {nearProperty.name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#15803D]">
                  +GH₵ {nearProperty.baseIncomeRate}/min
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#E8DFCF] pt-3">
              <div>
                <div className="text-[11px] text-[#78716C]">Listed Price:</div>
                <div className="text-sm font-extrabold text-[#292524]">
                  GH₵ {nearProperty.price.toLocaleString()}
                </div>
              </div>

              {nearProperty.ownerId ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-[#E8DFCF] text-[#78716C] text-xs font-bold cursor-not-allowed"
                >
                  Owned by {nearProperty.ownerName || 'Someone'}
                </button>
              ) : (
                <button
                  onClick={() => onBuyProperty(nearProperty)}
                  disabled={balance < nearProperty.price}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    balance >= nearProperty.price
                      ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
                      : 'bg-[#E8DFCF] text-[#78716C] cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {balance >= nearProperty.price ? 'Acquire Property' : 'Insufficient Cedis'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OWNED PROPERTIES DRAWER */}
      {showDrawer && (
        <div className="absolute top-16 right-4 w-80 max-h-[70vh] bg-[#FBF9F5] border-2 border-[#292524] rounded-3xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-[#E8DFCF] flex items-center justify-between bg-[#F4EFE6]/50">
            <h4 className="font-extrabold text-[#292524] text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FB923C]" />
              Accra Portfolio ({ownedProperties.length})
            </h4>
            <button
              onClick={() => setShowDrawer(false)}
              className="text-[#78716C] hover:text-[#292524] text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="p-3 overflow-y-auto space-y-2 flex-1">
            {ownedProperties.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#78716C]">
                You do not own any properties yet. Walk up to a yellow entrance mark in Accra to acquire your first property!
              </div>
            ) : (
              ownedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E8DFCF] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#292524]">{prop.name}</div>
                    <div className="text-[10px] text-[#15803D] font-semibold">
                      Yield: +GH₵ {prop.baseIncomeRate * prop.tier}/min
                    </div>
                  </div>
                  <button
                    onClick={() => onCollectIncome(prop)}
                    className="px-3 py-1.5 rounded-xl bg-[#EAB308] hover:bg-[#ca8a04] text-[#292524] text-[11px] font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    Collect
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
