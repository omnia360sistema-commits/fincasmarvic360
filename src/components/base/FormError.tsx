import React from 'react';
import { AlertCircle } from 'lucide-react';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-red-400 animate-in fade-in slide-in-from-top-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <p className="text-[10px] font-medium leading-none">{message}</p>
    </div>
  );
}