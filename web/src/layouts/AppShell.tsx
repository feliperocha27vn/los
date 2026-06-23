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
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans select-none overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* SIDEBAR: Layout Responsivo (Slim no Tablet md, Cheia no Desktop lg) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between bg-card border-r border-border p-5 shrink-0 transition-all duration-300 w-16 lg:w-60">
        
        <div className="space-y-8">
          {/* Logo do App */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 rounded-lg bg-primary/10 items-center justify-center text-primary shrink-0">
              <Command className="h-5 w-5" />
            </div>
            <span className="hidden lg:inline text-sm font-bold tracking-tight font-mono">
              Life OS
            </span>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-1.5">
            {/* Dashboard */}
            <Link 
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth ${
                activeTab === 'dashboard' 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover font-semibold'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>

            {/* Finanças (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-semibold cursor-not-allowed transition-smooth">
              <Wallet className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Finanças</span>
            </div>

            {/* Organização (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-semibold cursor-not-allowed transition-smooth">
              <ClipboardList className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Organização</span>
            </div>

            {/* Agenda (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-semibold cursor-not-allowed transition-smooth">
              <Calendar className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Agenda</span>
            </div>

            {/* Cofre */}
            <Link 
              to="/cofre"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth ${
                activeTab === 'cofre' 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover font-semibold'
              }`}
            >
              <Key className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Cofre</span>
            </Link>

            {/* Configurações (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-semibold cursor-not-allowed transition-smooth">
              <Settings className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden lg:inline">Configurações</span>
            </div>
          </nav>
        </div>

        {/* Perfil & Logout */}
        <div className="flex items-center justify-between gap-3 px-2 py-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 uppercase">
              {auth.user.name.charAt(0)}
            </div>
            <div className="hidden lg:block min-w-0 leading-none">
              <span className="block text-sm font-bold text-foreground truncate font-mono">{auth.user.name}</span>
              <span className="block text-xs font-semibold text-muted-foreground truncate font-mono mt-1">{auth.user.email}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-smooth cursor-pointer"
            title="Sair da conta"
          >
            <LogOut className="h-4.5 w-4.5" />
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
      {/* MOBILE BOTTOM NAVIGATION */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 z-50">
        
        <Link 
          to="/"
          className={`flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono font-bold">Dashboard</span>
        </Link>

        <div className="flex flex-col items-center gap-1 text-muted-foreground/45 cursor-not-allowed">
          <Wallet className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono">Finanças</span>
        </div>

        <div className="flex flex-col items-center gap-1 text-muted-foreground/45 cursor-not-allowed">
          <ClipboardList className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono">Tarefas</span>
        </div>

        <div className="flex flex-col items-center gap-1 text-muted-foreground/45 cursor-not-allowed">
          <Calendar className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono">Agenda</span>
        </div>

        <Link 
          to="/cofre"
          className={`flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'cofre' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono font-bold">Cofre</span>
        </Link>

        <div 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-5.5 w-5.5" />
          <span className="text-[10px] font-mono font-semibold">Sair</span>
        </div>

      </div>

    </div>
  );
}
