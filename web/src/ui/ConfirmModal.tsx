import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
      {/* Container do Modal */}
      <div className="w-full max-w-[400px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Conteúdo */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className={`flex h-12 w-12 rounded-full items-center justify-center ${
            isDestructive ? 'bg-[#f43f5e]/10 text-[#f43f5e]' : 'bg-[#6366f1]/10 text-[#6366f1]'
          }`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#fafafa] font-sans">
              {title}
            </h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 p-4 border-t border-[#27272a] bg-[#09090b]">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-10 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-sans text-sm"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 font-bold rounded-md transition-smooth font-sans text-sm text-white ${
              isDestructive 
                ? 'bg-[#f43f5e] hover:bg-[#f43f5e]/90' 
                : 'bg-[#6366f1] hover:bg-[#6366f1]/90'
            }`}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
