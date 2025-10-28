import React, { useState } from 'react';
import { MessageNote } from '../types';

const MessageNoteForm: React.FC<{
  note: MessageNote | null;
  onSave: (note: MessageNote) => void;
  onCancel: () => void;
}> = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MessageNote>(
    note || {
      id: crypto.randomUUID(),
      title: '',
      speaker: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      tags: [],
    }
  );
  const [tagInput, setTagInput] = useState(note?.tags.join(', ') || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleSave = () => {
    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({ ...formData, tags });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex justify-center items-center p-4">
      <div className="bg-beige-50 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{note ? '編輯' : '新增'}筆記</h2>
        <div className="space-y-4">
          <input type="text" name="title" placeholder="標題" value={formData.title} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="speaker" placeholder="講員" value={formData.speaker} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
          </div>
          <textarea name="content" placeholder="筆記內容..." value={formData.content} onChange={handleChange} rows={8} className="w-full p-2 rounded border bg-white" />
          <input type="text" name="tags" placeholder="標籤 (以逗號分隔)" value={tagInput} onChange={handleTagChange} className="w-full p-2 rounded border bg-white" />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-300">取消</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-gold-DEFAULT text-black">儲存</button>
        </div>
      </div>
    </div>
  );
};

export default MessageNoteForm;
