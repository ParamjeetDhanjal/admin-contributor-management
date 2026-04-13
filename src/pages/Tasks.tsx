import React from 'react';
import { 
  Search, 
  ExternalLink,
  Filter,
  Users,
  Layers,
  IndianRupee,
  FileText,
  Trash2,
  CheckSquare,
  Square,
  Download,
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
  const [searchQuery, setSearchQuery] = React.useState(''); // For contributor dropdown
  const [headlineSearch, setHeadlineSearch] = React.useState(''); // For main headline search
  const [selectedStories, setSelectedStories] = React.useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [storyToDelete, setStoryToDelete] = React.useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [writersData, storiesData] = await Promise.all([
        fetchWriters(),
        fetchStories()
      ]);
      setWriters(writersData || []);
      setStories(storiesData || []);
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
      const teamName = s.profiles?.teams?.name?.toLowerCase() || '';
      if (selectedCategory === 'Social') categoryMatch = teamName === 'social';
      else if (selectedCategory === 'Video') categoryMatch = teamName === 'video';
      else if (selectedCategory === 'Webdesk Writers') categoryMatch = teamName === 'webdesk' && s.profiles?.webdesk_category === 'Desk Writer';
      else if (selectedCategory === 'Webdesk Contributors') categoryMatch = teamName === 'webdesk' && s.profiles?.webdesk_category === 'Columnist';
    }
    
    // Headline search match
    const headlineMatch = !headlineSearch || 
      (s.headline?.toLowerCase() || '').includes(headlineSearch.toLowerCase());
    
    return userMatch && categoryMatch && headlineMatch;
  });

  const sortedStories = [...filteredStories].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const exportToCSV = () => {
    if (filteredStories.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Headline', 'Contributor', 'Team', 'Amount', 'Status', 'CMS Link'];
    const rows = filteredStories.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      s.headline?.replace(/,/g, ' '),
      s.profiles?.author_name,
      s.profiles?.teams?.name,
      s.amount || s.profiles?.pricing || 0,
      s.is_deleted ? 'Deleted' : 'Active',
      `${import.meta.env.VITE_CMS_BASE_URL || 'https://cms.ndtv.com/admin/news/edit/'}${s.story_id || s.id}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `history_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data exported successfully');
  };

  const categoryCounts = {
    Social: (stories || []).filter(s => (s.profiles?.teams?.name?.toLowerCase() || '') === 'social').length,
    Video: (stories || []).filter(s => (s.profiles?.teams?.name?.toLowerCase() || '') === 'video').length,
    'Webdesk Writers': (stories || []).filter(s => (s.profiles?.teams?.name?.toLowerCase() || '') === 'webdesk' && s.profiles?.webdesk_category === 'Desk Writer').length,
    'Webdesk Contributors': (stories || []).filter(s => (s.profiles?.teams?.name?.toLowerCase() || '') === 'webdesk' && s.profiles?.webdesk_category === 'Columnist').length,
  };

  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  const filteredWriters = (writers || []).filter(w => 
    (w.author_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
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
          {/* Headline Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by headline..." 
              value={headlineSearch}
              onChange={(e) => setHeadlineSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-2 bg-white focus-visible:ring-slate-900 text-xs font-medium"
            />
          </div>

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
          <div className="flex items-center gap-2" ref={filterRef}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="h-9 px-4 rounded-xl border-2 bg-white hover:bg-slate-50 transition-all gap-2 font-bold text-xs"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl border-2 bg-white hover:bg-slate-50 transition-all",
                  taskUserFilter !== 'all' && "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                )}
              >
                <Filter className={cn("h-4 w-4", taskUserFilter !== 'all' ? "text-slate-900" : "text-slate-600")} />
              </Button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 p-2 rounded-xl shadow-2xl border-2 bg-white z-[100] text-slate-900 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2 px-2 pt-1">
                    Filter Contributor
                  </div>
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
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                    <button 
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors text-left",
                        taskUserFilter === 'all' ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                      onClick={() => {
                        setTaskUserFilter('all');
                        setIsFilterOpen(false);
                      }}
                    >
                      <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-[8px] shrink-0">ALL</div>
                      <span className="uppercase">All Contributors</span>
                    </button>
                    
                    {(filteredWriters || []).map((w) => (
                      <button 
                        key={w.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors text-left",
                          taskUserFilter === w.id ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                        )}
                        onClick={() => {
                          setTaskUserFilter(w.id);
                          setIsFilterOpen(false);
                        }}
                      >
                        <Avatar className="h-5 w-5 border bg-transparent shrink-0">
                          <AvatarFallback className="text-[8px] bg-transparent text-slate-900 font-bold">
                            {w.author_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="uppercase truncate">{w.author_name || 'Anonymous'}</span>
                      </button>
                    ))}
                    {(filteredWriters || []).length === 0 && (
                      <div className="py-4 text-center text-[10px] text-slate-400 italic">No contributors found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>

    {/* Task List - Centered */}
      <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between py-4 px-6">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                HISTORY
                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 h-4 rounded-md bg-slate-200 text-slate-700">
                  {sortedStories.length} {sortedStories.length === 1 ? 'Result' : 'Results'}
                </Badge>
              </CardTitle>
              <CardDescription className="font-mono text-[8px] uppercase tracking-widest">
                Archive: {selectedCategory === 'all' ? 'All' : selectedCategory} {taskUserFilter !== 'all' && writers && writers.length > 0 && `• ${writers.find(w => w.id === taskUserFilter)?.author_name || 'Unknown'}`}
              </CardDescription>
            </div>
          </div>
          {(selectedCategory !== 'all' || taskUserFilter !== 'all' || headlineSearch) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedCategory('all');
                setTaskUserFilter('all');
                setHeadlineSearch('');
              }} 
              className="text-[8px] font-black h-6 rounded-lg border-2 uppercase tracking-wider px-2"
            >
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
            {sortedStories.length === 0 ? (
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
                          if (selectedStories.length === sortedStories.length) setSelectedStories([]);
                          else setSelectedStories(sortedStories.map(s => s.id));
                        }}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        {selectedStories.length === sortedStories.length && sortedStories.length > 0 ? (
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
                  {sortedStories.map((story) => (
                    <TableRow 
                      key={story.id} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors border-b last:border-0 group relative",
                        selectedStories.includes(story.id) && "bg-slate-50",
                        story.is_deleted && "bg-slate-50/30 opacity-60"
                      )}
                    >
                      <TableCell className="px-6 py-3">
                        {!story.is_deleted && (
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
                        )}
                      </TableCell>
                      <TableCell className={cn(
                        "font-bold py-4 text-sm",
                        story.is_deleted ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="line-clamp-1 text-sm">{story.headline}</span>
                            <a 
                              href={`${import.meta.env.VITE_CMS_BASE_URL || 'https://cms.ndtv.com/admin/news/edit/'}${story.story_id || story.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 font-mono uppercase tracking-tighter"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              View in CMS
                            </a>
                          </div>
                          {story.is_deleted && (
                            <Badge variant="outline" className="text-[8px] h-4 bg-slate-100 text-slate-500 border-slate-200 uppercase font-black tracking-tighter">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border shadow-sm bg-transparent">
                            <AvatarFallback className="text-xs bg-transparent text-slate-900 font-bold">{story.profiles?.author_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">{story.profiles?.author_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{story.profiles?.teams?.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900 text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <IndianRupee className="h-3 w-3 text-slate-400" />
                          {(story.amount || story.profiles?.pricing || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        {!story.is_deleted && (
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
                        )}
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
