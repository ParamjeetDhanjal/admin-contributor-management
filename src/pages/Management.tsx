import React from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink,
  Filter,
  Users,
  Layers,
  Phone,
  Mail,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Settings2,
  UserPlus,
  Pencil,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
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
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { fetchWriters, fetchTeams, updateWriter, createTeam, createProfile, deleteProfile, updateTeam } from '@/services/dataService';
import { Profile, Team } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Management() {
  const [writers, setWriters] = React.useState<Profile[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = React.useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [editingUser, setEditingUser] = React.useState<Profile | null>(null);
  const [activeTab, setActiveTab] = React.useState('all');
  
  const [newUser, setNewUser] = React.useState({
    author_name: '',
    email: '',
    phone_number: '',
    team_id: '',
    pay_structure: 'task' as 'task' | 'flat',
    pricing: 0,
    webdesk_category: '' as any
  });

  React.useEffect(() => {
    if (editingUser) {
      const team = teams.find(t => t.id === editingUser.team_id);
      setNewUser({
        author_name: editingUser.author_name || '',
        email: editingUser.email || '',
        phone_number: editingUser.phone_number || '',
        team_id: team?.name || editingUser.team_id || '',
        pay_structure: editingUser.pay_structure || 'task',
        pricing: editingUser.pricing || 0,
        webdesk_category: editingUser.webdesk_category || ''
      });
    } else {
      setNewUser({
        author_name: '',
        email: '',
        phone_number: '',
        team_id: '',
        pay_structure: 'task',
        pricing: 0,
        webdesk_category: ''
      });
    }
  }, [editingUser, teams]);

  const loadData = async () => {
    try {
      const [writersData, teamsData] = await Promise.all([
        fetchWriters(),
        fetchTeams()
      ]);
      
      let updatedTeams = [...(teamsData || [])];
      
      // 1. Ensure Webdesk exists
      const webdeskTeam = updatedTeams.find(t => t.name?.toLowerCase() === 'webdesk');
      if (webdeskTeam && webdeskTeam.name !== 'Webdesk') {
        await updateTeam(webdeskTeam.id, { name: 'Webdesk' });
        webdeskTeam.name = 'Webdesk';
      } else if (!webdeskTeam) {
        const newTeam = await createTeam({ name: 'Webdesk' });
        updatedTeams.push({ ...newTeam, memberCount: 0 });
      }

      // 2. Ensure Social exists
      const socialTeam = updatedTeams.find(t => t.name?.toLowerCase() === 'social');
      if (!socialTeam) {
        const newTeam = await createTeam({ name: 'Social' });
        updatedTeams.push({ ...newTeam, memberCount: 0 });
      }

      // 3. Ensure Video exists
      const videoTeam = updatedTeams.find(t => t.name?.toLowerCase() === 'video');
      if (!videoTeam) {
        const newTeam = await createTeam({ name: 'Video' });
        updatedTeams.push({ ...newTeam, memberCount: 0 });
      }

      setWriters(writersData || []);
      setTeams(updatedTeams);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load management data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleUpdateWriter = async (id: string, updates: Partial<Profile>) => {
    try {
      await updateWriter(id, updates);
      toast.success('User updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    try {
      await createTeam({ name: newTeamName });
      toast.success('Team created');
      setIsTeamDialogOpen(false);
      setNewTeamName('');
      loadData();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  
  const [selectedTeamForDetails, setSelectedTeamForDetails] = React.useState<Team | null>(null);
  const [isTeamDetailsOpen, setIsTeamDetailsOpen] = React.useState(false);
  
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.author_name) {
      toast.error('Name and Email are required');
      return;
    }
    setLoading(true);
    try {
      // Map team name back to ID
      const selectedTeam = teams.find(t => t.name === newUser.team_id || t.id === newUser.team_id);
      const profileData = {
        ...newUser,
        team_id: selectedTeam?.id || null,
        is_approved: true,
        role: 'user' as const
      };

      if (editingUser) {
        await updateWriter(editingUser.id, profileData);
        toast.success('User updated successfully');
      } else {
        await createProfile(profileData);
        toast.success('User added to directory');
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.status === 403 || error.code === '42501') {
        toast.error('Permission denied. Please ensure you have admin rights.');
      } else {
        toast.error(editingUser ? 'Failed to update user' : 'Failed to add user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      await deleteProfile(userToDelete);
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.status === 403 || error.code === '42501') {
        toast.error('Permission denied. Cannot delete this user.');
      } else {
        toast.error('Failed to delete user');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredWriters = writers.filter(w => 
    ((w.author_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (w.email?.toLowerCase() || '').includes(search.toLowerCase())) &&
    (!selectedTeamId || w.team_id === selectedTeamId) &&
    (!selectedCategory || w.webdesk_category === selectedCategory)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Management Console...</p>
      </div>
    );
  }

  const UserTable = ({ data, title, description }: { data: Profile[], title: string, description: string }) => (
    <Card className="border shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact & Role</TableHead>
              <TableHead>Team & Category</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  No users found in this category.
                </TableCell>
              </TableRow>
            ) : (
              data.map((writer) => {
                const selectedTeam = teams.find(t => t.id === writer.team_id);
                
                return (
                  <TableRow 
                    key={writer.id} 
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingUser(writer);
                      setIsUserDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border shadow-sm bg-transparent">
                          <AvatarFallback className="bg-transparent text-slate-900 font-bold">
                            {writer.author_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{writer.author_name || 'Anonymous'}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{writer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          {writer.phone_number || 'No number'}
                        </div>
                        <Badge variant={writer.role === 'admin' ? 'default' : 'outline'} className="text-[10px] h-4">
                          {(writer.role || 'user').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-700">{selectedTeam?.name || 'No Team'}</span>
                        {writer.webdesk_category && (
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{writer.webdesk_category}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-600">
                          {writer.created_at ? new Date(writer.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {writer.created_at ? new Date(writer.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                        {writer.pricing?.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">
                          ({writer.pay_structure === 'flat' ? 'Flat' : 'Task'})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-slate-900"
                          onClick={() => {
                            setEditingUser(writer);
                            setIsUserDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setUserToDelete(writer.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Team Details Dialog */}
      <Dialog open={isTeamDetailsOpen} onOpenChange={setIsTeamDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-slate-900" />
              {selectedTeamForDetails?.name} Team Details
            </DialogTitle>
            <DialogDescription>
              Overview of members and performance for this team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Total Members</p>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {writers.filter(w => w.team_id === selectedTeamForDetails?.id).length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Team Structure</p>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {selectedTeamForDetails?.name === 'Webdesk' ? 'Desk Writers & Columnists' : 'Standard Contributors'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Members</p>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {writers.filter(w => w.team_id === selectedTeamForDetails?.id).map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-xl border bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
                        <AvatarFallback>{member.author_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.author_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] uppercase">{member.pay_structure}</Badge>
                  </div>
                ))}
                {writers.filter(w => w.team_id === selectedTeamForDetails?.id).length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-400 italic">No members assigned to this team yet.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsTeamDetailsOpen(false);
                setSelectedTeamId(selectedTeamForDetails?.id || null);
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className="w-full gap-2"
            >
              <Users className="h-4 w-4" />
              View in Directory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-center">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to remove this user from the directory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="flex-1">
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Management</h1>
          <p className="text-slate-500 text-sm mt-1">Unified control for teams and contributors.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog 
            open={isUserDialogOpen} 
            onOpenChange={(open) => {
              setIsUserDialogOpen(open);
              if (!open) setEditingUser(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                <UserPlus className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit Contributor' : 'Add Contributor'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update contributor information.' : 'Register a new writer or editor in the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={newUser.author_name} 
                    onChange={(e) => setNewUser({ ...newUser, author_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email"
                    value={newUser.email} 
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={newUser.phone_number} 
                    onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Team</Label>
                  <Select 
                    value={newUser.team_id}
                    onValueChange={(val) => setNewUser({ ...newUser, team_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter(t => ['webdesk', 'social', 'video'].includes(t.name?.toLowerCase() || '') || t.id === newUser.team_id || t.name === newUser.team_id)
                        .map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>

                {(newUser.team_id === 'Webdesk' || teams.find(t => t.id === newUser.team_id)?.name === 'Webdesk') && (
                  <div className="space-y-2 col-span-2">
                    <Label>Webdesk Category</Label>
                    <Select 
                      value={newUser.webdesk_category}
                      onValueChange={(val: any) => setNewUser({ ...newUser, webdesk_category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Columnist">Columnist</SelectItem>
                        <SelectItem value="Desk Writer">Webdesk Writer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Pay Model</Label>
                  <Select 
                    value={newUser.pay_structure}
                    onValueChange={(val: any) => setNewUser({ ...newUser, pay_structure: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Pay Per Task</SelectItem>
                      <SelectItem value="flat">Flat Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Base Pay (INR)</Label>
                  <Input 
                    type="number"
                    value={newUser.pricing} 
                    onChange={(e) => setNewUser({ ...newUser, pricing: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser} className="w-full bg-slate-900">
                  {editingUser ? 'Update User' : 'Add User to Directory'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Functional Team</DialogTitle>
                <DialogDescription>Add a new department like WebDesk, Social, or Video.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="team-name">Team Name</Label>
                <Input 
                  id="team-name" 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. WebDesk"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              className="pl-10 h-10 rounded-lg bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 border rounded-lg mb-6">
          <TabsTrigger 
            value="all" 
            className="text-xs px-6" 
            onClick={() => {
              setSelectedTeamId(null);
              setSelectedCategory(null);
            }}
          >
            All Users
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs px-6">Team Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <UserTable 
            data={filteredWriters} 
            title={
              selectedTeamId 
                ? `Team: ${teams.find(t => t.id === selectedTeamId)?.name}${selectedCategory ? ` - ${selectedCategory}` : ''}` 
                : "Directory"
            } 
            description="Complete list of all contributors in the system."
          />
        </TabsContent>

        <TabsContent value="teams" className="m-0">
          <div className="grid gap-6 md:grid-cols-3">
            {teams.map((team) => {
              const members = writers.filter(w => w.team_id === team.id);
              const isWebdesk = team.name === 'Webdesk';
              
              return (
                <Card 
                  key={team.id} 
                  className="border shadow-sm bg-white hover:border-slate-900 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedTeamForDetails(team);
                    setIsTeamDetailsOpen(true);
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-900 text-white group-hover:scale-110 transition-transform">
                          <Layers className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold">{team.name}</CardTitle>
                      </div>
                      {members.length > 0 && <Badge variant="secondary">{members.length} Members</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isWebdesk ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div 
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer group/sub"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamId(team.id);
                              setSelectedCategory('Desk Writer');
                              setActiveTab('all');
                            }}
                          >
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest group-hover/sub:text-slate-300">Writers</p>
                            <p className="text-2xl font-black mt-1">
                              {members.filter(m => m.webdesk_category === 'Desk Writer').length}
                            </p>
                          </div>
                          <div 
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer group/sub"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamId(team.id);
                              setSelectedCategory('Columnist');
                              setActiveTab('all');
                            }}
                          >
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest group-hover/sub:text-slate-300">Columnists</p>
                            <p className="text-2xl font-black mt-1">
                              {members.filter(m => m.webdesk_category === 'Columnist').length}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Members</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{members.length}</p>
                        </div>
                      )}
                      
                      <div className="flex -space-x-2">
                        {members.slice(0, 8).map(m => (
                          <Avatar key={m.id} className="h-8 w-8 border-2 border-white bg-transparent">
                            <AvatarFallback className="bg-transparent text-slate-900 font-bold text-[10px]">{m.author_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 8 && (
                          <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                            +{members.length - 8}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
