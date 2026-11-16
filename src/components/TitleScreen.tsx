import React from 'react';
import { Sprout, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onReset: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onReset }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-900 via-stone-900 to-amber-950 text-white p-6 select-none overflow-y-auto">
      <div className="max-w-xl w-full bg-stone-900/80 backdrop-blur-md border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600/30 border border-emerald-500/50 rounded-2xl shadow-inner mb-2 animate-bounce">
          <Sprout className="w-10 h-10 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-amber-300 font-serif">
            مزرعتي — رحلة الازدهار
          </h1>
          <p className="text-stone-300 text-sm max-w-md mx-auto leading-relaxed">
            لعبة مزرعة ثلاثية الأبعاد تفاعلية. ازرع، احصد، ابنِ الحظيرة والمخبز، وتفاعل مع مرشد المزرعة الذكي المدعوم بـ Gemini لاكتشاف المغامرات الجديدة!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 py-2 text-xs text-stone-300">
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700">
            <span className="block font-bold text-amber-400 text-base mb-1">🌾 زراعة وحصاد</span>
            محاصيل متنوعة بنظام نمو زمني سريع
          </div>
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700">
            <span className="block font-bold text-amber-400 text-base mb-1">🏡 تطوير مباني</span>
            حظيرة دجاج ومخبز وأراضي إضافية
          </div>
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700">
            <span className="block font-bold text-emerald-400 text-base mb-1">🤖 مرشد ذكي</span>
            مهام جانبية مخصصة ومقترحات تناسب حالتك
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/50 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
          >
            <Play className="w-6 h-6 fill-current" />
            ابدأ رحلة المزرعة
          </button>

          <button
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-2xl border border-stone-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            إعادة تعيين التقدم
          </button>
        </div>

        <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-800 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>تحكم الكاميرا: النقر والسحب للتدوران • عجلة الفأرة للتقريب</span>
        </div>
      </div>
    </div>
  );
};
