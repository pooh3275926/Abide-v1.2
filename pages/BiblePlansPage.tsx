
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BiblePlan, BiblePlanDay } from '../types';
import { BIBLE_PLANS } from '../constants/biblePlans';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

type BiblePlanProgress = Record<string, Record<number, boolean>>;

// 單一計畫卡片 (總覽頁)
const PlanCard: React.FC<{
  plan: BiblePlan;
  progress: number;
  onSelect: () => void;
}> = ({ plan, progress, onSelect }) => {
  const themeClasses: Record<string, { bg: string; accent: string; text: string }> = {
    blue: { bg: 'bg-blue-50', accent: 'bg-blue-500', text: 'text-blue-800' },
    green: { bg: 'bg-green-50', accent: 'bg-green-500', text: 'text-green-800' },
    purple: { bg: 'bg-purple-50', accent: 'bg-purple-500', text: 'text-purple-800' },
    rose: { bg: 'bg-rose-50', accent: 'bg-rose-500', text: 'text-rose-800' },
    stone: { bg: 'bg-stone-50', accent: 'bg-stone-500', text: 'text-stone-800' },
    slate: { bg: 'bg-slate-50', accent: 'bg-slate-500', text: 'text-slate-800' },
    red: { bg: 'bg-red-50', accent: 'bg-red-500', text: 'text-red-800' },
    amber: { bg: 'bg-amber-50', accent: 'bg-amber-500', text: 'text-amber-800' },
    lime: { bg: 'bg-lime-50', accent: 'bg-lime-500', text: 'text-lime-800' },
    teal: { bg: 'bg-teal-50', accent: 'bg-teal-500', text: 'text-teal-800' },
  };
  const theme = themeClasses[plan.themeColor] || themeClasses.blue;

  return (
    <button onClick={onSelect} className={`w-full text-left p-5 rounded-2xl shadow-lg transition-transform hover:scale-105 duration-300 ${theme.bg}`}>
      <div>
        <p className={`font-bold text-xl ${theme.text}`}>{plan.title}</p>
        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${theme.accent} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-right text-xs mt-1 text-gray-500">{Math.round(progress)}% 完成</p>
      </div>
    </button>
  );
};


// 主頁面
const BiblePlansPage: React.FC = () => {
  const [progress, setProgress] = useLocalStorage<BiblePlanProgress>('biblePlansProgress', {});
  const [selectedPlan, setSelectedPlan] = useState<BiblePlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<BiblePlanDay | null>(null);

  const handleToggleDay = (planId: string, day: number) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      const planProgress = { ...(newProgress[planId] || {}) };

      if (planProgress[day]) {
        delete planProgress[day];
      } else {
        planProgress[day] = true;
      }

      newProgress[planId] = planProgress;
      return newProgress;
    });
  };

  const handleCompleteDay = () => {
    if (!selectedPlan || !selectedDay) return;
    
    // Mark as complete
    setProgress(prev => {
        const newProgress = { ...prev };
        const planProgress = { ...(newProgress[selectedPlan.id] || {}) };
        planProgress[selectedDay.day] = true;
        newProgress[selectedPlan.id] = planProgress;
        return newProgress;
    });
    
    // Go back to day list
    setSelectedDay(null);
  };


  // 每日靈修內容頁面
  if (selectedPlan && selectedDay) {
    const isCompleted = !!progress[selectedPlan.id]?.[selectedDay.day];
    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => setSelectedDay(null)} className="flex items-center gap-2 mt-6 mb-4 text-[16px] font-semibold text-gray-600 hover:text-black">
                <ArrowLeftIcon className="h-4 w-4" />
                返回 {selectedPlan.title}
            </button>
            <div className="bg-beige-50 rounded-xl shadow-lg p-6">
                <div>
                    <p className="text-sm text-gray-500">第 {selectedDay.day} 天</p>
                    {/* 使用者要求 1： 將「第 X 天」與標題之間的間距調整為 mt-4 */}
                    <h2 className="text-2xl font-bold text-gold-dark mt-4">{selectedDay.title}</h2>
                </div>
                {/* 使用者要求 2： 將標題區塊與靈修引言內容之間的間距調整為 mt-2 */}
                <p className="text-gray-700 leading-relaxed italic mt-2">{selectedDay.introduction}</p>
                <div className="p-4 bg-gold-light/30 rounded-lg mt-6">
                    <p className="font-semibold mb-2">{selectedDay.scripture}</p>
                    <p className="text-gray-800 leading-loose">{selectedDay.scriptureText}</p>
                </div>
                <div className="mt-6">
                    <h3 className="font-semibold text-2xl text-gold-dark">回應禱告</h3>
                    <p className="mt-2 text-gray-700 leading-relaxed">{selectedDay.prayer}</p>
                </div>
            </div>
            {!isCompleted && (
                 <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleCompleteDay}
                        className="flex items-center gap-2 px-6 py-3 bg-beige-200 text-gold-dark font-semibold rounded-lg shadow-md hover:bg-beige-300 transition-colors"
                    >
                        <CheckCircleIcon className="h-6 w-6" />
                        完成今天
                    </button>
                </div>
            )}
        </div>
    );
  }

  // 計畫詳情頁 (每日列表)
  if (selectedPlan) {
    const completedDays = Object.keys(progress[selectedPlan.id] || {}).length;
    const progressPercentage = (completedDays / selectedPlan.duration) * 100;
  
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 mt-6 mb-4 text-[16px] font-semibold text-gray-600 hover:text-black">
          <ArrowLeftIcon className="h-4 w-4" />
          返回計畫列表
        </button>

        <div className="bg-beige-50 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gold-dark">{selectedPlan.title}</h2>
            <p className="text-gray-600 mt-2">{selectedPlan.description}</p>
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-gold-dark h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <p className="text-right text-xs mt-1 text-gray-500">{completedDays} / {selectedPlan.duration} 天 ({Math.round(progressPercentage)}%)</p>
            </div>
        </div>
        
        <div className="mt-6 space-y-3">
            {selectedPlan.days.map(dayItem => {
                const isCompleted = !!progress[selectedPlan.id]?.[dayItem.day];
                return (
                    <button 
                        key={dayItem.day} 
                        onClick={() => setSelectedDay(dayItem)}
                        className={`w-full p-4 rounded-lg transition-colors duration-300 flex items-center gap-4 text-left ${isCompleted ? 'bg-beige-200' : 'bg-beige-50 hover:bg-beige-100'}`}
                    >
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-500 text-sm">第 {dayItem.day} 天</p>
                            <p className="font-bold">{dayItem.title}</p>
                            <p className="text-sm text-gold-dark mt-1">{dayItem.scripture}</p>
                        </div>
                        {isCompleted && (
                            <CheckCircleIcon className="h-8 w-8 text-gold-dark flex-shrink-0" />
                        )}
                    </button>
                );
            })}
        </div>
      </div>
    );
  }

  // 計畫總覽頁
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 mt-4">
        <h1 className="text-2xl font-bold text-gold-dark"></h1>
        <p className="mt-6 text-[16px] text-gray-600">開始一段有目標的讀經旅程吧！</p>
      </div>
      <div className="space-y-6">
        {BIBLE_PLANS.map(plan => {
          const completedDays = Object.keys(progress[plan.id] || {}).length;
          const progressPercentage = (completedDays / plan.duration) * 100;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              progress={progressPercentage}
              onSelect={() => setSelectedPlan(plan)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BiblePlansPage;