import { GameState, CropType, StageInfo } from './types';

export const INITIAL_STATE: GameState = {
  coins: 200,
  xp: 0,
  level: 1,
  currentStage: 1,
  plots: Array.from({ length: 12 }, (_, i) => ({
    id: i,
    unlocked: i < 6, // 6 initial plots
    crop: null,
    stage: 'empty',
    plantedAt: null,
    growthTime: 25000, // 25 seconds for prototype testing
    watered: false,
  })),
  inventory: {
    wheatSeeds: 5,
    carrotSeeds: 3,
    tomatoSeeds: 2,
    wheat: 0,
    carrot: 0,
    tomato: 0,
    eggs: 0,
    bread: 0,
  },
  buildings: {
    well: true,
    warehouse: true,
    chickenCoop: false,
    bakery: false,
    chickensCount: 0,
    eggsReady: 0,
  },
  marketChallenge: null,
  activeQuest: {
    title: 'البداية النشطة',
    description: 'قم بزراعة 3 قطع أرض بالقمح وحصادها لإثبات مهاراتك الزراعية.',
    questGoal: 'harvest_3_wheat',
    rewardCoins: 50,
    rewardXp: 40,
    reason: 'أفضل طريقة للبدء في مزرعتك هي إنتاج قمح طازج.',
    completed: false,
  },
  soundEnabled: true,
  started: false,
};

export const STAGES: StageInfo[] = [
  {
    id: 1,
    title: 'المرحلة 1: البداية',
    description: 'تعلم أساسيات الزراعة والري والحصاد.',
    targetDescription: 'زراعة وحصاد 3 قطع محاصيل.',
    rewardCoins: 100,
    rewardXp: 50,
    completed: false,
  },
  {
    id: 2,
    title: 'المرحلة 2: أول تجارة',
    description: 'قم ببيع محاصيلك في السوق المحلي لجني الأرباح.',
    targetDescription: 'بيع محاصيل بقيمة 100 عملة أو أكثر.',
    rewardCoins: 150,
    rewardXp: 80,
    completed: false,
  },
  {
    id: 3,
    title: 'المرحلة 3: مزرعة منتجة',
    description: 'أنشئ حظيرة للدجاج واجمع البيض الطازج.',
    targetDescription: 'بناء الحظيرة وجمع 5 بيضات.',
    rewardCoins: 250,
    rewardXp: 120,
    completed: false,
  },
  {
    id: 4,
    title: 'المرحلة 4: التصنيع',
    description: 'افتح المخبز وحول قمحك إلى أرغفة خبز شهية.',
    targetDescription: 'بناء المخبز وإنتاج 3 أرغفة خبز.',
    rewardCoins: 350,
    rewardXp: 180,
    completed: false,
  },
  {
    id: 5,
    title: 'المرحلة 5: التوسع الكبير',
    description: 'افتح أراضي جديدة وأكمل طلباً متكاملًا للسوق.',
    targetDescription: 'فتح قطعة أرض جديدة وإتمام طلب متنوع.',
    rewardCoins: 500,
    rewardXp: 300,
    completed: false,
  },
];

export const CROP_CONFIGS: Record<CropType, { name: string; seedCost: number; sellPrice: number; xpReward: number; growthTime: number; icon: string }> = {
  wheat: {
    name: 'قمح',
    seedCost: 10,
    sellPrice: 25,
    xpReward: 15,
    growthTime: 20000, // 20s
    icon: '🌾',
  },
  carrot: {
    name: 'جزر',
    seedCost: 15,
    sellPrice: 40,
    xpReward: 25,
    growthTime: 35000, // 35s
    icon: '🥕',
  },
  tomato: {
    name: 'طماطم',
    seedCost: 25,
    sellPrice: 65,
    xpReward: 40,
    growthTime: 50000, // 50s
    icon: '🍅',
  },
};

// Check bankruptcy safety: if coins < 10 and no seeds and no crops, give 3 free wheat seeds
export function checkBankruptcySafety(state: GameState): GameState {
  const totalSeeds = state.inventory.wheatSeeds + state.inventory.carrotSeeds + state.inventory.tomatoSeeds;
  const totalCrops = state.inventory.wheat + state.inventory.carrot + state.inventory.tomato;
  const growingCrops = state.plots.filter(p => p.stage !== 'empty').length;

  if (state.coins < 10 && totalSeeds === 0 && totalCrops === 0 && growingCrops === 0) {
    return {
      ...state,
      inventory: {
        ...state.inventory,
        wheatSeeds: state.inventory.wheatSeeds + 3,
      },
    };
  }
  return state;
}

export function checkStageProgression(state: GameState, actionType: string, payload?: any): GameState {
  let newState = { ...state };
  let stageChanged = false;

  const currentStageInfo = STAGES[newState.currentStage - 1];
  if (!currentStageInfo || currentStageInfo.completed) return newState;

  if (newState.currentStage === 1 && actionType === 'HARVEST') {
    // Stage 1: harvest 3 crops
    // Checked via cumulative stats or quest
    // Let's mark completed if player harvested at least 3 crops total
    if ((newState.xp >= 45)) {
      currentStageInfo.completed = true;
      newState.coins += currentStageInfo.rewardCoins;
      newState.xp += currentStageInfo.rewardXp;
      newState.currentStage = 2;
      stageChanged = true;
    }
  } else if (newState.currentStage === 2 && actionType === 'SELL') {
    if (payload?.totalSold >= 100 || newState.coins >= 350) {
      currentStageInfo.completed = true;
      newState.coins += currentStageInfo.rewardCoins;
      newState.xp += currentStageInfo.rewardXp;
      newState.currentStage = 3;
      stageChanged = true;
    }
  } else if (newState.currentStage === 3 && actionType === 'COLLECT_EGGS') {
    if (newState.buildings.chickenCoop && newState.inventory.eggs >= 5) {
      currentStageInfo.completed = true;
      newState.coins += currentStageInfo.rewardCoins;
      newState.xp += currentStageInfo.rewardXp;
      newState.currentStage = 4;
      stageChanged = true;
    }
  } else if (newState.currentStage === 4 && actionType === 'BAKE_BREAD') {
    if (newState.buildings.bakery && newState.inventory.bread >= 3) {
      currentStageInfo.completed = true;
      newState.coins += currentStageInfo.rewardCoins;
      newState.xp += currentStageInfo.rewardXp;
      newState.currentStage = 5;
      stageChanged = true;
    }
  } else if (newState.currentStage === 5 && actionType === 'EXPAND_LAND') {
    const unlockedCount = newState.plots.filter(p => p.unlocked).length;
    if (unlockedCount > 6) {
      currentStageInfo.completed = true;
      newState.coins += currentStageInfo.rewardCoins;
      newState.xp += currentStageInfo.rewardXp;
      stageChanged = true;
    }
  }

  // Level calculation
  const newLevel = Math.floor(newState.xp / 100) + 1;
  if (newLevel > newState.level) {
    newState.level = newLevel;
  }

  return checkBankruptcySafety(newState);
}
