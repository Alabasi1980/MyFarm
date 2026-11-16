import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini AI endpoint for "مرشد المزرعة" (Farm Advisor)
  app.post('/api/advisor', async (req, res) => {
    const playerState = req.body || {};
    const buildings = playerState.buildings || {};
    const unlockedPlotsCount = Array.isArray(playerState.plots)
      ? playerState.plots.filter((p: any) => p.unlocked).length
      : 6;

    // Allowed quest goals based on unlocked content
    const allowedGoals: string[] = ['harvest_3_crops', 'harvest_5_crops', 'sell_crops_100'];
    if (buildings.chickenCoop) allowedGoals.push('collect_eggs_5');
    if (buildings.bakery) allowedGoals.push('bake_bread_3');
    if (unlockedPlotsCount < 12) allowedGoals.push('expand_land');

    const clampRewards = (coins: any, xp: any) => ({
      rewardCoins: Math.min(150, Math.max(30, Math.round(Number(coins) || 50))),
      rewardXp: Math.min(80, Math.max(20, Math.round(Number(xp) || 30))),
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          fallback: true,
          title: 'نصيحة مرشد المزرعة المحلي',
          description: 'قم بزراعة المزيد من القمح والجزر لزيادة رصيدك وفتح مراحل جديدة!',
          questGoal: 'harvest_5_crops',
          rewardCoins: 50,
          rewardXp: 30,
          reason: 'بناءً على رصيدك الحالي وحالة مزرعتك.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `أنت مساعد ذكي ومتعاون في لعبة مزرعة ثلاثية الأبعاد تدعى "مزرعتي — رحلة الازدهار".
حالة اللاعب الحالية:
- المستوى: ${playerState.level || 1}
- النقاط/الخبرة: ${playerState.xp || 0}
- العملات: ${playerState.coins || 200}
- المخزون: ${JSON.stringify(playerState.inventory || {})}
- المباني المفتوحة: حظيرة الدجاج (${buildings.chickenCoop ? 'مفتوحة' : 'مقفلة'})، المخبز (${buildings.bakery ? 'مفتوح' : 'مقفل'})
- المرحلة الحالية: ${playerState.currentStage || playerState.stage || 1}

اقترح مهمة جانبية واحدة مناسبة وممتعة للاعب باللغة العربية. يجب أن تختار questGoal حصراً من هذه القائمة المسموحة: ${allowedGoals.join(', ')}.
يجب أن تتضمن المهمة:
1. عنوان جذاب للمهمة
2. وصف تفصيلي لطيف ومحفز
3. questGoal من القائمة المسموحة فقط
4. مكافأة العملات rewardCoins بين 30 و 150
5. مكافأة الخبرة rewardXp بين 20 و 80
6. سبب الاقتراح بناءً على حالته.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'عنوان المهمة الجانبية' },
              description: { type: Type.STRING, description: 'وصف المهمة' },
              questGoal: { type: Type.STRING, description: 'نوع الهدف التقني من القائمة المسموحة' },
              rewardCoins: { type: Type.INTEGER, description: 'مكافأة العملات (30-150)' },
              rewardXp: { type: Type.INTEGER, description: 'مكافأة الخبرة (20-80)' },
              reason: { type: Type.STRING, description: 'سبب الاقتراح' },
            },
            required: ['title', 'description', 'questGoal', 'rewardCoins', 'rewardXp', 'reason'],
          },
        },
      });

      let jsonText = (response.text || '{}').trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      let questData: any;
      try {
        questData = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error('Failed to parse JSON from Gemini:', jsonText, parseErr);
        questData = {
          title: 'مهمة مرشد المزرعة الخاصة',
          description: 'قم بحصاد 3 قطع محاصيل إضافية لزيادة أرباحك.',
          questGoal: 'harvest_3_crops',
          rewardCoins: 50,
          rewardXp: 30,
          reason: 'مقترح مباشر لزيادة حصادك.',
        };
      }

      const safeGoal = allowedGoals.includes(questData.questGoal) ? questData.questGoal : allowedGoals[0];
      const safeRewards = clampRewards(questData.rewardCoins, questData.rewardXp);

      res.json({
        fallback: false,
        title: questData.title || 'مهمة مرشد المزرعة',
        description: questData.description || 'أكمل هذه المهمة لتطوير مزرعتك.',
        questGoal: safeGoal,
        rewardCoins: safeRewards.rewardCoins,
        rewardXp: safeRewards.rewardXp,
        reason: questData.reason || 'مقترح مخصص لحالة مزرعتك.',
      });
    } catch (err: any) {
      console.error('Gemini advisor error:', err);
      res.json({
        fallback: true,
        title: 'نصيحة مرشد المزرعة المحلي',
        description: 'واصل ري وحصاد محاصيلك وبيعها في السوق لزيادة أرباحك.',
        questGoal: 'harvest_3_crops',
        rewardCoins: 40,
        rewardXp: 25,
        reason: 'تم تفعيل الوضع المحلي لضمان استمرارية المهام.',
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
