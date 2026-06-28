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
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@core/utils';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'cofre' | 'financas' | 'organizacao' | 'agenda' | 'configuracoes';
}

export function AppShell({ children, activeTab }: AppShellProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('lifeos-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('lifeos-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans select-none overflow-x-hidden transition-colors duration-250">
      
      {/* Floating Theme Toggle on Mobile */}
      <button
        onClick={toggleTheme}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-full bg-card border border-border text-foreground hover:bg-secondary transition-smooth cursor-pointer shadow-lg shadow-black/20 focus-visible:ring-2 focus-visible:ring-primary outline-none"
        aria-label={theme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* ========================================================================= */}
      {/* SIDEBAR: Layout Responsivo (Slim no Tablet md, Cheia no Desktop lg) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between bg-card border-r border-border p-6 shrink-0 transition-all duration-300 w-20 lg:w-[260px]">
        
        <div className="space-y-8">
          {/* Logo do App */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center text-[#6366f1] shrink-0">
              <Command className="h-6 w-6" />
            </div>
            <span className="hidden lg:inline text-lg font-semibold tracking-tight font-mono text-foreground">
              Life OS
            </span>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-2">
            {/* Dashboard */}
            <Link 
              to="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth",
                activeTab === 'dashboard' 
                  ? 'bg-secondary text-secondary-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50 font-normal'
              )}
            >
              <LayoutDashboard className={cn("h-[18px] w-[18px] shrink-0 transition-smooth", activeTab === 'dashboard' ? 'text-[#6366f1]' : 'text-muted-foreground')} />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>

            {/* Finanças (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Wallet className="h-[18px] w-[18px] shrink-0 text-muted-foreground/40" />
              <span className="hidden lg:inline">Finanças</span>
            </div>

            {/* Organização */}
            <Link 
              to="/organizacao/notas"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth",
                activeTab === 'organizacao' 
                  ? 'bg-secondary text-secondary-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50 font-normal'
              )}
            >
              <ClipboardList className={cn("h-[18px] w-[18px] shrink-0 transition-smooth", activeTab === 'organizacao' ? 'text-[#6366f1]' : 'text-muted-foreground')} />
              <span className="hidden lg:inline">Organização</span>
            </Link>

            {/* Agenda (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground/40" />
              <span className="hidden lg:inline">Agenda</span>
            </div>

            {/* Cofre */}
            <Link 
              to="/cofre"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm cursor-pointer transition-smooth",
                activeTab === 'cofre' 
                  ? 'bg-secondary text-secondary-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50 font-normal'
              )}
            >
              <Key className={cn("h-[18px] w-[18px] shrink-0 transition-smooth", activeTab === 'cofre' ? 'text-[#6366f1]' : 'text-muted-foreground')} />
              <span className="hidden lg:inline">Cofre</span>
            </Link>

            {/* Configurações (Inativo) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/45 font-mono text-sm font-normal cursor-not-allowed transition-smooth">
              <Settings className="h-[18px] w-[18px] shrink-0 text-muted-foreground/40" />
              <span className="hidden lg:inline">Configurações</span>
            </div>
          </nav>
        </div>

        {/* Perfil & Logout / Tema */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 uppercase">
              {auth.user.name.charAt(0)}
            </div>
            <div className="hidden lg:block min-w-0 leading-none">
              <span className="block text-[13px] font-medium text-foreground truncate font-mono">{auth.user.name}</span>
              <span className="block text-[11px] font-normal text-muted-foreground truncate font-mono mt-1">{auth.user.email}</span>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-1 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth cursor-pointer focus-visible:ring-2 focus-visible:ring-primary outline-none"
              title={theme === 'dark' ? "Mudar para tema claro" : "Mudar para tema escuro"}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-secondary text-rose-500 hover:text-rose-600 transition-smooth cursor-pointer focus-visible:ring-2 focus-visible:ring-primary outline-none"
              title="Sair da conta"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
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
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-14 bg-card border border-border flex items-center justify-around px-2 z-50 rounded-full shadow-lg shadow-black/10">
        
        {/* Dashboard */}
        <Link 
          to="/"
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth",
            activeTab === 'dashboard' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
        </Link>

        {/* Finanças (Inativo) */}
        <div className="flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground/30 cursor-not-allowed">
          <Wallet className="h-5 w-5" />
        </div>

        {/* Organização */}
        <Link 
          to="/organizacao/notas"
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth",
            activeTab === 'organizacao' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ClipboardList className="h-5 w-5" />
        </Link>

        {/* Agenda (Inativo) */}
        <div className="flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground/30 cursor-not-allowed">
          <Calendar className="h-5 w-5" />
        </div>

        {/* Cofre */}
        <Link 
          to="/cofre"
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-smooth",
            activeTab === 'cofre' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Key className="h-5 w-5" />
        </Link>

      </div>

    </div>
  );
}
