import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@core/utils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[2px] animate-fade-in">
      {/* Container do Modal */}
      <div className="w-full max-w-[400px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Conteúdo */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "flex h-12 w-12 rounded-full items-center justify-center",
            isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}>
            <AlertCircle className="h-6 w-6" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-foreground font-sans">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 p-4 border-t border-border bg-background">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-10 font-bold border border-border bg-transparent text-foreground hover:bg-secondary rounded-md transition-smooth font-sans text-sm"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 h-10 font-bold rounded-md transition-smooth font-sans text-sm text-white",
              isDestructive 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
