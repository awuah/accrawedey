import React, { useState } from 'react';
import { AVATAR_PALETTES } from '@/types/constants';
import { User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onJoinAsGuest: (username: string, avatarColor: string) => void;
  onOpenEditor?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onJoinAsGuest, onOpenEditor }) => {
  const [username, setUsername] = useState('Kofi_' + Math.floor(100 + Math.random() * 900));
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PALETTES[0].hex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onJoinAsGuest(username.trim(), selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FBF9F5] border-2 border-[#292524] rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-[#EAB308] border-2 border-[#292524] shadow-md mb-2">
            <Sparkles className="w-6 h-6 text-[#292524]" />
          </div>
          <h2 className="text-xl font-black text-[#292524] tracking-tight">AccraWedey</h2>
          <p className="text-xs text-[#78716C] mt-1 font-medium">
            Explore 2D Accra, meet live players, and build your real estate empire.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-1.5">
              Accra Handle / Name
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFCF] focus:border-[#292524] outline-none text-sm font-bold bg-white text-[#292524] transition-colors"
              placeholder="e.g. Kwame, Ama, Nii"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
              Choose Avatar Pastel Color
            </label>
            <div className="flex items-center justify-between gap-2">
              {AVATAR_PALETTES.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.hex)}
                  title={av.name}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-transform cursor-pointer ${
                    selectedAvatar === av.hex
                      ? 'scale-110 border-[#292524] shadow-md'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: av.hex }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#292524]" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Enter Accra (Instant Play)
          </button>

          <button
            type="button"
            onClick={() => onOpenEditor?.()}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F4EFE6] hover:bg-[#E8DFCF] text-[#0284C7] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#E8DFCF]"
          >
            Launch Admin World Editor 🗺️
          </button>
        </form>
      </div>
    </div>
  );
};
