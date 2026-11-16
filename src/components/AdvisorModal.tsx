import React, { useState } from 'react';
import { Bot, X, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { GameState, AdvisorQuest } from '../game/types';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onAcceptQuest: (quest: AdvisorQuest) => void;
  onFetchNewQuest: () => void;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onAcceptQuest,
  onFetchNewQuest,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quest = gameState.activeQuest;

  const handleFetch = async () => {
    setLoading(true);
    await onFetchNewQuest();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-stone-900 border border-emerald-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 rounded-xl border border-emerald-500/40 text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-emerald-300">مرشد المزرعة الذكي</h2>
              <span className="text-[11px] text-emerald-400 font-medium">مساعدك الشخصي المدعوم بـ Gemini</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {quest ? (
          <div className="bg-stone-800/60 p-5 rounded-2xl border border-stone-700 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                  مهمة جانبية مقترحة
                </span>
                <h3 className="text-lg font-bold text-amber-300 mt-2">{quest.title}</h3>
              </div>
              {quest.fallback && (
                <span className="text-[10px] text-stone-400 bg-stone-700 px-2 py-0.5 rounded">وضع محلي</span>
              )}
            </div>

            <p className="text-stone-300 text-sm leading-relaxed">{quest.description}</p>

            <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-700/60 text-xs text-stone-400 space-y-1">
              <span className="font-bold text-emerald-400 block">سبب الاقتراح:</span>
              <p>{quest.reason}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-700/60 text-xs font-bold">
              <div className="flex items-center gap-3">
                <span className="text-amber-400">💰 +{quest.rewardCoins} عملة</span>
                <span className="text-emerald-400">✨ +{quest.rewardXp} خبرة</span>
              </div>
              <span className={`px-3 py-1 rounded-lg ${quest.completed ? 'bg-emerald-600/30 text-emerald-400' : 'bg-amber-600/30 text-amber-400'}`}>
                {quest.completed ? 'منجزة ✓' : 'نشطة حاليًا'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-stone-400">لا توجد مهمة حالية. اطلب من المرشد اقتراح مهمة!</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={loading}
            onClick={handleFetch}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            طلب مهمة جديدة من Gemini
          </button>
        </div>
      </div>
    </div>
  );
};
