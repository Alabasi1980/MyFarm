/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameState, CropType, AdvisorQuest, MarketChallenge } from './game/types';
import { INITIAL_STATE, CROP_CONFIGS, checkBankruptcySafety, checkStageProgression } from './game/gameLogic';
import { FarmScene } from './components/FarmScene';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';
import { AdvisorModal } from './components/AdvisorModal';
import { MarketChallengeModal } from './components/MarketChallengeModal';

const STORAGE_KEY = 'tera_desk_farm_game_save_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check autostart query param
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autostart') === '1') {
          parsed.started = true;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
    // Check autostart query param for initial state too
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      return { ...INITIAL_STATE, started: true };
    }
    return INITIAL_STATE;
  });

  const [selectedTool, setSelectedTool] = useState<'water' | 'harvest' | 'plant_wheat' | 'plant_carrot' | 'plant_tomato' | null>('plant_wheat');
  const [selectedCropToPlant, setSelectedCropToPlant] = useState<CropType | null>('wheat');

  const [shopOpen, setShopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);

  // Save game state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Game tick for crop growth & egg production & challenge countdown
  useEffect(() => {
    if (!gameState.started) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        let updated = { ...prev };
        let stateChanged = false;

        // 1. Update plots growth
        const now = Date.now();
        const newPlots = prev.plots.map(plot => {
          if (plot.unlocked && plot.crop && plot.plantedAt && plot.stage !== 'ready') {
            const elapsed = now - plot.plantedAt;
            const config = CROP_CONFIGS[plot.crop];
            if (elapsed >= config.growthTime) {
              stateChanged = true;
              return { ...plot, stage: 'ready' as const };
            } else if (elapsed >= config.growthTime / 2 && plot.stage === 'seed') {
              stateChanged = true;
              return { ...plot, stage: 'growing' as const };
            }
          }
          return plot;
        });

        if (stateChanged) {
          updated.plots = newPlots;
        }

        // 2. Chicken coop egg production
        if (prev.buildings.chickenCoop) {
          if (Math.random() < 0.05 && prev.buildings.eggsReady < 10) {
            updated.buildings = {
              ...updated.buildings,
              eggsReady: updated.buildings.eggsReady + 1,
            };
          }
        }

        // 3. Market challenge timer
        if (prev.marketChallenge && prev.marketChallenge.active && prev.marketChallenge.timeLeft > 0) {
          const newTime = prev.marketChallenge.timeLeft - 1;
          if (newTime <= 0) {
            updated.marketChallenge = { ...prev.marketChallenge, active: false, timeLeft: 0 };
          } else {
            updated.marketChallenge = { ...prev.marketChallenge, timeLeft: newTime };
          }
        }

        return checkBankruptcySafety(updated);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.started]);

  // Tool selection handler
  const handleSelectTool = (tool: 'water' | 'harvest' | 'plant_wheat' | 'plant_carrot' | 'plant_tomato' | null, crop?: CropType) => {
    setSelectedTool(tool);
    if (crop) {
      setSelectedCropToPlant(crop);
    }
  };

  // Plot interaction handler
  const handlePlotClick = (plotId: number) => {
    setGameState(prev => {
      const plot = prev.plots.find(p => p.id === plotId);
      if (!plot || !plot.unlocked) return prev;

      let newPlots = [...prev.plots];
      let newInventory = { ...prev.inventory };
      let newXp = prev.xp;
      let newCoins = prev.coins;
      let actionType = '';

      if (selectedTool === 'water') {
        newPlots[plotId] = { ...plot, watered: true };
      } else if (selectedTool === 'harvest' && plot.stage === 'ready' && plot.crop) {
        const cropType = plot.crop;
        newInventory[cropType] += 1;
        const config = CROP_CONFIGS[cropType];
        newXp += config.xpReward;
        newPlots[plotId] = { ...plot, crop: null, stage: 'empty', plantedAt: null, watered: false };
        actionType = 'HARVEST';
      } else if (selectedTool?.startsWith('plant_') && plot.stage === 'empty' && selectedCropToPlant) {
        const seedKey = `${selectedCropToPlant}Seeds` as keyof GameState['inventory'];
        if (newInventory[seedKey] > 0) {
          newInventory[seedKey] -= 1;
          const config = CROP_CONFIGS[selectedCropToPlant];
          newPlots[plotId] = {
            ...plot,
            crop: selectedCropToPlant,
            stage: 'seed',
            plantedAt: Date.now(),
            growthTime: config.growthTime,
          };
          actionType = 'PLANT';
        }
      }

      let updatedState: GameState = {
        ...prev,
        plots: newPlots,
        inventory: newInventory,
        xp: newXp,
        coins: newCoins,
      };

      return checkStageProgression(updatedState, actionType);
    });
  };

  // Buy seeds
  const handleBuySeeds = (crop: CropType, count: number) => {
    setGameState(prev => {
      const config = CROP_CONFIGS[crop];
      const totalCost = config.seedCost * count;
      if (prev.coins < totalCost) return prev;

      const seedKey = `${crop}Seeds` as keyof GameState['inventory'];
      return {
        ...prev,
        coins: prev.coins - totalCost,
        inventory: {
          ...prev.inventory,
          [seedKey]: prev.inventory[seedKey] + count,
        },
      };
    });
  };

  // Buy buildings
  const handleBuyBuilding = (building: 'chickenCoop' | 'bakery') => {
    setGameState(prev => {
      const cost = building === 'chickenCoop' ? 200 : 350;
      if (prev.coins < cost || prev.buildings[building]) return prev;

      let updated = {
        ...prev,
        coins: prev.coins - cost,
        buildings: {
          ...prev.buildings,
          [building]: true,
        },
      };

      if (building === 'chickenCoop') {
        updated = checkStageProgression(updated, 'COLLECT_EGGS');
      } else if (building === 'bakery') {
        updated = checkStageProgression(updated, 'BAKE_BREAD');
      }

      return updated;
    });
  };

  // Expand land
  const handleExpandLand = () => {
    setGameState(prev => {
      const lockedPlots = prev.plots.filter(p => !p.unlocked);
      if (lockedPlots.length === 0) return prev;
      const cost = 150 + (12 - prev.plots.length) * 50;
      if (prev.coins < cost) return prev;

      const nextPlotToUnlock = lockedPlots[0];
      const newPlots = prev.plots.map(p => (p.id === nextPlotToUnlock.id ? { ...p, unlocked: true } : p));

      const updated: GameState = {
        ...prev,
        coins: prev.coins - cost,
        plots: newPlots,
      };

      return checkStageProgression(updated, 'EXPAND_LAND');
    });
  };

  // Sell item
  const handleSellItem = (itemKey: keyof GameState['inventory'], count: number, price: number, xp: number) => {
    setGameState(prev => {
      if (prev.inventory[itemKey] < count) return prev;

      const updated: GameState = {
        ...prev,
        coins: prev.coins + price * count,
        xp: prev.xp + xp * count,
        inventory: {
          ...prev.inventory,
          [itemKey]: prev.inventory[itemKey] - count,
        },
      };

      return checkStageProgression(updated, 'SELL', { totalSold: price * count });
    });
  };

  // Bake bread
  const handleBakeBread = () => {
    setGameState(prev => {
      if (prev.inventory.wheat < 3 || !prev.buildings.bakery) return prev;

      const updated: GameState = {
        ...prev,
        inventory: {
          ...prev.inventory,
          wheat: prev.inventory.wheat - 3,
          bread: prev.inventory.bread + 1,
        },
        xp: prev.xp + 40,
      };

      return checkStageProgression(updated, 'BAKE_BREAD');
    });
  };

  // Collect eggs
  const handleCollectEggs = () => {
    setGameState(prev => {
      if (prev.buildings.eggsReady <= 0) return prev;

      const count = prev.buildings.eggsReady;
      const updated: GameState = {
        ...prev,
        inventory: {
          ...prev.inventory,
          eggs: prev.inventory.eggs + count,
        },
        buildings: {
          ...prev.buildings,
          eggsReady: 0,
        },
        xp: prev.xp + count * 10,
      };

      return checkStageProgression(updated, 'COLLECT_EGGS');
    });
  };

  // Advisor quest fetch via backend API
  const handleFetchAdvisorQuest = async () => {
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON from /api/advisor:', text);
        data = {
          fallback: true,
          title: 'مهمة مرشد المزرعة الطارئة',
          description: 'قم بزراعة وحصاد 3 محاصيل جديدة لإنعاش مزرعتك.',
          questGoal: 'harvest_3_crops',
          rewardCoins: 50,
          rewardXp: 30,
          reason: 'مقترح محلي احتياطي لضمان استمرارية المغامرة.'
        };
      }

      setGameState(prev => ({
        ...prev,
        activeQuest: {
          title: data.title || 'مهمة مرشد المزرعة',
          description: data.description || 'أتمم الأنشطة المطلوبة.',
          questGoal: data.questGoal || 'harvest_crops',
          rewardCoins: data.rewardCoins || 50,
          rewardXp: data.rewardXp || 30,
          reason: data.reason || 'بناءً على حالة مزرعتك.',
          fallback: data.fallback || false,
          completed: false,
        },
      }));
    } catch (err) {
      console.error('Failed to fetch advisor quest', err);
      setGameState(prev => ({
        ...prev,
        activeQuest: {
          title: 'مهمة مرشد المزرعة المحلية',
          description: 'قم بري وحصاد محاصيلك لتطوير المزرعة.',
          questGoal: 'harvest_crops',
          rewardCoins: 40,
          rewardXp: 25,
          reason: 'وضع الاتصال المحلي.',
          fallback: true,
          completed: false,
        },
      }));
    }
  };

  // Start market challenge
  const handleStartChallenge = () => {
    setGameState(prev => ({
      ...prev,
      marketChallenge: {
        active: true,
        timeLeft: 180, // 3 minutes
        targetWheat: 5,
        targetCarrot: 3,
        targetEggs: 2,
        targetBread: 1,
        rewardCoins: 300,
        rewardXp: 150,
      },
    }));
  };

  // Complete market challenge
  const handleCompleteChallenge = () => {
    setGameState(prev => {
      const ch = prev.marketChallenge;
      if (!ch || !ch.active) return prev;
      if (
        prev.inventory.wheat < ch.targetWheat ||
        prev.inventory.carrot < ch.targetCarrot ||
        prev.inventory.eggs < ch.targetEggs ||
        prev.inventory.bread < ch.targetBread
      ) {
        return prev;
      }

      return {
        ...prev,
        coins: prev.coins + ch.rewardCoins,
        xp: prev.xp + ch.rewardXp,
        inventory: {
          ...prev.inventory,
          wheat: prev.inventory.wheat - ch.targetWheat,
          carrot: prev.inventory.carrot - ch.targetCarrot,
          eggs: prev.inventory.eggs - ch.targetEggs,
          bread: prev.inventory.bread - ch.targetBread,
        },
        marketChallenge: null,
      };
    });
    setChallengeOpen(false);
  };

  // Reset game
  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع تقدم المزرعة والبدء من جديد؟')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(INITIAL_STATE);
    }
  };

  if (!gameState.started) {
    return (
      <TitleScreen
        onStart={() => setGameState(prev => ({ ...prev, started: true }))}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* 3D WebGL Farm Scene */}
      <FarmScene
        plots={gameState.plots}
        buildings={gameState.buildings}
        selectedTool={selectedTool}
        selectedCropToPlant={selectedCropToPlant}
        onPlotClick={handlePlotClick}
        onCoopClick={handleCollectEggs}
        onBakeryClick={() => setInventoryOpen(true)}
        onWellClick={() => {
          // Well action: quick water all planted plots
          setGameState(prev => ({
            ...prev,
            plots: prev.plots.map(p => (p.unlocked && p.crop ? { ...p, watered: true } : p)),
          }));
        }}
      />

      {/* Game HUD Overlay */}
      <HUD
        gameState={gameState}
        selectedTool={selectedTool}
        selectedCropToPlant={selectedCropToPlant}
        onSelectTool={handleSelectTool}
        onOpenShop={() => setShopOpen(true)}
        onOpenInventory={() => setInventoryOpen(true)}
        onOpenAdvisor={() => setAdvisorOpen(true)}
        onOpenChallenge={() => setChallengeOpen(true)}
        onCollectEggs={handleCollectEggs}
        onReset={handleReset}
      />

      {/* Modals */}
      <ShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        gameState={gameState}
        onBuySeeds={handleBuySeeds}
        onBuyBuilding={handleBuyBuilding}
        onExpandLand={handleExpandLand}
      />

      <InventoryModal
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        gameState={gameState}
        onSellItem={handleSellItem}
        onBakeBread={handleBakeBread}
      />

      <AdvisorModal
        isOpen={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        gameState={gameState}
        onAcceptQuest={() => {}}
        onFetchNewQuest={handleFetchAdvisorQuest}
      />

      <MarketChallengeModal
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        challenge={gameState.marketChallenge}
        gameState={gameState}
        onStartChallenge={handleStartChallenge}
        onCompleteChallenge={handleCompleteChallenge}
      />
    </div>
  );
}
