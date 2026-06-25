import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@core/auth-provider';
import { 
  Command, 
  LayoutDashboard, 
  Wallet, 
  ClipboardList, 
  Calendar, 
  Key, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'cofre' | 'financas' | 'organizacao' | 'agenda' | 'configuracoes';
}

export function AppShell({ children, activeTab }: AppShellProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate({ to: '/' });
    } catch (err) {
      // ignore
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#09090b] text-[#fafafa] font-sans select-none overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* SIDEBAR: Layout Responsivo (Slim no Tablet md, Cheia no Desktop lg) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between bg-[#18181b] border-r border-[#27272a] p-6 shrink-0 transition-all duration-300 w-20 lg:w-[260px]">
        
        <div className="space-y-8">
          {/* Logo do App */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center text-[#6366f1] shrink-0">
              <Command className="h-6 w-6" />
            </div>
            <span className="hidden lg:inline text-lg font-semibold tracking-tight font-mono text-[#fafafa]">
              Life OS
            </span>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-2">
            {/* Dashboard */}
            <Link 
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth ${
                activeTab === 'dashboard' 
                  ? 'bg-[#27272a] text-[#fafafa] font-medium' 
                  : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]/50 font-normal'
              }`}
            >
              <LayoutDashboard className={`h-[18px] w-[18px] shrink-0 transition-smooth ${activeTab === 'dashboard' ? 'text-[#6366f1]' : 'text-[#a1a1aa]'}`} />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>

            {/* Finanças (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a1a1aa]/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Wallet className="h-[18px] w-[18px] shrink-0 text-[#a1a1aa]/40" />
              <span className="hidden lg:inline">Finanças</span>
            </div>

            {/* Organização */}
            <Link 
              to="/organizacao/notas"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth ${
                activeTab === 'organizacao' 
                  ? 'bg-[#27272a] text-[#fafafa] font-medium' 
                  : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]/50 font-normal'
              }`}
            >
              <ClipboardList className={`h-[18px] w-[18px] shrink-0 transition-smooth ${activeTab === 'organizacao' ? 'text-[#6366f1]' : 'text-[#a1a1aa]'}`} />
              <span className="hidden lg:inline">Organização</span>
            </Link>

            {/* Agenda (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a1a1aa]/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Calendar className="h-[18px] w-[18px] shrink-0 text-[#a1a1aa]/40" />
              <span className="hidden lg:inline">Agenda</span>
            </div>

            {/* Cofre */}
            <Link 
              to="/cofre"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth ${
                activeTab === 'cofre' 
                  ? 'bg-[#27272a] text-[#fafafa] font-medium' 
                  : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]/50 font-normal'
              }`}
            >
              <Key className={`h-[18px] w-[18px] shrink-0 transition-smooth ${activeTab === 'cofre' ? 'text-[#6366f1]' : 'text-[#a1a1aa]'}`} />
              <span className="hidden lg:inline">Cofre</span>
            </Link>

            {/* Configurações (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a1a1aa]/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Settings className="h-[18px] w-[18px] shrink-0 text-[#a1a1aa]/40" />
              <span className="hidden lg:inline">Configurações</span>
            </div>
          </nav>
        </div>

        {/* Perfil & Logout */}
        <div className="flex items-center justify-between gap-3 py-3 border-t border-[#27272a] mt-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#27272a] border border-[#27272a] flex items-center justify-center text-xs font-bold text-[#fafafa] shrink-0 uppercase">
              {auth.user.name.charAt(0)}
            </div>
            <div className="hidden lg:block min-w-0 leading-none">
              <span className="block text-[13px] font-medium text-[#fafafa] truncate font-mono">{auth.user.name}</span>
              <span className="block text-[11px] font-normal text-[#a1a1aa] truncate font-mono mt-1">{auth.user.email}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-[#27272a] text-[#f43f5e] hover:text-[#ef4444] transition-smooth cursor-pointer shrink-0"
            title="Sair da conta"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* CONTENT WRAPPER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        {children}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION (Card Flutuante Fiel ao Design) */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-14 bg-[#18181b] border border-[#27272a] flex items-center justify-around px-2 z-50 rounded-full shadow-lg shadow-black/40">
        
        {/* Dashboard */}
        <Link 
          to="/"
          className={`flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth ${
            activeTab === 'dashboard' ? 'bg-[#27272a] text-[#6366f1]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
        </Link>

        {/* Finanças (Inativo) */}
        <div className="flex items-center justify-center h-10 w-10 rounded-full text-[#a1a1aa]/30 cursor-not-allowed">
          <Wallet className="h-5 w-5" />
        </div>

        {/* Organização */}
        <Link 
          to="/organizacao/notas"
          className={`flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth ${
            activeTab === 'organizacao' ? 'bg-[#27272a] text-[#6366f1]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <ClipboardList className="h-5 w-5" />
        </Link>

        {/* Agenda (Inativo) */}
        <div className="flex items-center justify-center h-10 w-10 rounded-full text-[#a1a1aa]/30 cursor-not-allowed">
          <Calendar className="h-5 w-5" />
        </div>

        {/* Cofre */}
        <Link 
          to="/cofre"
          className={`flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth ${
            activeTab === 'cofre' ? 'bg-[#27272a] text-[#6366f1]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <Key className="h-5 w-5" />
        </Link>

      </div>

    </div>
  );
}
