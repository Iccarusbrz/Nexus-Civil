import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CheckSquare, 
  Calendar, 
  Calculator, 
  Package, 
  FileText, 
  BookOpen,
  Menu,
  X,
  LogOut,
  HardHat,
  Construction
} from 'lucide-react';
import { Button } from './ui/button';
import { SidebarItem } from './SidebarItem';
import { useAuth } from '../AuthContext';
import { Badge } from './ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, profile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'engineer', 'manager', 'client'] },
    { id: 'projects', label: 'Projetos', icon: <Building2 size={20} />, roles: ['admin', 'engineer', 'manager', 'client'] },
    { id: 'diary', label: 'Diário de Obra', icon: <BookOpen size={20} />, roles: ['admin', 'engineer', 'manager'] },
    { id: 'lean', label: 'Canteiro Lean', icon: <CheckSquare size={20} />, roles: ['admin', 'engineer', 'manager'] },
    { id: 'gantt', label: 'Cronograma', icon: <Calendar size={20} />, roles: ['admin', 'engineer', 'manager', 'client'] },
    { id: 'bdi', label: 'Calculadora BDI', icon: <Calculator size={20} />, roles: ['admin', 'manager', 'engineer'] },
    { id: 'materials', label: 'Materiais', icon: <Package size={20} />, roles: ['admin', 'manager', 'engineer'] },
    { id: 'memorial', label: 'Memorial Descritivo', icon: <FileText size={20} />, roles: ['admin', 'manager', 'engineer'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !profile || item.roles.includes(profile.role)
  );

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3">
          <Construction className="text-orange-500 w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Nexus Civil</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={activeTab === item.id} 
              onClick={() => handleTabChange(item.id)} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
              ) : (
                <HardHat size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                {profile && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 uppercase">
                    {profile.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 pl-16 lg:px-8 sticky top-0 z-10 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 capitalize truncate">
            {menuItems.find(i => i.id === activeTab)?.label || 'Nexus Civil'}
          </h2>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:flex border-orange-200 text-orange-700 bg-orange-50">
              Versão 2.0 Pro
            </Badge>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
