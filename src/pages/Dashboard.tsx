import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { 
  Users, 
  FileText, 
  IndianRupee,
  Activity,
  ArrowUpRight,
  Target,
  Layers,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Video,
  Share2,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  fetchTeams, 
  fetchStories, 
  fetchWriters, 
  fetchSystemSettings,
  subscribeToStories,
  subscribeToWriters
} from '@/services/dataService';
import { Team, Story, Profile } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachMonthOfInterval, startOfYear, endOfYear, addMonths } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

type ViewType = 'Overall' | 'WebDesk Overall' | 'WebDesk Writers' | 'WebDesk Columnist' | 'Video' | 'Social';

export default function Dashboard() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [stories, setStories] = React.useState<Story[]>([]);
  const [writers, setWriters] = React.useState<Profile[]>([]);
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<ViewType>('Overall');

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, storiesData, writersData, settingsData] = await Promise.all([
          fetchTeams(),
          fetchStories(),
          fetchWriters(),
          fetchSystemSettings()
        ]);
        setTeams(teamsData.filter(t => t.name !== 'Graphics'));
        setStories(storiesData);
        setWriters(writersData);
        setSettings(settingsData);
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    // Set up real-time subscriptions
    const storySub = subscribeToStories(() => {
      loadData(); // Refresh all data on any story change
    });

    const writerSub = subscribeToWriters(() => {
      loadData(); // Refresh all data on any writer change
    });

    return () => {
      storySub.unsubscribe();
      writerSub.unsubscribe();
    };
  }, []);

  // Yearly Data
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  
  const yearlyStories = (stories || []).filter(s => {
    if (s.is_deleted) return false;
    if (!s.created_at) return false;
    const date = parseISO(s.created_at);
    return isWithinInterval(date, { start: yearStart, end: yearEnd });
  });

  const calculateSpend = (profileList: Profile[], storyList: Story[]) => {
    const flatFees = profileList
      .filter(w => w.pay_structure === 'flat')
      .reduce((acc, w) => acc + (w.pricing || 0), 0);
    
    const taskSpend = storyList
      .filter(s => {
        const w = profileList.find(wr => wr.id === s.user_id);
        return w?.pay_structure === 'task';
      })
      .reduce((acc, s) => {
        const w = profileList.find(wr => wr.id === s.user_id);
        return acc + (s.amount || w?.pricing || 0);
      }, 0);

    return flatFees + taskSpend;
  };

  const totalYearlySpend = calculateSpend(writers, yearlyStories);

  const teamSpending = [
    { name: 'Social', filter: (w: Profile) => teams.find(t => t.id === w.team_id)?.name === 'Social' },
    { name: 'Video', filter: (w: Profile) => teams.find(t => t.id === w.team_id)?.name === 'Video' },
    { name: 'Webdesk Writers', filter: (w: Profile) => teams.find(t => t.id === w.team_id)?.name === 'Webdesk' && w.webdesk_category === 'Desk Writer' },
    { name: 'Webdesk Contributors', filter: (w: Profile) => teams.find(t => t.id === w.team_id)?.name === 'Webdesk' && w.webdesk_category === 'Columnist' },
  ].map(category => {
    const categoryWriters = writers.filter(category.filter);
    const categoryStories = yearlyStories.filter(s => categoryWriters.some(w => w.id === s.user_id));
    
    const flatFees = categoryWriters
      .filter(w => w.pay_structure === 'flat')
      .reduce((acc, w) => acc + (w.pricing || 0), 0);
    
    const taskSpend = categoryStories
      .filter(s => {
        const w = categoryWriters.find(wr => wr.id === s.user_id);
        return w?.pay_structure === 'task';
      })
      .reduce((acc, s) => {
        const w = categoryWriters.find(wr => wr.id === s.user_id);
        return acc + (s.amount || w?.pricing || 0);
      }, 0);

    return {
      name: category.name,
      spend: flatFees + taskSpend
    };
  });
  // Full year view (Jan to Dec)
  const months = eachMonthOfInterval({
    start: yearStart,
    end: yearEnd
  });

  const monthlyData = months.map(month => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const mStories = (stories || []).filter(s => !s.is_deleted && s.created_at && isWithinInterval(parseISO(s.created_at), { start: mStart, end: mEnd }));
    
    // Filter by active view
    let viewWriters = writers;
    
    if (activeView === 'WebDesk Overall') {
      const team = teams.find(t => (t.name?.toLowerCase() || '') === 'webdesk');
      viewWriters = writers.filter(w => w?.team_id === team?.id);
    } else if (activeView === 'WebDesk Columnist') {
      const team = teams.find(t => (t.name?.toLowerCase() || '') === 'webdesk');
      viewWriters = writers.filter(w => w?.team_id === team?.id && w?.webdesk_category === 'Columnist');
    } else if (activeView === 'WebDesk Writers') {
      const team = teams.find(t => (t.name?.toLowerCase() || '') === 'webdesk');
      viewWriters = writers.filter(w => w?.team_id === team?.id && w?.webdesk_category === 'Desk Writer');
    } else if (activeView === 'Video') {
      const team = teams.find(t => (t.name?.toLowerCase() || '') === 'video');
      viewWriters = writers.filter(w => w?.team_id === team?.id);
    } else if (activeView === 'Social') {
      const team = teams.find(t => (t.name?.toLowerCase() || '') === 'social');
      viewWriters = writers.filter(w => w?.team_id === team?.id);
    }

    const viewStories = mStories.filter(s => viewWriters.some(w => w?.id === s.user_id));

    return {
      month: format(month, 'MMM'),
      spend: calculateSpend(viewWriters, viewStories),
      tasks: viewStories.length
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Analyzing Metrics...</p>
      </div>
    );
  }

  const ViewButton = ({ type, icon: Icon }: { type: ViewType, icon: any }) => (
    <Button 
      variant={activeView === type ? 'default' : 'outline'} 
      className={cn(
        "gap-2 rounded-xl h-10 px-4 transition-all duration-200",
        activeView === type ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-50"
      )}
      onClick={() => setActiveView(type)}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
    </Button>
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">CONTRIBUTORS</h1>
          <p className="text-slate-500 text-sm font-mono uppercase tracking-[0.2em] mt-1">Financial Integrity & Performance Audit</p>
        </div>
      </div>

      {/* Annual Team Spending Overview */}
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">ANNUAL TEAM SPENDING</CardTitle>
              <CardDescription className="font-mono text-[10px] uppercase tracking-widest">Fiscal Year {currentYear} Breakdown</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-slate-900">₹{totalYearlySpend.toLocaleString()}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Total Annual Spend</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {teamSpending.map((team) => (
              <div key={team.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{team.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        {((team.spend / (totalYearlySpend || 1)) * 100).toFixed(1)}% of Total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">₹{team.spend.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (team.spend / (totalYearlySpend || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Options */}
      <div className="flex flex-wrap gap-3 p-2 bg-slate-100/50 rounded-2xl border border-dashed">
        <ViewButton type="Overall" icon={LayoutDashboard} />
        <ViewButton type="WebDesk Overall" icon={Globe} />
        <ViewButton type="WebDesk Writers" icon={Users} />
        <ViewButton type="WebDesk Columnist" icon={Activity} />
        <ViewButton type="Video" icon={Video} />
        <ViewButton type="Social" icon={Share2} />
      </div>

      {/* Monthly Spend Chart */}
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">{activeView} - MONTHLY SPEND</CardTitle>
              <CardDescription className="font-mono text-[10px] uppercase tracking-widest">Financial Burn Rate Analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[300px] w-full overflow-x-auto">
            <div className="min-w-[600px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Spend']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="spend" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number of Tasks Chart */}
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">{activeView} - TASKS</CardTitle>
              <CardDescription className="font-mono text-[10px] uppercase tracking-widest">Operational Output Metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[300px] w-full overflow-x-auto">
            <div className="min-w-[600px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(val: number) => [val, 'Tasks']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="tasks" fill="#64748b" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
