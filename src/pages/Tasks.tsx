import React from 'react';
import { 
  Search, 
  Filter,
  Users,
  Layers,
  IndianRupee,
  FileText,
  Trash2,
  CheckSquare,
  Square,
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  fetchWriters, 
  fetchStories, 
  deleteStory,
  subscribeToStories 
} from '@/services/dataService';
import { Profile, Story } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

export default function Tasks() {
  const [writers, setWriters] = React.useState<Profile[]>([]);
  const [stories, setStories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [taskUserFilter, setTaskUserFilter] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStories, setSelectedStories] = React.useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [storyToDelete, setStoryToDelete] = React.useState<string | null>(null);

  const loadData = async () => {
    try {
      const [writersData, storiesData] = await Promise.all([
        fetchWriters(),
        fetchStories()
      ]);
      setWriters(writersData);
      setStories(storiesData);
    } catch (error: any) {
      console.error('Error loading tasks data:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();

    const sub = subscribeToStories(() => {
      loadData();
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleDeleteStory = async () => {
    const id = storyToDelete;
    if (!id) return;
    
    try {
      await deleteStory(id);
      toast.success('Entry removed from history');
      setIsDeleteDialogOpen(false);
      setStoryToDelete(null);
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const toggleSelectStory = (id: string) => {
    setSelectedStories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedStories.length === 0) return;
    
    const confirm = window.confirm(`Are you sure you want to delete ${selectedStories.length} entries?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedStories.map(id => deleteStory(id)));
      toast.success(`${selectedStories.length} entries removed`);
      setSelectedStories([]);
    } catch (error) {
      toast.error('Failed to delete some entries');
    }
  };

  const filteredStories = stories.filter(s => {
    const userMatch = taskUserFilter === 'all' || s.user_id === taskUserFilter;
    
    let categoryMatch = true;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Social') categoryMatch = s.profiles?.teams?.name === 'Social';
      else if (selectedCategory === 'Video') categoryMatch = s.profiles?.teams?.name === 'Video';
      else if (selectedCategory === 'Webdesk Writers') categoryMatch = s.profiles?.teams?.name === 'Webdesk' && s.profiles?.webdesk_category === 'Desk Writer';
      else if (selectedCategory === 'Webdesk Contributors') categoryMatch = s.profiles?.teams?.name === 'Webdesk' && s.profiles?.webdesk_category === 'Columnist';
    }
    
    return userMatch && categoryMatch;
  });

  const categoryCounts = {
    Social: stories.filter(s => s.profiles?.teams?.name === 'Social').length,
    Video: stories.filter(s => s.profiles?.teams?.name === 'Video').length,
    'Webdesk Writers': stories.filter(s => s.profiles?.teams?.name === 'Webdesk' && s.profiles?.webdesk_category === 'Desk Writer').length,
    'Webdesk Contributors': stories.filter(s => s.profiles?.teams?.name === 'Webdesk' && s.profiles?.webdesk_category === 'Columnist').length,
  };

  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  const filteredWriters = writers.filter(w => 
    w.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto px-8 py-4">
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-center">Remove Entry</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently remove this contribution from both applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStory} className="flex-1">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(['Social', 'Video', 'Webdesk Writers', 'Webdesk Contributors'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
              className={cn(
                "relative overflow-hidden rounded-xl border px-4 py-2 text-left transition-all group min-w-[120px]",
                selectedCategory === category ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "bg-slate-50 hover:border-slate-300 border-slate-100"
              )}
            >
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    selectedCategory === category ? "text-slate-400" : "text-slate-500"
                  )}>
                    {category}
                  </span>
                  <Badge variant={selectedCategory === category ? "secondary" : "outline"} className="text-[8px] font-bold px-1 h-3.5 rounded-sm">
                    {categoryCounts[category]}
                  </Badge>
                </div>
              </div>
              {/* Visual Bar Background */}
              <div 
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 transition-all duration-700",
                  selectedCategory === category ? "bg-white w-full" : "bg-slate-200"
                )}
                style={{ width: selectedCategory === category ? '100%' : `${(categoryCounts[category] / maxCount) * 100}%` }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {selectedStories.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              className="h-9 px-4 rounded-xl gap-2 animate-in fade-in slide-in-from-right-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedStories.length})
            </Button>
          )}
          {/* Contributor Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-2 bg-white hover:bg-slate-50">
                <Filter className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-2 bg-white z-[100] text-slate-900 opacity-100">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2">
                Filter Contributor
              </DropdownMenuLabel>
              <div className="px-1 pb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 text-[10px] h-8 rounded-lg bg-slate-50 border-none focus-visible:ring-slate-900" 
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <DropdownMenuItem 
                  className={cn(
                    "text-[10px] font-bold rounded-lg cursor-pointer px-2 py-1.5",
                    taskUserFilter === 'all' && "bg-slate-100"
                  )}
                  onClick={() => setTaskUserFilter('all')}
                >
                  ALL CONTRIBUTORS
                </DropdownMenuItem>
                {filteredWriters.map(w => (
                  <DropdownMenuItem 
                    key={w.id}
                    className={cn(
                      "text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-2 px-2 py-1.5",
                      taskUserFilter === w.id && "bg-slate-100"
                    )}
                    onClick={() => setTaskUserFilter(w.id)}
                  >
                    <Avatar className="h-5 w-5 border">
                      <AvatarImage src={`https://avatar.vercel.sh/${w.email}`} />
                      <AvatarFallback className="text-[8px]">{w.author_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="uppercase truncate">{w.author_name}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task List - Centered */}
      <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between py-4 px-6">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-sm font-black tracking-tight uppercase">HISTORY</CardTitle>
              <CardDescription className="font-mono text-[8px] uppercase tracking-widest">
                Archive: {selectedCategory === 'all' ? 'All' : selectedCategory} {taskUserFilter !== 'all' && `• ${writers.find(w => w.id === taskUserFilter)?.author_name}`}
              </CardDescription>
            </div>
          </div>
          {(selectedCategory !== 'all' || taskUserFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedCategory('all');
                setTaskUserFilter('all');
              }} 
              className="text-[8px] font-black h-6 rounded-lg border-2 uppercase tracking-wider px-2"
            >
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
            {filteredStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">No records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[50px] px-6 h-10">
                      <button 
                        onClick={() => {
                          if (selectedStories.length === filteredStories.length) setSelectedStories([]);
                          else setSelectedStories(filteredStories.map(s => s.id));
                        }}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        {selectedStories.length === filteredStories.length && filteredStories.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[400px] font-black uppercase tracking-widest text-[8px] h-10">Headline</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[8px] h-10">Contributor</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[8px] h-10">Date</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest text-[8px] h-10">Amount</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest text-[8px] px-6 h-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStories.map((story) => (
                    <TableRow 
                      key={story.id} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors border-b last:border-0 group",
                        selectedStories.includes(story.id) && "bg-slate-50"
                      )}
                    >
                      <TableCell className="px-6 py-3">
                        <button 
                          onClick={() => toggleSelectStory(story.id)}
                          className={cn(
                            "transition-colors",
                            selectedStories.includes(story.id) ? "text-slate-900" : "text-slate-200 group-hover:text-slate-400"
                          )}
                        >
                          {selectedStories.includes(story.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 py-3 text-xs">{story.headline}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border shadow-sm">
                            <AvatarImage src={`https://avatar.vercel.sh/${story.profiles?.email}`} />
                            <AvatarFallback className="text-[8px]">{story.profiles?.author_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-tight">{story.profiles?.author_name}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{story.profiles?.teams?.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[8px] font-mono font-bold text-slate-500 uppercase">
                        {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900 text-xs">
                        <div className="flex items-center justify-end gap-0.5">
                          <IndianRupee className="h-2.5 w-2.5 text-slate-400" />
                          {(story.amount || story.profiles?.pricing || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setStoryToDelete(story.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 text-slate-200 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
