export type CropType = 'wheat' | 'carrot' | 'tomato';

export interface Plot {
  id: number;
  unlocked: boolean;
  crop: CropType | null;
  stage: 'empty' | 'seed' | 'growing' | 'ready';
  plantedAt: number | null;
  growthTime: number; // in milliseconds (25s - 45s)
  watered: boolean;
}

export interface Inventory {
  wheatSeeds: number;
  carrotSeeds: number;
  tomatoSeeds: number;
  wheat: number;
  carrot: number;
  tomato: number;
  eggs: number;
  bread: number;
}

export interface Buildings {
  well: boolean;
  warehouse: boolean;
  chickenCoop: boolean;
  bakery: boolean;
  chickensCount: number;
  eggsReady: number;
}

export interface StageInfo {
  id: number;
  title: string;
  description: string;
  targetDescription: string;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
}

export interface MarketChallenge {
  active: boolean;
  timeLeft: number; // seconds (180s)
  targetWheat: number;
  targetCarrot: number;
  targetEggs: number;
  targetBread: number;
  rewardCoins: number;
  rewardXp: number;
}

export interface AdvisorQuest {
  title: string;
  description: string;
  questGoal: string;
  rewardCoins: number;
  rewardXp: number;
  reason: string;
  fallback?: boolean;
  completed?: boolean;
}

export interface GameState {
  coins: number;
  xp: number;
  level: number;
  currentStage: number;
  plots: Plot[];
  inventory: Inventory;
  buildings: Buildings;
  marketChallenge: MarketChallenge | null;
  activeQuest: AdvisorQuest | null;
  soundEnabled: boolean;
  started: boolean;
}
