
// pages/PrayerListPage.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PrayerItem, Comment } from '../types';
import PrayerForm from '../components/PrayerForm';
import ConfirmationModal from './ConfirmationModal';

const PrayerListPage: React.FC = () => {
    const [items, setItems] = useLocalStorage<PrayerItem[]>('prayerItems', []);
    const [editingItem, setEditingItem] = useState<PrayerItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<'all' | 'unanswered' | 'answered' | 'commented' | 'liked'>('all');
    const [expandedPrayerId, setExpandedPrayerId] = useState<string | null>(null);
    
    // State for comments
    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
    const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
    const [editingComment, setEditingComment] = useState<{ prayerId: string; commentId: string; text: string } | null>(null);
    const [commentToDelete, setCommentToDelete] = useState<{ prayerId: string, commentId: string } | null>(null);
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

    // Data migration for adding likes and comments to existing items
    useEffect(() => {
        const itemsNeedMigration = items.some(item => item.likes === undefined || item.comments === undefined);
        if (itemsNeedMigration) {
            setItems(prevItems => {
                return prevItems.map(item => ({
                    ...item,
                    likes: item.likes ?? 0,
                    liked: item.liked ?? false,
                    comments: item.comments ?? [],
                }));
            });
        }
    }, []); // Run only once

    useEffect(() => {
        if (!selectedCommentId) {
          return;
        }
    
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-comment-container]')) {
                setSelectedCommentId(null);
            }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCommentId]);

    const handleToggleExpand = (id: string) => {
        setExpandedPrayerId(prevId => (prevId === id ? null : id));
    };

    const handleToggleLike = (itemId: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const newLiked = !item.liked;
                const newLikes = newLiked ? item.likes + 1 : item.likes - 1;
                return { ...item, liked: newLiked, likes: newLikes };
            }
            return item;
        }));
    };

    const handleCommentClick = (commentId: string) => {
        setSelectedCommentId(prevId => prevId === commentId ? null : commentId);
    };

    const handleToggleCommentSection = (itemId: string) => {
        setExpandedCommentId(prevId => {
            const newId = prevId === itemId ? null : itemId;
            if (newId !== prevId) { // Reset selected comment if section changes
                setSelectedCommentId(null);
            }
            return newId;
        });
    };
    
    const handleAddComment = (e: React.FormEvent, itemId: string) => {
        e.preventDefault();
        const text = newCommentText[itemId]?.trim();
        if (!text) return;

        const newComment: Comment = {
            id: crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
        };

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, comments: [...(item.comments || []), newComment] };
            }
            return item;
        }));
        setNewCommentText(prev => ({ ...prev, [itemId]: '' }));
    };

    const handleDeleteComment = (prayerId: string, commentId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === prayerId) {
                return { ...item, comments: item.comments.filter(c => c.id !== commentId) };
            }
            return item;
        }));
    };
    
    const handleUpdateComment = () => {
        if (!editingComment) return;
        const { prayerId, commentId, text } = editingComment;
        setItems(prev => prev.map(item => {
            if (item.id === prayerId) {
                return {
                    ...item,
                    comments: item.comments.map(c => c.id === commentId ? { ...c, text } : c)
                };
            }
            return item;
        }));
        setEditingComment(null);
    };

    const filterPositions: Record<typeof filterStatus, string> = {
        all: '0%',
        unanswered: '98%',
        answered: '196%',
        commented: '294%',
        liked: '392%',
    };

    const filteredItems = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return items
            .filter(item => {
                switch (filterStatus) {
                    case 'answered': return item.answered;
                    case 'unanswered': return !item.answered;
                    case 'liked': return item.liked;
                    case 'commented': return item.comments && item.comments.length > 0;
                    case 'all':
                    default:
                        return true;
                }
            })
            .filter(item => 
                item.person.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.content.toLowerCase().includes(lowerCaseSearchTerm) ||
                (item.godsResponse && item.godsResponse.toLowerCase().includes(lowerCaseSearchTerm))
            )
            .sort((a, b) => sortOrder === 'desc' ? b.prayerDate.localeCompare(a.prayerDate) : a.prayerDate.localeCompare(b.prayerDate));
    }, [items, searchTerm, sortOrder, filterStatus]);

    const handleSave = useCallback((item: PrayerItem) => {
        setItems(prev => {
            const exists = prev.some(i => i.id === item.id);
            if (exists) return prev.map(i => i.id === item.id ? item : i);
            return [...prev, item];
        });
        setIsFormOpen(false);
        setEditingItem(null);
    }, [setItems]);

    const handleDeleteRequest = (ids: Set<string>) => {
        if (ids.size === 0) return;
        setItemsToDelete(ids);
        setShowConfirmation(true);
    };

    const handleConfirmDelete = useCallback(() => {
        if (itemsToDelete.size > 0) {
            setItems(prevItems => prevItems.filter(item => !itemsToDelete.has(item.id)));
        }
        setItemsToDelete(new Set());
        setShowConfirmation(false);
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, [itemsToDelete, setItems]);

    const handleCancelDelete = useCallback(() => {
        setItemsToDelete(new Set());
        setShowConfirmation(false);
    }, []);

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };
    
    const calculateDaysPassed = (dateStr: string) => {
        const prayerDate = new Date(dateStr);
        const today = new Date();
        prayerDate.setUTCHours(0, 0, 0, 0);
        today.setUTCHours(0, 0, 0, 0);
        const diffTime = Math.abs(today.getTime() - prayerDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const FilterButton: React.FC<{ label: string; status: typeof filterStatus; current: typeof filterStatus; onClick: (status: typeof filterStatus) => void; }> = ({ label, status, current, onClick }) => (
        <button onClick={() => onClick(status)} className={`relative z-10 w-1/5 py-1.5 text-[12px] sm:text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none ${current === status ? 'text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
    );

    return (
        <div>
            {/* Controls */}
            <div className="flex justify-between items-center mt-6 mb-6 gap-4">
                {!isSelectMode ? (
                    <>
                        <input type="text" placeholder="搜尋標題、對象或內容..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow w-full p-2 rounded-lg border bg-white" />
                        <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">{sortOrder === 'desc' ? '日期 🔽' : '日期 🔼'}</button>
                        <button onClick={() => setIsSelectMode(true)} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">多選</button>
                        <button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="px-4 py-2 bg-gold-DEFAULT text-gray-900 rounded-lg shadow-md hover:bg-gold-dark transition-colors whitespace-nowrap">新增</button>
                    </>
                ) : (
                    <div className="w-full flex justify-between items-center p-2 bg-beige-200 rounded-lg">
                        <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-3 py-2 text-sm rounded-lg bg-gray-300">取消</button>
                        <span className="font-bold text-sm">{`已選取 ${selectedIds.size} 項`}</span>
                        <button onClick={() => handleDeleteRequest(selectedIds)} disabled={selectedIds.size === 0} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white disabled:bg-red-300">刪除</button>
                    </div>
                )}
            </div>
            
            {/* Filter */}
            {!isSelectMode && (
                <div className="mb-6 flex justify-center">
                    <div className="relative w-full max-w-lg mx-auto p-1 bg-beige-200 rounded-full flex items-center">
                        <span className="absolute top-1 bottom-1 left-1 w-1/5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out" style={{ transform: `translateX(${filterPositions[filterStatus]})` }} aria-hidden="true" />
                        <FilterButton label="全部" status="all" current={filterStatus} onClick={setFilterStatus} />
                        <FilterButton label="禱告中" status="unanswered" current={filterStatus} onClick={setFilterStatus} />
                        <FilterButton label="神垂聽" status="answered" current={filterStatus} onClick={setFilterStatus} />
                        <FilterButton label="留言" status="commented" current={filterStatus} onClick={setFilterStatus} />
                        <FilterButton label="按讚" status="liked" current={filterStatus} onClick={setFilterStatus} />
                    </div>
                </div>
            )}

            {/* Prayer List */}
            <div className="space-y-4">
                {filteredItems.length === 0 ? <p className="text-center text-gray-500 py-8">{searchTerm ? '找不到禱告事項' : '沒有符合條件的禱告事項'}</p> : filteredItems.map(item => {
                    const isExpanded = expandedPrayerId === item.id;
                    const isCommentSectionExpanded = expandedCommentId === item.id;
                    return (
                        <div
                            key={item.id}
                            className={`rounded-lg shadow-sm overflow-hidden transition-all duration-300 relative ${item.answered ? 'bg-gold-light/60' : 'bg-beige-50'} ${selectedIds.has(item.id) ? 'ring-2 ring-gold-DEFAULT' : ''} ${isSelectMode ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (isSelectMode) handleToggleSelection(item.id); }}
                        >
                            {isSelectMode && (
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <input type="checkbox" className="h-5 w-5 rounded text-gold-dark focus:ring-gold-dark" checked={selectedIds.has(item.id)} readOnly />
                                </div>
                            )}
                            <div className={`${isSelectMode ? 'pl-10' : ''}`}>
                                <div
                                    className="p-4 flex items-start"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        if (isSelectMode) {
                                            e.stopPropagation();
                                            handleToggleSelection(item.id);
                                        } else {
                                            handleToggleExpand(item.id);
                                        }
                                    }}
                                    onKeyDown={e => !isSelectMode && e.key === 'Enter' && handleToggleExpand(item.id)}
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold">{item.title} <span className="text-sm font-normal text-gray-500">({item.person})</span></h3>
                                                {!isExpanded && (
                                                    <p className="mt-2 text-sm text-gray-600">{item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                {!isSelectMode && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsFormOpen(true); }} className="text-xl p-1 rounded-full hover:bg-blue-200" aria-label={`編輯禱告 ${item.title}`}>ᝰ</button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(new Set([item.id])); }} className="text-xl p-1 rounded-full hover:bg-red-200" aria-label={`刪除禱告 ${item.title}`}>✘</button>
                                                    </>
                                                )}
                                                <span className={`transform transition-transform duration-200 ${isExpanded ? '' : ''}`}></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="border-t border-gray-200 text-sm space-y-2 pt-4">
                                            <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                                            {item.godsResponse && (
                                                <div className="mt-3 pt-3 border-t border-beige-200/60">
                                                    <p className="text-sm">
                                                        <span className="block mb-4 font-semibold text-gold-dark">神的回應：</span>
                                                        <span className="whitespace-pre-wrap">{item.godsResponse}</span>
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mt-2">
                                                {item.answered
                                                    ? <span title={`應允於 ${item.answeredDate}`} className="block mt-4 text-sm font-semibold text-gold-dark">✞ 神已應允</span>
                                                    : <span title="禱告中" className="block mt-4 text-sm font-semibold text-gray-500">✞ 願神垂聽</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Bar */}
                                {!isSelectMode && (
                                    <div className="px-4 py-2 border-t border-b border-beige-200 flex items-center gap-6">
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleLike(item.id); }} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors duration-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-200 ${item.liked ? 'text-red-500' : 'text-gray-400'}`} fill={item.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                                            <span className="text-sm font-medium">{item.likes}</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(item.id); }} className="flex items-center gap-1.5 text-gray-600 hover:text-gold-dark transition-colors duration-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors duration-200 ${item.comments?.length > 0 ? 'text-gold-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                            <span className="text-sm font-medium">{item.comments?.length || 0}</span>
                                        </button>
                                    </div>
                                )}

                                 {/* Comment Section */}
                                {!isSelectMode && (
                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCommentSectionExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                                        <div className="p-4 space-y-4 bg-beige-100/50">
                                            {item.comments?.length > 0 ? item.comments.map(comment => (
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
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditingComment({ prayerId: item.id, commentId: comment.id, text: comment.text }); }} className="text-xs text-gray-500 hover:text-gray-800">ᝰ 編輯</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setCommentToDelete({ prayerId: item.id, commentId: comment.id }); }} className="text-xs text-red-500 hover:text-red-700">✘ 刪除</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )) : <p className="text-xs text-center text-gray-500">還沒有留言</p>}
                                            <form onSubmit={(e) => handleAddComment(e, item.id)} className="flex gap-2 items-center">
                                                <input type="text" placeholder="新增留言..." value={newCommentText[item.id] || ''} onChange={(e) => setNewCommentText(prev => ({ ...prev, [item.id]: e.target.value }))} className="w-full flex-grow p-2 text-sm rounded-lg border bg-white" />
                                                <button type="submit" className="px-3 py-2 text-sm bg-gold-DEFAULT text-black rounded-lg">➤</button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 py-3 px-4 border-t border-beige-200 flex justify-between">
                                    <span>禱告日: {item.prayerDate}</span>
                                    <span>已過天數: {calculateDaysPassed(item.prayerDate)} 天</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {isFormOpen && <PrayerForm item={editingItem} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            {showConfirmation && <ConfirmationModal message={`您確定要刪除這 ${itemsToDelete.size} 個禱告事項嗎？此操作無法恢復。`} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />}
            {commentToDelete && <ConfirmationModal message="您確定要刪除這則留言嗎？" onConfirm={() => { handleDeleteComment(commentToDelete.prayerId, commentToDelete.commentId); setCommentToDelete(null); }} onCancel={() => setCommentToDelete(null)} />}
        </div>
    );
};

export default PrayerListPage;