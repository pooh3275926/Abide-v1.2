// components/PrayerForm.tsx
import React, { useState } from 'react';
import { PrayerItem } from '../types'; // 引入類型

const PrayerForm: React.FC<{
  item: PrayerItem | null;
  onSave: (item: PrayerItem) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<PrayerItem>(
    item || {
      id: crypto.randomUUID(),
      title: '',
      person: '',
      content: '',
      prayerDate: new Date().toISOString().split('T')[0],
      answered: false,
      godsResponse: '',
      likes: 0,
      liked: false,
      comments: [],
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const checked = target.checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'answered'
          ? { answeredDate: checked ? new Date().toISOString().split('T')[0] : undefined }
          : {}),
      }));
    } else {
      const value = target.value;
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex justify-center items-center p-4">
      <div className="bg-beige-50 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{item ? '編輯' : '新增'}禱告</h2>
        <div className="space-y-4">
          <input type="text" name="title" placeholder="標題" value={formData.title} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
          <input type="text" name="person" placeholder="禱告對象" value={formData.person} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
          <textarea name="content" placeholder="內容" value={formData.content} onChange={handleChange} rows={4} className="w-full p-2 rounded border bg-white" />
          <textarea name="godsResponse" placeholder="神怎麼說？" value={formData.godsResponse || ''} onChange={handleChange} rows={3} className="w-full p-2 rounded border bg-white" />
          <input type="date" name="prayerDate" value={formData.prayerDate} onChange={handleChange} className="w-full p-2 rounded border bg-white" />
          <div className="flex items-center">
            <input type="checkbox" id="answered" name="answered" checked={formData.answered} onChange={handleChange} className="h-4 w-4 rounded" />
            <label htmlFor="answered" className="ml-2">是否應允</label>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-300">取消</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 rounded bg-gold-DEFAULT text-gray-900">儲存</button>
        </div>
      </div>
    </div>
  );
};

export default PrayerForm;
