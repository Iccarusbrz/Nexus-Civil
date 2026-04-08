import React from 'react';
import { Button } from './ui/button';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <Button 
      variant="ghost" 
      className={`w-full justify-start gap-3 h-11 px-3 rounded-lg transition-all ${
        active 
          ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-900/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Button>
  );
}
