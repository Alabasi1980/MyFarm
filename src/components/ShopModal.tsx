import React, { useState } from 'react';
import { ShoppingBag, X, Store, Sprout, Home, Landmark, Coins } from 'lucide-react';
import { GameState, CropType } from '../game/types';
import { CROP_CONFIGS } from '../game/gameLogic';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onBuySeeds: (crop: CropType, count: number) => void;
  onBuyBuilding: (building: 'chickenCoop' | 'bakery') => void;
  onExpandLand: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onBuySeeds,
  onBuyBuilding,
  onExpandLand,
}) => {
  const [activeTab, setActiveTab] = useState<'seeds' | 'buildings' | 'land'>('seeds');

  if (!isOpen) return null;

  const lockedPlotsCount = gameState.plots.filter(p => !p.unlocked).length;
  const landCost = 150 + (6 - lockedPlotsCount) * 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-stone-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-amber-300">متجر المزرعة</h2>
          </div>
          <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-full border border-stone-700 text-amber-400 font-bold text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{gameState.coins} عملة</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-stone-800/80 p-1.5 rounded-2xl border border-stone-700">
          <button
            onClick={() => setActiveTab('seeds')}
            className={`py-2 px-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'seeds' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sprout className="w-4 h-4" />
            البذور
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`py-2 px-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'buildings' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            المباني
          </button>
          <button
            onClick={() => setActiveTab('land')}
            className={`py-2 px-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'land' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" />
            الأراضي
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'seeds' && (
            <div className="space-y-3">
              {(['wheat', 'carrot', 'tomato'] as CropType[]).map(cropKey => {
                const crop = CROP_CONFIGS[cropKey];
                const canAfford = gameState.coins >= crop.seedCost;
                return (
                  <div
                    key={cropKey}
                    className="flex items-center justify-between bg-stone-800/60 p-4 rounded-2xl border border-stone-700 hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{crop.icon}</span>
                      <div>
                        <h4 className="font-bold text-white">{crop.name}</h4>
                        <p className="text-xs text-stone-400">وقت النمو: {crop.growthTime / 1000} ثوانٍ • العائد: {crop.sellPrice} عملة</p>
                      </div>
                    </div>
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuySeeds(cropKey, 1)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                          : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      شراء ({crop.seedCost})
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'buildings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-stone-800/60 p-4 rounded-2xl border border-stone-750">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🐔</span>
                  <div>
                    <h4 className="font-bold text-white">حظيرة الدجاج</h4>
                    <p className="text-xs text-stone-400">تنتج بيضًا طازجًا باستمرار (مرحلة 3)</p>
                  </div>
                </div>
                {gameState.buildings.chickenCoop ? (
                  <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold">
                    تم البناء ✓
                  </span>
                ) : (
                  <button
                    disabled={gameState.coins < 200}
                    onClick={() => onBuyBuilding('chickenCoop')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-1.5 ${
                      gameState.coins >= 200
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                        : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    بناء (200)
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between bg-stone-800/60 p-4 rounded-2xl border border-stone-750">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🥖</span>
                  <div>
                    <h4 className="font-bold text-white">المخبز الآلي</h4>
                    <p className="text-xs text-stone-400">يصنع الخبز الفاخر من القمح (مرحلة 4)</p>
                  </div>
                </div>
                {gameState.buildings.bakery ? (
                  <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold">
                    تم البناء ✓
                  </span>
                ) : (
                  <button
                    disabled={gameState.coins < 350}
                    onClick={() => onBuyBuilding('bakery')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-1.5 ${
                      gameState.coins >= 350
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                        : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    بناء (350)
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'land' && (
            <div className="space-y-4 text-center py-4">
              <div className="p-4 bg-stone-800/60 rounded-2xl border border-stone-700 space-y-2">
                <Landmark className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="font-bold text-white">توسيع مساحة المزرعة</h4>
                <p className="text-xs text-stone-400">
                  فتح قطعة أرض زراعية جديدة لزيادة طاقتك الإنتاجية. القطع المتبقية: {lockedPlotsCount}
                </p>
              </div>

              {lockedPlotsCount > 0 ? (
                <button
                  disabled={gameState.coins < landCost}
                  onClick={onExpandLand}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    gameState.coins >= landCost
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  فتح أرض جديدة بسعر ({landCost} عملة)
                </button>
              ) : (
                <p className="text-sm text-emerald-400 font-bold">لقد فتحت جميع أراضي المزرعة بالكامل!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
