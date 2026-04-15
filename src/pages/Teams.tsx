import React from 'react';
import { 
  Plus, 
  Users, 
  Settings, 
  Briefcase, 
  Zap,
  IndianRupee,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchTeams, createTeam } from '@/services/dataService';
import { Team } from '@/types';
import { toast } from 'sonner';

export default function Teams() {
  const [teams, setTeams] = React.useState<(Team & { memberCount: number })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newTeam, setNewTeam] = React.useState({
    name: '',
    pay_structure: 'task' as 'task' | 'flat',
    pay_amount: 0
  });

  const loadData = async () => {
    try {
      const data = await fetchTeams();
      setTeams((data || []).filter(t => 
        ['webdesk', 'social', 'video'].includes(t.name?.toLowerCase() || '')
      ));
    } catch (error: any) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name) {
      toast.error('Team name is required');
      return;
    }
    try {
      await createTeam(newTeam);
      toast.success('Team created successfully');
      setIsCreateOpen(false);
      setNewTeam({ name: '', pay_structure: 'task', pay_amount: 0 });
      loadData();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teams</h1>
          <p className="text-slate-500 text-sm mt-1">Organize writers and define compensation structures.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-lg bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Create New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Define a new team unit and its pay logic.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Content Strategy"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structure">Compensation Model</Label>
                <Select
                  value={newTeam.pay_structure}
                  onValueChange={(value: any) => setNewTeam({ ...newTeam, pay_structure: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Pay Per Task</SelectItem>
                    <SelectItem value="flat">Flat Monthly Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {newTeam.pay_structure === 'task' ? 'Amount Per Story (INR)' : 'Monthly Flat Fee (INR)'}
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    className="pl-10"
                    value={newTeam.pay_amount}
                    onChange={(e) => setNewTeam({ ...newTeam, pay_amount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTeam} className="w-full bg-slate-900 hover:bg-slate-800">
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="border shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg border",
                    team.pay_structure === 'flat' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    {team.pay_structure === 'flat' ? <Briefcase className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{team.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {team.pay_structure === 'flat' ? 'Fixed Retainer' : 'Performance Based'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-500 font-medium tracking-wider mb-1">Structure</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {team.pay_structure === 'flat' ? 'Flat Fee' : 'Per Task'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-500 font-medium tracking-wider mb-1">Rate</p>
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{team.pay_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Active Members</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{team.memberCount}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      team.pay_structure === 'flat' ? "bg-blue-500" : "bg-emerald-500"
                    )} 
                    style={{ width: `${Math.min((team.memberCount / 10) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              </div>
            </CardContent>
          </Card>
        ))}

        {teams.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Layers className="h-10 w-10 opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium">No teams found</p>
              <p className="text-xs">Create your first team to start organizing writers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
