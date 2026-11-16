import React from 'react';
import { Package, X, Coins, Sparkles, TrendingUp } from 'lucide-react';
import { GameState } from '../game/types';
import { CROP_CONFIGS } from '../game/gameLogic';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onSellItem: (itemKey: keyof GameState['inventory'], count: number, price: number, xp: number) => void;
  onBakeBread: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onSellItem,
  onBakeBread,
}) => {
  if (!isOpen) return null;

  const { inventory, buildings } = gameState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-stone-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/40 text-emerald-400">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-amber-300">مستودع المزرعة</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bakery Action shortcut if bakery unlocked */}
        {buildings.bakery && (
          <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🥖</span>
              <div>
                <h4 className="font-bold text-amber-300 text-sm">صناعة الخبز الفاخر</h4>
                <p className="text-xs text-stone-300">استخدم 3 قمح لإنتاج رغيف خبز واحد</p>
              </div>
            </div>
            <button
              disabled={inventory.wheat < 3}
              onClick={onBakeBread}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                inventory.wheat >= 3
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              خبز (3 قمح)
            </button>
          </div>
        )}

        {/* Inventory items list */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {/* Seeds */}
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider pt-2">البذور المخزنة</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700 text-center">
              <span className="text-2xl block mb-1">🌾</span>
              <span className="text-xs text-stone-300">بذور القمح</span>
              <span className="block font-bold text-amber-400 text-lg">{inventory.wheatSeeds}</span>
            </div>
            <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700 text-center">
              <span className="text-2xl block mb-1">🥕</span>
              <span className="text-xs text-stone-300">بذور الجزر</span>
              <span className="block font-bold text-amber-400 text-lg">{inventory.carrotSeeds}</span>
            </div>
            <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700 text-center">
              <span className="text-2xl block mb-1">🍅</span>
              <span className="text-xs text-stone-300">بذور الطماطم</span>
              <span className="block font-bold text-amber-400 text-lg">{inventory.tomatoSeeds}</span>
            </div>
          </div>

          {/* Crops & Products */}
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider pt-3">المحاصيل والمنتجات الجاهزة للبيع</div>
          
          {/* Wheat */}
          <div className="flex items-center justify-between bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <h4 className="font-bold text-white text-sm">قمح ({inventory.wheat})</h4>
                <p className="text-xs text-stone-400">سعر البيع: {CROP_CONFIGS.wheat.sellPrice} عملة</p>
              </div>
            </div>
            <button
              disabled={inventory.wheat <= 0}
              onClick={() => onSellItem('wheat', 1, CROP_CONFIGS.wheat.sellPrice, CROP_CONFIGS.wheat.xpReward)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                inventory.wheat > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              بيع واحد
            </button>
          </div>

          {/* Carrot */}
          <div className="flex items-center justify-between bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥕</span>
              <div>
                <h4 className="font-bold text-white text-sm">جزر ({inventory.carrot})</h4>
                <p className="text-xs text-stone-400">سعر البيع: {CROP_CONFIGS.carrot.sellPrice} عملة</p>
              </div>
            </div>
            <button
              disabled={inventory.carrot <= 0}
              onClick={() => onSellItem('carrot', 1, CROP_CONFIGS.carrot.sellPrice, CROP_CONFIGS.carrot.xpReward)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                inventory.carrot > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              بيع واحد
            </button>
          </div>

          {/* Tomato */}
          <div className="flex items-center justify-between bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍅</span>
              <div>
                <h4 className="font-bold text-white text-sm">طماطم ({inventory.tomato})</h4>
                <p className="text-xs text-stone-400">سعر البيع: {CROP_CONFIGS.tomato.sellPrice} عملة</p>
              </div>
            </div>
            <button
              disabled={inventory.tomato <= 0}
              onClick={() => onSellItem('tomato', 1, CROP_CONFIGS.tomato.sellPrice, CROP_CONFIGS.tomato.xpReward)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                inventory.tomato > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              بيع واحد
            </button>
          </div>

          {/* Eggs */}
          <div className="flex items-center justify-between bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥚</span>
              <div>
                <h4 className="font-bold text-white text-sm">بيض طازج ({inventory.eggs})</h4>
                <p className="text-xs text-stone-400">سعر البيع: 30 عملة</p>
              </div>
            </div>
            <button
              disabled={inventory.eggs <= 0}
              onClick={() => onSellItem('eggs', 1, 30, 20)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                inventory.eggs > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              بيع واحد
            </button>
          </div>

          {/* Bread */}
          <div className="flex items-center justify-between bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥖</span>
              <div>
                <h4 className="font-bold text-white text-sm">خبز فاخر ({inventory.bread})</h4>
                <p className="text-xs text-stone-400">سعر البيع: 100 عملة</p>
              </div>
            </div>
            <button
              disabled={inventory.bread <= 0}
              onClick={() => onSellItem('bread', 1, 100, 50)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                inventory.bread > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              بيع واحد
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
