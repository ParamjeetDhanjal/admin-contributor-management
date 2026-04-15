import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  IndianRupee, 
  TrendingUp,
  Award,
  Zap,
  Clock,
  Mail,
  ExternalLink,
  Target
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { fetchWriterProfile, fetchWriterStories } from '@/services/dataService';
import { Story } from '@/types';
import { format, parseISO, eachDayOfInterval, subDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';

export default function WriterProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = React.useState<any>(null);
  const [stories, setStories] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [profileData, storiesData] = await Promise.all([
          fetchWriterProfile(id),
          fetchWriterStories(id)
        ]);
        setProfile(profileData);
        setStories(storiesData);
      } catch (error: any) {
        console.error('Error loading writer profile:', error);
        toast.error('Failed to load writer profile');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Analytics Calculations
  const totalEarned = stories.reduce((acc, story) => {
    if (profile?.pay_structure === 'task') {
      return acc + (story.amount || profile.pricing || 0);
    } else if (profile?.pay_structure === 'flat') {
      // For flat fee, we might just show the base pay once, 
      // but usually total earned implies sum of work.
      // If it's truly flat, we just return the pricing.
      return profile.pricing || 0;
    }
    return acc;
  }, 0);

  // Submission frequency (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const submissionData = last30Days.map(day => {
    const count = stories.filter(s => isSameDay(parseISO(s.created_at), day)).length;
    return {
      date: format(day, 'MMM dd'),
      count
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Award className="h-12 w-12 text-slate-200" />
        <p className="text-slate-500 font-medium">Writer Not Found</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/writers">Return to Directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-slate-500">
          <Link to="/writers">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Link>
        </Button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b">
        <Avatar className="h-24 w-24 border-2 border-white shadow-md">
          <AvatarImage src={`https://avatar.vercel.sh/${profile.email}`} />
          <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-600">
            {profile.author_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{profile.author_name || 'Anonymous'}</h1>
            {profile.teams && (
              <Badge variant="secondary" className="font-medium">
                {profile.teams.name}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {profile.email}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Joined {profile.created_at ? format(parseISO(profile.created_at), 'MMM yyyy') : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stories.length}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹{totalEarned.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weekly Avg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {(stories.length / 4).toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">94%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Submission Activity</CardTitle>
            <CardDescription>Performance over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0f172a" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Submissions</CardTitle>
            <CardDescription>Latest work from this contributor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {stories.slice(0, 5).map((story) => (
                <div key={story.id} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50 group hover:bg-white transition-colors">
                  <div className="p-2 rounded-md bg-white border shadow-sm">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900">{story.headline}</p>
                    <p className="text-xs text-slate-500">{format(parseISO(story.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </div>
              ))}
              {stories.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No submissions recorded
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
