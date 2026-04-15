import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  ExternalLink,
  Filter,
  Briefcase,
  Zap,
  Users
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWriters, fetchTeams, updateWriterTeam } from '@/services/dataService';
import { Profile, Team } from '@/types';
import { toast } from 'sonner';

export default function Writers() {
  const [writers, setWriters] = React.useState<any[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    try {
      const [writersData, teamsData] = await Promise.all([
        fetchWriters(),
        fetchTeams()
      ]);
      setWriters(writersData);
      setTeams(teamsData);
    } catch (error: any) {
      console.error('Error loading writers:', error);
      toast.error('Failed to load writers');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleTeamChange = async (writerId: string, teamId: string) => {
    try {
      const actualTeamId = teamId === 'none' ? null : teamId;
      await updateWriterTeam(writerId, actualTeamId);
      toast.success('Team updated successfully');
      loadData();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  const filteredWriters = writers.filter(w => 
    (w.author_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (w.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const payPerTaskWriters = filteredWriters.filter(w => w.teams?.pay_structure === 'task');
  const flatFeeWriters = filteredWriters.filter(w => w.teams?.pay_structure === 'flat');
  const unassignedWriters = filteredWriters.filter(w => !w.teams);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Writers...</p>
      </div>
    );
  }

  const WriterTable = ({ data, title, description, icon: Icon }: { data: any[], title: string, description: string, icon: any }) => (
    <Card className="border shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border shadow-sm text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[250px]">Writer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Team</TableHead>
              <TableHead>Assign Team</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  No writers found in this category.
                </TableCell>
              </TableRow>
            ) : (
              data.map((writer) => (
                <TableRow key={writer.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border shadow-sm bg-transparent">
                        <AvatarFallback className="bg-transparent text-slate-900 font-bold">
                          {writer.author_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{writer.author_name || 'Anonymous'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{writer.email}</TableCell>
                  <TableCell>
                    {writer.teams ? (
                      <Badge variant="secondary" className="font-normal">
                        {writer.teams.name}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={writer.team_id || 'none'}
                      onValueChange={(value) => handleTeamChange(writer.id, value)}
                    >
                      <SelectTrigger className="w-[160px] h-9 text-xs">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/writers/${writer.id}`} className="flex items-center cursor-pointer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Writers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your team of contributors and assignments.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search writers..."
              className="pl-10 h-10 rounded-lg bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 border rounded-lg mb-6">
          <TabsTrigger value="all" className="text-xs px-6">All ({filteredWriters.length})</TabsTrigger>
          <TabsTrigger value="task" className="text-xs px-6">Pay Per Task ({payPerTaskWriters.length})</TabsTrigger>
          <TabsTrigger value="flat" className="text-xs px-6">Flat Fee ({flatFeeWriters.length})</TabsTrigger>
          <TabsTrigger value="unassigned" className="text-xs px-6">Unassigned ({unassignedWriters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <WriterTable 
            data={filteredWriters} 
            title="Global Directory" 
            description="Complete list of all contributors in the system"
            icon={Users}
          />
        </TabsContent>
        <TabsContent value="task" className="m-0">
          <WriterTable 
            data={payPerTaskWriters} 
            title="Task-Based Writers" 
            description="Writers paid per individual story submission"
            icon={Zap}
          />
        </TabsContent>
        <TabsContent value="flat" className="m-0">
          <WriterTable 
            data={flatFeeWriters} 
            title="Flat Fee Writers" 
            description="Writers on fixed monthly retainer structures"
            icon={Briefcase}
          />
        </TabsContent>
        <TabsContent value="unassigned" className="m-0">
          <WriterTable 
            data={unassignedWriters} 
            title="Unassigned Talent" 
            description="Contributors awaiting team placement"
            icon={UserPlus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
