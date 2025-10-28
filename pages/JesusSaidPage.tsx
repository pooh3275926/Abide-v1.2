import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { JesusSaidCard } from '../types';
import { JESUS_SAID_DATA } from '../constants/constants';
import ConfirmationModal from './ConfirmationModal';

// Reusable component to display a single card's content
const CardDisplay: React.FC<{ card: JesusSaidCard }> = ({ card }) => (
  <div className="bg-beige-50 rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
    <div className="border-b-2 border-gold-light pb-3 mb-3">
      <h3 className="text-sm font-semibold text-gray-500">今日經文</h3>
      <p className="text-lg italic text-gold-dark">"{card.verse}"</p>
    </div>
    {card.message && (
      <div className="border-b-2 border-gold-light pb-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-500">耶穌對你說</h3>
        <p className="text-md whitespace-pre-wrap leading-relaxed">{card.message}</p>
      </div>
    )}
    {card.prayer && (
      <div>
        <h3 className="text-sm font-semibold text-gray-500">回應禱告</h3>
        <p className="text-md whitespace-pre-wrap leading-relaxed">{card.prayer}</p>
      </div>
    )}
  </div>
);

// Component for the small card preview in the collection grid
const CardPreview: React.FC<{ 
    card: JesusSaidCard, 
    onClick: () => void,
    onDelete: () => void,
    isSelectMode: boolean,
    isSelected: boolean,
    onToggleSelect: () => void
}> = ({ card, onClick, onDelete, isSelectMode, isSelected, onToggleSelect }) => (
    <div className="relative">
        <button
          onClick={isSelectMode ? onToggleSelect : onClick}
          className={`bg-beige-50 rounded-lg shadow-md p-4 w-full aspect-[3/4] flex flex-col justify-center items-center text-center hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT ${isSelected ? 'ring-2 ring-gold-dark' : ''}`}
          aria-label={`查看卡片: ${card.verse}`}
        >
          <p className="text-sm italic text-gold-dark line-clamp-5 overflow-hidden text-ellipsis break-words leading-snug">
  "{card.verse.split('—')[1] ? card.verse.split('—')[1].trim() : card.verse}"</p>
          <p className="text-xs text-gray-500 mt-2">{card.verse.match(/^(.*?)\s*—/)?.[1]}</p>
        </button>
        {!isSelectMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="absolute top-1 right-1 text-lg text-yellow-900 bg-white/50 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200 transition-colors"
              aria-label="刪除卡片"
            >
              &times;
            </button>
        )}
        {isSelectMode && (
            <div className="absolute top-2 left-2 pointer-events-none">
                <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    tabIndex={-1}
                    className="h-5 w-5 rounded text-gold-dark focus:ring-gold-dark"
                />
            </div>
        )}
    </div>
);


const JesusSaidPage: React.FC = () => {
    const [gracePoints, setGracePoints] = useLocalStorage<number>('gracePoints', 0);
    const [collectedCards, setCollectedCards] = useLocalStorage<JesusSaidCard[]>('jesusSaidCards', []);
    const [currentCard, setCurrentCard] = useState<JesusSaidCard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCard, setSelectedCard] = useState<JesusSaidCard | null>(null);

    // 刪除與多選狀態
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleDrawCard = () => {
        if (gracePoints < 3) {
            setError('恩典值不足！');
            return;
        }

        // 找出尚未收集的卡
        const collectedVerses = new Set(collectedCards.map(c => c.verse));
        const uncollectedCardsData = JESUS_SAID_DATA.filter(data => !collectedVerses.has(data.verse));

        if (uncollectedCardsData.length === 0) {
            setError('🎉 恭喜你！已經全數收集完所有福音卡片！');
            return;
        }

        setIsLoading(true);
        setCurrentCard(null);
        setError('');

        setTimeout(() => {
            // 從未收集的卡中隨機抽一張
            const randomCardData = uncollectedCardsData[Math.floor(Math.random() * uncollectedCardsData.length)];
            const newCard: JesusSaidCard = {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                verse: randomCardData.verse,
                message: randomCardData.message,
                prayer: randomCardData.prayer,
            };
            setCurrentCard(newCard);
            setGracePoints(prev => prev - 3);
            setIsLoading(false);
        }, 500); // 模擬載入時間
    };

    const handleCollectCard = () => {
        if (currentCard) {
            setCollectedCards(prev => [...prev, currentCard].sort((a,b) => b.date.localeCompare(a.date)));
            setCurrentCard(null);
        }
    };
    
    // 刪除邏輯
    const handleDeleteRequest = (ids: Set<string>) => {
        if (ids.size === 0) return;
        setItemsToDelete(ids);
        setShowConfirmation(true);
    };

    const handleConfirmDelete = () => {
        if (itemsToDelete.size > 0) {
            setCollectedCards(prev => prev.filter(card => !itemsToDelete.has(card.id)));
        }
        setItemsToDelete(new Set());
        setShowConfirmation(false);
        setIsSelectMode(false);
        setSelectedIds(new Set());
    };
    
    // 多選邏輯
    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const filteredCards = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return collectedCards;
        return collectedCards.filter(card =>
            card.verse.toLowerCase().includes(lowerSearch) ||
            card.message.toLowerCase().includes(lowerSearch) ||
            card.prayer.toLowerCase().includes(lowerSearch)
        );
    }, [collectedCards, searchTerm]);


    return (
        <div className="container mx-auto max-w-2xl text-center p-4">
            <div className="bg-beige-200 p-4 rounded-lg shadow-md mt-4 mb-6">
                <p className="text-2xl font-bold text-gold-dark">💧 {gracePoints} 點恩典值</p>
                <p className="text-xs text-gray-600 mt-2">
                    每完成一章靈修日記可獲得 1 點。
                </p>
            </div>

            <div className="mb-8 p-4 bg-beige-50/50 rounded-lg">
                <h2 className="font-bold mb-2">說明</h2>
                <p className="text-sm text-gray-700">
                    每張卡片皆來自聖經經文，是「神今日的提醒與安慰」。
                </p>
            </div>

            {/* --- 抽卡區 --- */}
            <div className="mb-12">
                {currentCard ? (
                    <div className="relative">
                        <CardDisplay card={currentCard} />
                        <div className="text-center mt-4">
                            <button
                              onClick={handleCollectCard}
                              className="px-6 py-2 bg-gold-DEFAULT text-black rounded-lg shadow-md hover:bg-gold-dark transition-colors"
                            >
                              ✨ 收藏卡片
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {gracePoints < 3 ? (
                            <div className="p-6 bg-gold-light/50 rounded-lg text-center">
                                <p className="font-semibold">您的恩典值不足 3 點。</p>
                                <p className="mt-2 text-sm">耶穌說：你要多讀經哦！</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleDrawCard}
                                disabled={isLoading}
                                className="px-8 py-4 bg-gold-DEFAULT text-black rounded-lg shadow-xl hover:bg-gold-dark transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        抽卡中...
                                    </>
                                ) : (
                                    '抽取卡片 (消耗 3 點)'
                                )}
                            </button>
                        )}
                    </>
                )}
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>

            {/* --- 收藏夾 --- */}
            <div>
                <h3 className="text-xl font-bold text-gold-dark mb-4 text-center">💌 福音卡冊</h3>
                 {/* 控制列 */}
                <div className="flex justify-between items-center mb-6 gap-2">
                {!isSelectMode ? (
                  <>
                    <input
                      type="text"
                      placeholder="搜尋經文、書卷或內容..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white"
                    />
                    <button onClick={() => setIsSelectMode(true)} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">
                      多選
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-between items-center p-2 bg-beige-200 rounded-lg">
                    <button 
                      onClick={() => {
                        setIsSelectMode(false)
                        setSelectedIds(new Set());
                      }} 
                      className="px-3 py-2 text-sm rounded-lg bg-gray-300"
                    >
                      取消
                    </button>
                    <span className="font-bold text-sm">{`已選取 ${selectedIds.size} 項`}</span>
                    <button onClick={() => handleDeleteRequest(selectedIds)} disabled={selectedIds.size === 0} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white disabled:bg-red-300">
                      刪除
                    </button>
                  </div>
                )}
                </div>

                {filteredCards.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredCards.map(card => (
                            <CardPreview 
                                key={card.id} 
                                card={card} 
                                onClick={() => setSelectedCard(card)} 
                                onDelete={() => handleDeleteRequest(new Set([card.id]))}
                                isSelectMode={isSelectMode}
                                isSelected={selectedIds.has(card.id)}
                                onToggleSelect={() => handleToggleSelection(card.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        {searchTerm ? '找不到符合的卡片。' : '您還沒有收藏任何卡片。'}
                    </p>
                )}
            </div>

            {/* --- 全螢幕卡片顯示 --- */}
            {selectedCard && (
              <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4" onClick={() => setSelectedCard(null)}>
                <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                   <CardDisplay card={selectedCard} />
                   <button
                     onClick={() => setSelectedCard(null)}
                     className="absolute top-2 left-2 text-2xl font-bold text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/80 transition-colors"
                     aria-label="返回"
                   >
                     &times;
                   </button>
                </div>
              </div>
            )}
            
            {/* --- 刪除確認 Modal --- */}
            {showConfirmation && (
                <ConfirmationModal
                    message={`您確定要刪除這 ${itemsToDelete.size} 張卡片嗎？此操作無法恢復。`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}
        </div>
    );
};

export default JesusSaidPage;