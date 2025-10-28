
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MessageNote } from '../types';
import MessageNoteForm from '../components/MessageNoteForm';
import ConfirmationModal from './ConfirmationModal';

const MessageNotesPage: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<MessageNote[]>('messageNotes', []);
  const [editingNote, setEditingNote] = useState<MessageNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Controls state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // UI state
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagsSet.add(tag)));
    return ['all', ...Array.from(tagsSet).sort()];
  }, [notes]);

  const sortedNotes = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return [...notes]
      .filter(note => {
        if (selectedTag !== 'all' && !note.tags.includes(selectedTag)) return false;
        if (!searchTerm) return true;
        return (
          note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          note.speaker.toLowerCase().includes(lowerCaseSearchTerm) ||
          note.content.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
      .sort((a, b) => sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [notes, searchTerm, sortOrder, selectedTag]);

  const handleSave = (note: MessageNote) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === note.id);
      if (idx > -1) {
        const newNotes = [...prev];
        newNotes[idx] = note;
        return newNotes;
      }
      return [note, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleDeleteRequest = (ids: Set<string>) => {
    if (ids.size === 0) return;
    setItemsToDelete(ids);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = () => {
    setNotes(prev => prev.filter(n => !itemsToDelete.has(n.id)));
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

  const handleToggleExpand = (id: string) => setExpandedNoteId(prev => prev === id ? null : id);

  return (
    <div>
      {/* Top Controls */}
      <div className="flex justify-between items-center mt-6 mb-6 gap-4">
        {!isSelectMode ? (
          <>
            <input type="text" placeholder="搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow w-full p-2 rounded-lg border bg-white" />
            <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">{sortOrder === 'desc' ? '日期 🔽' : '日期 🔼'}</button>
            <button onClick={() => setIsSelectMode(true)} className="p-2 rounded-lg bg-beige-200 whitespace-nowrap text-sm">多選</button>
            <button onClick={() => { setEditingNote(null); setIsFormOpen(true); }} className="px-6 py-2 bg-gold-DEFAULT text-black rounded-lg shadow-md hover:bg-gold-dark transition-colors whitespace-nowrap">新增</button>
          </>
        ) : (
          <div className="w-full flex justify-between items-center p-2 bg-beige-200 rounded-lg">
            <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-3 py-2 text-sm rounded-lg bg-gray-300">取消</button>
            <span className="font-bold text-sm">{`已選取 ${selectedIds.size} 項`}</span>
            <button onClick={() => handleDeleteRequest(selectedIds)} disabled={selectedIds.size === 0} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white disabled:bg-red-300">刪除</button>
          </div>
        )}
      </div>

      {/* Tag Filters */}
      {!isSelectMode && allTags.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedTag === tag
                  ? 'bg-gold-dark text-white'
                  : 'bg-beige-200 hover:bg-beige-300'
              }`}
            >
              {tag === 'all' ? '全部' : tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {sortedNotes.length > 0 ? sortedNotes.map(note => {
          const isExpanded = expandedNoteId === note.id;
          return (
            <div key={note.id} className={`bg-beige-50 rounded-lg shadow-sm overflow-hidden transition-all duration-300 relative ${selectedIds.has(note.id) ? 'ring-2 ring-gold-DEFAULT' : ''} ${isSelectMode ? 'cursor-pointer' : ''}`} onClick={() => isSelectMode && handleToggleSelection(note.id)}>
              {isSelectMode && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <input type="checkbox" className="h-5 w-5 rounded text-gold-dark focus:ring-gold-dark" checked={selectedIds.has(note.id)} readOnly />
              </div>}
              <div className={`${isSelectMode ? 'pl-10' : ''}`}>
                <div className="p-4 cursor-pointer" role="button" tabIndex={0} onClick={() => !isSelectMode && handleToggleExpand(note.id)} onKeyDown={e => !isSelectMode && e.key === 'Enter' && handleToggleExpand(note.id)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{note.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{note.speaker} • {note.date}</p>
                      {!isExpanded && <p className="mt-2 text-sm italic line-clamp-2">"{note.content}"</p>}
                    </div>
                    {!isSelectMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <button onClick={(e) => { e.stopPropagation(); setEditingNote(note); setIsFormOpen(true); }} className="text-xl p-1 rounded-full hover:bg-blue-200" aria-label={`編輯筆記 ${note.title}`}>ᝰ</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(new Set([note.id])); }} className="text-xl p-1 rounded-full hover:bg-red-200" aria-label={`刪除筆記 ${note.title}`}>✘</button>
                        </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-beige-200">
                    <p className="whitespace-pre-wrap mt-4">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-gold-light rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }) : <p className="text-gray-500 text-center mt-10">尚無任何筆記，點擊新增開始記錄吧！</p>}
      </div>

      {isFormOpen && <MessageNoteForm note={editingNote} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingNote(null); }} />}
      {showConfirmation && <ConfirmationModal message={`確定要刪除 ${itemsToDelete.size} 筆筆記嗎？`} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirmation(false)} />}
    </div>
  );
};

export default MessageNotesPage;