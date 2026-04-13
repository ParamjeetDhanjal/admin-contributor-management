import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  LogOut, 
  Menu, 
  X,
  Bell,
  ChevronRight,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email || null);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Management', path: '/management', icon: Settings2 },
    { name: 'History', path: '/tasks', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r bg-white shadow-sm",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className={cn("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0 invisible")}>
                <span className="text-lg font-bold tracking-tight">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                    isActive 
                      ? "bg-slate-100 text-slate-900 font-medium" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className={cn(
                    "text-sm transition-all duration-300",
                    isSidebarOpen ? "opacity-100" : "opacity-0 invisible absolute left-16"
                  )}>
                    {item.name}
                  </span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Section */}
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-3 py-2",
                !isSidebarOpen && "justify-center px-0"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className={cn("text-sm", !isSidebarOpen && "hidden")}>
                Sign Out
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isSidebarOpen ? "pl-64" : "pl-20"
        )}
      >
        {/* Top Header */}
        <header className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg hover:bg-slate-100"
            >
              {isSidebarOpen ? <X className="h-5 w-5 text-slate-500" /> : <Menu className="h-5 w-5 text-slate-500" />}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <Avatar className="h-7 w-7 border shadow-sm shrink-0">
                <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">
                  {userEmail?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                  {userEmail || 'Administrator'}
                </span>
                <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest">System Access</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
