import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'success' | 'warning' | 'info';
}

export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Подтвердить', 
  cancelText = 'Отмена', 
  onConfirm, 
  onCancel,
  variant = 'warning'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const bgStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 sm:p-8 relative shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          {variant === 'danger' && <AlertTriangle className="w-6 h-6 text-red-500" />}
          {variant === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
          {variant === 'success' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
          {variant === 'info' && <Info className="w-6 h-6 text-blue-500" />}
          <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl transition duration-150 text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
            }}
            className={`flex-1 text-white font-bold px-4 py-3 rounded-xl transition duration-150 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${bgStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
