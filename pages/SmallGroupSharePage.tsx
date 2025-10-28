import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SmallGroupShare } from '../types';
import SmallGroupShareForm from '../components/SmallGroupShareForm';
import ConfirmationModal from './ConfirmationModal';

const SmallGroupSharePage: React.FC = () => {
  const [shares, setShares] = useLocalStorage<SmallGroupShare[]>('smallGroupShares', []);
  const [editingShare, setEditingShare] = useState<SmallGroupShare | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // UI
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Multi-select
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());

  const sortedShares = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return [...shares]
      .filter(share => 
        !lowerCaseSearch ||
        share.groupName.toLowerCase().includes(lowerCaseSearch) ||
        share.book.toLowerCase().includes(lowerCaseSearch) ||
        share.topic.toLowerCase().includes(lowerCaseSearch) ||
        share.myShare.toLowerCase().includes(lowerCaseSearch)
      )
      .sort((a, b) => sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [shares, searchTerm, sortOrder]);

  const handleSave = (share: SmallGroupShare) => {
    setShares(prev => {
      const exists = prev.some(s => s.id === share.id);
      if (exists) {
        return prev.map(s => s.id === share.id ? share : s);
      }
      return [share, ...prev];
    });
    setIsFormOpen(false);
    setEditingShare(null);
  };

  const handleDeleteRequest = (ids: Set<string>) => {
    if (ids.size === 0) return;
    setItemsToDelete(ids);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = () => {
    setShares(prev => prev.filter(s => !itemsToDelete.has(s.id)));
    setItemsToDelete(new Set());
    setShowConfirmation(false);
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };
  
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div>
      {/* Top Controls */}
      <div className="flex justify-between items-center mt-6 mb-6 gap-4">
        {!isSelectMode ? (
          <>
            <input type="text" placeholder="搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow w-full p-2 rounded-lg border bg-white" />
            <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">{sortOrder === 'desc' ? '日期 🔽' : '日期 🔼'}</button>
            <button onClick={() => setIsSelectMode(true)} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">多選</button>
            <button onClick={() => { setEditingShare(null); setIsFormOpen(true); }} className="px-6 py-2 bg-gold-DEFAULT text-black rounded-lg shadow-md hover:bg-gold-dark transition-colors whitespace-nowrap">新增</button>
          </>
        ) : (
          <div className="w-full flex justify-between items-center p-2 bg-beige-200 rounded-lg">
            <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-3 py-2 text-sm rounded-lg bg-gray-300">取消</button>
            <span className="font-bold text-sm">{`已選取 ${selectedIds.size} 項`}</span>
            <button onClick={() => handleDeleteRequest(selectedIds)} disabled={selectedIds.size === 0} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white disabled:bg-red-300">刪除</button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {sortedShares.length > 0 ? sortedShares.map(share => {
          const isExpanded = expandedId === share.id;
          const scripture = `${share.book} ${share.chapter}${share.verse ? `:${share.verse}`: ''}`;
          return (
            <div 
              key={share.id} 
              className={`bg-beige-50 rounded-lg shadow-sm overflow-hidden transition-all duration-300 relative ${selectedIds.has(share.id) ? 'ring-2 ring-gold-DEFAULT' : ''} ${isSelectMode ? 'cursor-pointer' : ''}`} 
              onClick={() => isSelectMode && handleToggleSelection(share.id)}
            >
              {isSelectMode && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <input type="checkbox" className="h-5 w-5 rounded text-gold-dark focus:ring-gold-dark" checked={selectedIds.has(share.id)} readOnly />
              </div>}
              <div className={`${isSelectMode ? 'pl-10' : ''}`}>
                <div 
                  className="p-4 cursor-pointer"
                  role="button" 
                  tabIndex={0} 
                  onClick={() => !isSelectMode && setExpandedId(isExpanded ? null : share.id)}
                  onKeyDown={e => !isSelectMode && e.key === 'Enter' && setExpandedId(isExpanded ? null : share.id)}
                >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">{share.groupName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{scripture} • {share.date}</p>
                        {!isExpanded && <p className="mt-2 text-sm italic line-clamp-2">題目：{share.topic}</p>}
                      </div>
                      {!isSelectMode && (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <button onClick={(e) => { e.stopPropagation(); setEditingShare(share); setIsFormOpen(true); }} className="text-xl p-1 rounded-full hover:bg-blue-200" aria-label={`編輯 ${share.groupName} 分享`}>ᝰ</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(new Set([share.id])); }} className="text-xl p-1 rounded-full hover:bg-red-200" aria-label={`刪除 ${share.groupName} 分享`}>✘</button>
                          </div>
                      )}
                    </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-beige-200 space-y-4">
                    <div className="mt-4">
                        <h4 className="mb-2 font-semibold text-gold-dark">討論題目</h4>
                        <p className="whitespace-pre-wrap mt-1 text-sm">{share.topic}</p>
                    </div>
                     <div>
                        <h4 className="mb-2 font-semibold text-gold-dark">我的分享</h4>
                        <p className="whitespace-pre-wrap mt-1 text-sm">{share.myShare}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }) : <p className="text-gray-500 text-center mt-10">尚無任何分享，點擊新增開始記錄吧！</p>}
      </div>

      {isFormOpen && <SmallGroupShareForm share={editingShare} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingShare(null); }} />}
      {showConfirmation && <ConfirmationModal message={`確定要刪除 ${itemsToDelete.size} 筆分享嗎？`} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirmation(false)} />}
    </div>
  );
};

export default SmallGroupSharePage;
