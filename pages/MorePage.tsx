
import React from 'react';
import type { Page } from '../App';

interface MorePageProps {
  setActivePage: (page: Page) => void;
}

const MorePage: React.FC<MorePageProps> = ({ setActivePage }) => {
  const moreItems: { page: Page; label: string; icon: string; description: string }[] = [
    { page: 'tracker', label: '聖經進度', icon: '📜', description: '追蹤您的讀經旅程' },
    { page: 'biblePlans', label: '讀經計畫', icon: '🗓️', description: '跟隨主題計畫，深入神的話語' },
    { page: 'messageNotes', label: '信息筆記', icon: '✍️', description: '記錄講道、學習與心得' },
    { page: 'smallGroup', label: '小組分享', icon: '👥', description: '記錄與整理您的小組分享' },
    { page: 'jesusSaid', label: '耶穌說', icon: '💌', description: '每日領受鼓勵與盼望' },
    { page: 'settings', label: '設定', icon: '⚙️', description: '匯入與匯出您的資料' },
  ];

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-beige-50 rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-beige-200">
          {moreItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => setActivePage(item.page)}
                className="w-full flex items-center p-4 text-left hover:bg-beige-100 transition-colors duration-200 focus:outline-none focus:bg-beige-100"
                aria-label={`前往 ${item.label}`}
              >
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-beige-200 rounded-lg">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="ml-4 flex-grow">
                  <p className="font-semibold text-lg text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="ml-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MorePage;
