import React, { useState } from 'react';
import { Coins, Sparkles, Store, Package, Bot, Award, Droplet, Sprout, Scissors, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { GameState, CropType } from '../game/types';
import { STAGES } from '../game/gameLogic';

interface HUDProps {
  gameState: GameState;
  selectedTool: 'water' | 'harvest' | 'plant_wheat' | 'plant_carrot' | 'plant_tomato' | null;
  selectedCropToPlant: CropType | null;
  onSelectTool: (tool: 'water' | 'harvest' | 'plant_wheat' | 'plant_carrot' | 'plant_tomato' | null, crop?: CropType) => void;
  onOpenShop: () => void;
  onOpenInventory: () => void;
  onOpenAdvisor: () => void;
  onOpenChallenge: () => void;
  onCollectEggs: () => void;
  onReset: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  selectedTool,
  selectedCropToPlant,
  onSelectTool,
  onOpenShop,
  onOpenInventory,
  onOpenAdvisor,
  onOpenChallenge,
  onCollectEggs,
  onReset,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const currentStageInfo = STAGES[gameState.currentStage - 1] || STAGES[STAGES.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pointer-events-auto max-w-5xl mx-auto w-full gap-4">
        {/* Player Stats */}
        <div className="flex items-center gap-3 bg-stone-900/80 backdrop-blur-md border border-amber-500/30 rounded-2xl px-4 py-2.5 shadow-xl text-white">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Coins className="w-5 h-5" />
            <span className="text-lg">{gameState.coins}</span>
          </div>
          <div className="w-px h-6 bg-stone-700" />
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <span>مستوى {gameState.level}</span>
          </div>
          <div className="w-px h-6 bg-stone-700" />
          <div className="text-xs text-stone-300">
            خبرة: <span className="font-bold text-white">{gameState.xp}</span>
          </div>
        </div>

        {/* Current Stage / Mission Banner */}
        <div className="hidden md:flex items-center gap-3 bg-stone-900/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl px-5 py-2.5 shadow-xl text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">{currentStageInfo.title}</span>
            </div>
            <p className="text-xs text-stone-300">{currentStageInfo.targetDescription}</p>
          </div>
        </div>

        {/* Quick action buttons top-right */}
        <div className="flex items-center gap-2">
          {gameState.buildings.chickenCoop && gameState.buildings.eggsReady > 0 && (
            <button
              onClick={onCollectEggs}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs animate-bounce"
            >
              <span>🥚 جمع البيض ({gameState.buildings.eggsReady})</span>
            </button>
          )}
          <button
            onClick={onReset}
            className="p-2.5 bg-stone-900/80 hover:bg-stone-800 text-stone-300 rounded-xl border border-stone-700 shadow-xl transition"
            title="إعادة تعيين"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toolbar / Tools Selector (Left or Right) */}
      <div className="absolute right-4 top-24 pointer-events-auto flex flex-col gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/80 p-2 rounded-2xl shadow-xl">
        <span className="text-[10px] text-stone-400 text-center font-bold">أدوات المزرعة</span>
        <button
          onClick={() => onSelectTool('water')}
          className={`p-3 rounded-xl transition flex flex-col items-center gap-1 text-xs ${
            selectedTool === 'water' ? 'bg-sky-600 text-white shadow-lg' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
          }`}
          title="أداة الري"
        >
          <Droplet className="w-5 h-5 text-sky-300" />
          <span>ري</span>
        </button>
        <button
          onClick={() => onSelectTool('harvest')}
          className={`p-3 rounded-xl transition flex flex-col items-center gap-1 text-xs ${
            selectedTool === 'harvest' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
          }`}
          title="أداة الحصاد"
        >
          <Scissors className="w-5 h-5 text-emerald-300" />
          <span>حصاد</span>
        </button>
        <button
          onClick={() => onSelectTool('plant_wheat', 'wheat')}
          className={`p-3 rounded-xl transition flex flex-col items-center gap-1 text-xs ${
            selectedTool === 'plant_wheat' ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
          }`}
          title="زراعة قمح"
        >
          <span className="text-xl">🌾</span>
          <span>قمح</span>
        </button>
        <button
          onClick={() => onSelectTool('plant_carrot', 'carrot')}
          className={`p-3 rounded-xl transition flex flex-col items-center gap-1 text-xs ${
            selectedTool === 'plant_carrot' ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
          }`}
          title="زراعة جزر"
        >
          <span className="text-xl">🥕</span>
          <span>جزر</span>
        </button>
      </div>

      {/* Bottom Collapsible Dock */}
      <div className="pointer-events-auto flex flex-col items-center w-full pb-2">
        <button
          onClick={() => setDockCollapsed(!dockCollapsed)}
          className="px-4 py-1 bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-t-xl text-xs font-medium shadow-md transition flex items-center gap-1.5"
        >
          <span>{dockCollapsed ? '▴ إظهار القائمة' : '▾ إخفاء القائمة'}</span>
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {!dockCollapsed && (
          <div className="max-w-xl w-full bg-stone-900/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-3 shadow-2xl flex items-center justify-around gap-2 text-white">
            <button
              onClick={onOpenShop}
              className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl flex flex-col items-center gap-1 transition text-amber-300 font-bold text-xs"
            >
              <Store className="w-5 h-5 text-amber-400" />
              <span>المتجر</span>
            </button>
            <button
              onClick={onOpenInventory}
              className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl flex flex-col items-center gap-1 transition text-emerald-300 font-bold text-xs"
            >
              <Package className="w-5 h-5 text-emerald-400" />
              <span>المستودع ({gameState.inventory.wheat + gameState.inventory.carrot + gameState.inventory.tomato})</span>
            </button>
            <button
              onClick={onOpenAdvisor}
              className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl flex flex-col items-center gap-1 transition text-teal-300 font-bold text-xs relative"
            >
              <Bot className="w-5 h-5 text-teal-400" />
              <span>مرشد المزرعة</span>
              {gameState.activeQuest && !gameState.activeQuest.completed && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={onOpenChallenge}
              className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl flex flex-col items-center gap-1 transition text-amber-300 font-bold text-xs"
            >
              <Award className="w-5 h-5 text-amber-400" />
              <span>تحدي السوق</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
