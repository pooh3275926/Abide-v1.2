import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { JournalEntry, Comment } from '../types';
import { BIBLE_BOOKS } from '../constants/constants';
import ConfirmationModal from './ConfirmationModal';

type BibleTrackerProgress = Record<string, Record<number, boolean>>;

const JournalForm: React.FC<{
  entry: JournalEntry | null;
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
}> = ({ entry, onSave, onCancel }) => {
  const [formData, setFormData] = useState<JournalEntry>(
    entry || {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      book: BIBLE_BOOKS[0].name,
      chapter: 1,
      verse: '',
      highlights: '',
      godMessage: '',
      completed: false,
      likes: 0,
      liked: false,
      comments: [],
    }
  );

  const selectedBook = BIBLE_BOOKS.find(b => b.name === formData.book);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: target.value }));
    }
    if (name === 'book') {
      setFormData(prev => ({ ...prev, chapter: 1 }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex justify-center items-center p-4">
      <div className="bg-beige-50 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{entry ? '編輯' : '新增'}日記</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 rounded border bg-white" />
            <select name="book" value={formData.book} onChange={handleChange} className="p-2 rounded border bg-white">
              {BIBLE_BOOKS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <select name="chapter" value={formData.chapter} onChange={handleChange} className="p-2 rounded border bg-white">
              {selectedBook && Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" name="verse" placeholder="輸入經節 (例如 1-5 或 3,7,9)" value={formData.verse || ''} onChange={handleChange} className="p-2 rounded border bg-white" />
          </div>

          <textarea name="highlights" placeholder="靈修亮光" value={formData.highlights} onChange={handleChange} rows={3} className="w-full p-2 rounded border bg-white" />
          <textarea name="godMessage" placeholder="神想告訴我什麼？" value={formData.godMessage} onChange={handleChange} rows={3} className="w-full p-2 rounded border bg-white" />

          <div className="flex items-center">
            <input type="checkbox" id="completed" name="completed" checked={formData.completed} onChange={handleChange} className="h-4 w-4 rounded" />
            <label htmlFor="completed" className="ml-2">是否完成本章全部內容</label>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-300">取消</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 rounded bg-gold-DEFAULT text-black">儲存</button>
        </div>
      </div>
    </div>
  );
};

type FilterStatus = 'all' | 'commented' | 'liked' | 'pendingMeditation';

const JournalPage: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('journalEntries', []);
  const [, setTrackerProgress] = useLocalStorage<BibleTrackerProgress>('bibleTrackerProgress', {});
  const [, setGracePoints] = useLocalStorage<number>('gracePoints', 0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedBookFilter, setSelectedBookFilter] = useState('all');
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<{ entryId: string; commentId: string; text: string } | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ entryId: string, commentId: string } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Data migration
  useEffect(() => {
    const itemsNeedMigration = entries.some(entry => entry.likes === undefined || (entry as any).scriptureAnalysis !== undefined);
    if (itemsNeedMigration) {
      setEntries(prevEntries => {
        return prevEntries.map(entry => {
          const { scriptureAnalysis, applicationHelper, prayer, ...rest } = entry as any;
          return {
            ...rest,
            likes: entry.likes ?? 0,
            liked: entry.liked ?? false,
            comments: entry.comments ?? [],
          };
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedCommentId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-comment-container]')) setSelectedCommentId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCommentId]);

  const handleToggleLike = (entryId: string) => {
    setEntries(prev => prev.map(entry => entry.id === entryId ? { ...entry, liked: !entry.liked, likes: entry.liked ? entry.likes - 1 : entry.likes + 1 } : entry));
  };

  const handleCommentClick = (commentId: string) => setSelectedCommentId(prevId => prevId === commentId ? null : commentId);

  const handleToggleCommentSection = (entryId: string) => {
    setExpandedCommentId(prevId => {
      const newId = prevId === entryId ? null : entryId;
      if (newId !== prevId) setSelectedCommentId(null);
      return newId;
    });
  };

  const handleAddComment = (e: React.FormEvent, entryId: string) => {
    e.preventDefault();
    const text = newCommentText[entryId]?.trim();
    if (!text) return;
    const newComment: Comment = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
    setEntries(prev => prev.map(entry => entry.id === entryId ? { ...entry, comments: [...(entry.comments || []), newComment] } : entry));
    setNewCommentText(prev => ({ ...prev, [entryId]: '' }));
  };

  const handleDeleteComment = (entryId: string, commentId: string) => {
    setEntries(prev => prev.map(entry => entry.id === entryId ? { ...entry, comments: entry.comments.filter(c => c.id !== commentId) } : entry));
  };

  const handleUpdateComment = () => {
    if (!editingComment) return;
    const { entryId, commentId, text } = editingComment;
    // FIX: Corrected a typo where the map function's else condition for the ternary operator was returning `c` instead of `entry`. `c` is defined in the inner map's scope and is not accessible here.
    setEntries(prev => prev.map(entry => entry.id === entryId ? { ...entry, comments: entry.comments.map(c => c.id === commentId ? { ...c, text } : c) } : entry));
    setEditingComment(null);
  };

  const sortedEntries = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return [...entries]
      .filter(entry => {
        if (selectedBookFilter !== 'all' && entry.book !== selectedBookFilter) return false;
        switch (filterStatus) {
          case 'liked': return entry.liked;
          case 'commented': return entry.comments?.length > 0;
          case 'pendingMeditation': return !entry.highlights?.trim();
          default: return true;
        }
      })
      .filter(entry => !lowerCaseSearchTerm || entry.book.toLowerCase().includes(lowerCaseSearchTerm) || String(entry.chapter).includes(lowerCaseSearchTerm) || entry.highlights.toLowerCase().includes(lowerCaseSearchTerm))
      .sort((a, b) => sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [entries, searchTerm, sortOrder, filterStatus, selectedBookFilter]);

  const handleSave = (entry: JournalEntry) => {
    const oldEntry = entries.find(e => e.id === entry.id);
    const wasCompleted = oldEntry?.completed ?? false;
    if (entry.completed && !wasCompleted) setGracePoints(prev => prev + 1);

    const title = `${entry.book} ${entry.chapter}${entry.verse ? `:${entry.verse}` : ''}`;
    const entryWithTitle = { ...entry, title };

    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx > -1) {
        const newEntries = [...prev];
        newEntries[idx] = entryWithTitle;
        return newEntries;
      }
      return [...prev, entryWithTitle];
    });

    setTrackerProgress(prev => {
      const bookProgress = { ...(prev[entry.book] || {}) };
      if (entry.completed) bookProgress[entry.chapter] = true;
      else delete bookProgress[entry.chapter];
      if (Object.keys(bookProgress).length > 0) return { ...prev, [entry.book]: bookProgress };
      else {
        const newProgress = { ...prev };
        delete newProgress[entry.book];
        return newProgress;
      }
    });

    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteRequest = (ids: Set<string>) => {
    if (ids.size === 0) return;
    setItemsToDelete(ids);
    setShowConfirmation(true);
  };

  const handleCancelDelete = () => {
    setItemsToDelete(new Set());
    setShowConfirmation(false);
  };

  const handleConfirmDelete = () => {
    if (itemsToDelete.size === 0) return;

    const entriesToDelete = entries.filter(e => itemsToDelete.has(e.id));
    const completedEntriesToDelete = entriesToDelete.filter(e => e.completed);

    if (completedEntriesToDelete.length > 0) {
      setTrackerProgress(current => {
        const newProgress = JSON.parse(JSON.stringify(current));
        completedEntriesToDelete.forEach(entry => {
          if (newProgress[entry.book]) {
            delete newProgress[entry.book][entry.chapter];
            if (!Object.keys(newProgress[entry.book]).length) delete newProgress[entry.book];
          }
        });
        return newProgress;
      });
    }

    setEntries(prev => prev.filter(e => !itemsToDelete.has(e.id)));
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

  const handleToggleExpand = (id: string) => setExpandedEntryId(prev => prev === id ? null : id);

  const filterPositions: Record<FilterStatus, string> = { all: '0%', commented: '97%', liked: '194%', pendingMeditation: '290%' };
  const FilterButton: React.FC<{ label: string; status: FilterStatus }> = ({ label, status }) => (
    <button onClick={() => setFilterStatus(status)} className={`relative z-10 w-1/4 py-1.5 text-[12px] sm:text-base font-semibold rounded-full transition-colors duration-300 focus:outline-none ${filterStatus === status ? 'text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
  );

  return (
    <div>
      {/* 上方搜尋、排序、多選、新增 */}
      <div className="flex justify-between items-center mt-6 mb-6 gap-4">
        {!isSelectMode ? (
          <>
            <input type="text" placeholder="搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow w-full p-2 rounded-lg border bg-white" />
            <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">{sortOrder === 'desc' ? '日期 🔽' : '日期 🔼'}</button>
            <button onClick={() => setIsSelectMode(true)} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">多選</button>
            <button onClick={() => { setEditingEntry(null); setIsFormOpen(true); }} className="px-6 py-2 bg-gold-DEFAULT text-black rounded-lg shadow-md hover:bg-gold-dark transition-colors whitespace-nowrap">新增</button>
          </>
        ) : (
          <div className="w-full flex justify-between items-center p-2 bg-beige-200 rounded-lg">
            <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-3 py-2 text-sm rounded-lg bg-gray-300">取消</button>
            <span className="font-bold text-sm">{`已選取 ${selectedIds.size} 項`}</span>
            <button onClick={() => handleDeleteRequest(selectedIds)} disabled={selectedIds.size === 0} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white disabled:bg-red-300">刪除</button>
          </div>
        )}
      </div>

      {/* 篩選區 */}
      {!isSelectMode && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative w-full max-w-xl p-1 bg-beige-200 rounded-full flex items-center">
            <span className="absolute top-1 bottom-1 left-1 w-1/4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out" style={{ transform: `translateX(${filterPositions[filterStatus]})` }} aria-hidden="true" />
            <FilterButton label="全部" status="all" />
            <FilterButton label="留言" status="commented" />
            <FilterButton label="按讚" status="liked" />
            <FilterButton label="無亮光" status="pendingMeditation" />
          </div>
          <select value={selectedBookFilter} onChange={e => setSelectedBookFilter(e.target.value)} className="p-2 text-xs sm:text-sm rounded-full border bg-white focus:ring-gold-DEFAULT focus:border-gold-DEFAULT">
            <option value="all">所有書卷</option>
            {BIBLE_BOOKS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </div>
      )}

      {/* 日記列表 */}
      <div className="space-y-4">
        {sortedEntries.length > 0 ? sortedEntries.map(entry => {
          const isExpanded = expandedEntryId === entry.id;
          const isCommentSectionExpanded = expandedCommentId === entry.id;
          return (
            <div key={entry.id} className={`bg-beige-50 rounded-lg shadow-sm overflow-hidden transition-all duration-300 relative ${selectedIds.has(entry.id) ? 'ring-2 ring-gold-DEFAULT' : ''} ${isSelectMode ? 'cursor-pointer' : ''}`} onClick={() => isSelectMode && handleToggleSelection(entry.id)}>
              {isSelectMode && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <input type="checkbox" className="h-5 w-5 rounded text-gold-dark focus:ring-gold-dark" checked={selectedIds.has(entry.id)} readOnly />
              </div>}
              <div className={`${isSelectMode ? 'pl-10' : ''}`}>
                {/* Header */}
                <div className="p-4 flex items-center gap-4" role="button" tabIndex={0} onClick={(e) => { if (!isSelectMode) handleToggleExpand(entry.id); }} onKeyDown={e => !isSelectMode && e.key === 'Enter' && handleToggleExpand(entry.id)} aria-expanded={isExpanded}>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">{entry.date}</p>
                        <h3 className="mt-1 text-lg font-bold">{entry.title}</h3>
                        {!isExpanded && <p className="mt-2 text-sm italic">"{entry.highlights.substring(0, 100)}{entry.highlights.length > 100 ? '...' : ''}"</p>}
                      </div>
                      {!isSelectMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {entry.completed && <span title="已完成" className="text-xl">✓</span>}
                          <button onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setIsFormOpen(true); }} className="text-xl p-1 rounded-full hover:bg-blue-200" aria-label={`編輯日記 ${entry.book} ${entry.chapter}`}>ᝰ</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(new Set([entry.id])); }} className="text-xl p-1 rounded-full hover:bg-red-200" aria-label={`刪除日記 ${entry.book} ${entry.chapter}`}>✘</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 日記內容 */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-gray-200 text-sm space-y-4">
                    <p><strong></strong> <span className="whitespace-pre-wrap">{entry.highlights}</span></p>
                    <p><strong className="block mt-4 mb-4 font-semibold text-gold-dark">神想告訴我:</strong> <span className="whitespace-pre-wrap">{entry.godMessage}</span></p>
                  </div>
                )}

                {/* 喜歡 & 留言 */}
                {!isSelectMode && (
                  <>
                    <div className="px-4 py-2 border-t border-b border-beige-200 flex items-center gap-6">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleLike(entry.id); }} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-200 ${entry.liked ? 'text-red-500' : 'text-gray-400'}`} fill={entry.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                        <span className="text-sm font-medium">{entry.likes}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(entry.id); }} className="flex items-center gap-1.5 text-gray-600 hover:text-gold-dark transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors duration-200 ${entry.comments?.length > 0 ? 'text-gold-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <span className="text-sm font-medium">{entry.comments?.length || 0}</span>
                      </button>
                    </div>

                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCommentSectionExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="p-4 space-y-4 bg-beige-100/50">
                        {entry.comments?.length > 0 ? entry.comments.map(comment => (
                          <div key={comment.id} className="text-sm" data-comment-container>
                            {editingComment?.commentId === comment.id ? (
                              <div>
                                <textarea value={editingComment.text} onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })} className="w-full p-2 text-sm rounded border bg-white" rows={2}/>
                                <div className="flex gap-2 mt-1">
                                  <button onClick={handleUpdateComment} className="text-xs px-2 py-1 bg-green-200 rounded">儲存</button>
                                  <button onClick={() => setEditingComment(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">取消</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start cursor-pointer" onClick={() => handleCommentClick(comment.id)}>
                                <p className="whitespace-pre-wrap flex-grow pr-2">{comment.text}</p>
                                {selectedCommentId === comment.id && (
                                  <div className="flex-shrink-0 flex items-center gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingComment({ entryId: entry.id, commentId: comment.id, text: comment.text }); }} className="text-xs text-gray-500 hover:text-gray-800">ᝰ 編輯</button>
                                    <button onClick={(e) => { e.stopPropagation(); setCommentToDelete({ entryId: entry.id, commentId: comment.id }); }} className="text-xs text-red-500 hover:text-red-700">✘ 刪除</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )) : <p className="text-xs text-center text-gray-500">還沒有留言</p>}
                        <form onSubmit={(e) => handleAddComment(e, entry.id)} className="flex gap-2 items-center">
                          <input type="text" placeholder="新增留言..." value={newCommentText[entry.id] || ''} onChange={(e) => setNewCommentText(prev => ({ ...prev, [entry.id]: e.target.value }))} className="w-full flex-grow p-2 text-sm rounded-lg border bg-white" />
                          <button type="submit" className="px-3 py-2 text-sm bg-gold-DEFAULT text-black rounded-lg">➤</button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        }) : <p className="text-gray-500 text-center mt-10">尚無任何日記，點擊新增開始記錄吧！</p>}
      </div>

      {/* Form / Modal */}
      {isFormOpen && <JournalForm entry={editingEntry} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }} />}
      {showConfirmation && <ConfirmationModal message={`確定要刪除 ${itemsToDelete.size} 筆日記嗎？`} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />}
      {commentToDelete && <ConfirmationModal message="您確定要刪除這則留言嗎？" onConfirm={() => { handleDeleteComment(commentToDelete.entryId, commentToDelete.commentId); setCommentToDelete(null); }} onCancel={() => setCommentToDelete(null)} />}
    </div>
  );
};

export default JournalPage;
