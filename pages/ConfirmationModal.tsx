import React from 'react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <div className="bg-beige-50 p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 id="confirmation-title" className="text-lg font-semibold mb-4 text-gray-800">{message}</h2>
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={onCancel} 
            className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label="Cancel deletion"
          >
            取消
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            aria-label="Confirm deletion"
          >
            確認刪除
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
