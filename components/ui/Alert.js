'use client';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export default function Alert({ type = 'info', title, message, onClose, className = '' }) {
  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
    },
  };
  
  const config = types[type];
  
  return (
    <div className={`${config.bg} border-l-4 p-4 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-bold ${config.titleColor}`}>{title}</h3>}
          {message && <p className={`text-sm mt-1 ${config.messageColor}`}>{message}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-3 flex-shrink-0">
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
