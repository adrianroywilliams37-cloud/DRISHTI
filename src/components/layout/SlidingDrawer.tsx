import React from 'react';
import { X } from 'lucide-react';

interface SlidingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function SlidingDrawer({ isOpen, onClose, title, children, width = 'md:w-[480px]' }: SlidingDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full bg-paper w-full ${width} shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/15">
          <h2 className="text-lg font-serif font-bold text-ink">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-ink/5 rounded-full transition-colors border-none bg-transparent cursor-pointer text-ink-70 hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
