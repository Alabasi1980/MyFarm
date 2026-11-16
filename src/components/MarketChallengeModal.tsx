import React from 'react';
import { Timer, X, Award, CheckCircle, Coins } from 'lucide-react';
import { MarketChallenge, GameState } from '../game/types';

interface MarketChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: MarketChallenge | null;
  gameState: GameState;
  onStartChallenge: () => void;
  onCompleteChallenge: () => void;
}

export const MarketChallengeModal: React.FC<MarketChallengeModalProps> = ({
  isOpen,
  onClose,
  challenge,
  gameState,
  onStartChallenge,
  onCompleteChallenge,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const { inventory } = gameState;
  const canComplete =
    challenge &&
    challenge.active &&
    inventory.wheat >= challenge.targetWheat &&
    inventory.carrot >= challenge.targetCarrot &&
    inventory.eggs >= challenge.targetEggs &&
    inventory.bread >= challenge.targetBread;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-stone-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-amber-300">تحدي السوق السريع</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!challenge || !challenge.active ? (
          <div className="text-center space-y-4 py-4">
            <p className="text-stone-300 text-sm leading-relaxed">
              أضف إثارة لمزرعتك بتنفيذ طلب سوق اختياري بمهلة زمنية مدتها 3 دقائق لمضاعفة أرباحك وعملاتك!
            </p>
            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 text-xs text-stone-300 space-y-2 text-right">
              <div className="font-bold text-amber-400 mb-1">متطلبات الطلب:</div>
              <div>🌾 5 قمح • 🥕 3 جزر • 🥚 2 بيض</div>
              <div className="text-emerald-400 font-bold pt-1">المكافأة: 300 عملة + 150 خبرة</div>
            </div>
            <button
              onClick={onStartChallenge}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow transition text-base"
            >
              قبول التحدي وابدأ العد التنازلي
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Timer className="w-7 h-7 text-amber-400 animate-pulse" />
                <div>
                  <span className="text-xs text-stone-300 block">الوقت المتبقي</span>
                  <span className="font-mono text-2xl font-bold text-amber-300">{formatTime(challenge.timeLeft)}</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-bold">
                تحدٍ جارٍ
              </span>
            </div>

            <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-3 text-sm">
              <div className="font-bold text-white mb-1">الكميات المطلوبة في المستودع:</div>
              <div className="flex justify-between items-center text-xs">
                <span>قمح ({inventory.wheat} / {challenge.targetWheat})</span>
                <span className={inventory.wheat >= challenge.targetWheat ? 'text-emerald-400' : 'text-amber-400'}>
                  {inventory.wheat >= challenge.targetWheat ? 'جاهز ✓' : 'ناقص'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>جزر ({inventory.carrot} / {challenge.targetCarrot})</span>
                <span className={inventory.carrot >= challenge.targetCarrot ? 'text-emerald-400' : 'text-amber-400'}>
                  {inventory.carrot >= challenge.targetCarrot ? 'جاهز ✓' : 'ناقص'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>بيض ({inventory.eggs} / {challenge.targetEggs})</span>
                <span className={inventory.eggs >= challenge.targetEggs ? 'text-emerald-400' : 'text-amber-400'}>
                  {inventory.eggs >= challenge.targetEggs ? 'جاهز ✓' : 'ناقص'}
                </span>
              </div>
            </div>

            <button
              disabled={!canComplete}
              onClick={onCompleteChallenge}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                canComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              تسليم الطلب واستلام المكافأة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
