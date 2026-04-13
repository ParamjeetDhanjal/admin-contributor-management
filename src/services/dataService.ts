import { supabase } from '@/lib/supabase';
import { Team, Profile, Story } from '@/types';

export const fetchTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*, profiles(id)')
    .order('name');
  if (error) throw error;
  
  // Transform to include member count
  return data.map(team => ({
    ...team,
    memberCount: team.profiles?.length || 0
  })) as (Team & { memberCount: number })[];
};

export const fetchWriters = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, teams(*)');
  if (error) throw error;
  return data as Profile[];
};

export const updateWriter = async (id: string, updates: Partial<Profile>) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

export const fetchSystemSettings = async () => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const updateSystemSettings = async (updates: any) => {
  const { error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', 1);
  if (error) throw error;
};

export const fetchStories = async () => {
  const { data, error } = await supabase
    .from('stories')
    .select('*, profiles(*, teams(*))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (Story & { profiles: Profile & { teams: Team | null } })[];
};

export const updateWriterTeam = async (writerId: string, teamId: string | null) => {
  const { error } = await supabase
    .from('profiles')
    .update({ team_id: teamId })
    .eq('id', writerId);
  if (error) throw error;
};

export const createTeam = async (team: Omit<Team, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single();
  if (error) throw error;
  return data as Team;
};

export const updateTeam = async (id: string, team: Partial<Team>) => {
  const { error } = await supabase
    .from('teams')
    .update(team)
    .eq('id', id);
  if (error) throw error;
};

export const fetchWriterProfile = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, teams(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as (Profile & { teams: Team | null });
};

export const fetchWriterStories = async (writerId: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', writerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Story[];
};

export const createProfile = async (profile: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
};

export const deleteProfile = async (id: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const deleteStory = async (id: string) => {
  const { error } = await supabase
    .from('stories')
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw error;
};

export const subscribeToStories = (callback: (payload: any) => void) => {
  return supabase
    .channel('public:stories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, callback)
    .subscribe();
};

export const subscribeToWriters = (callback: (payload: any) => void) => {
  return supabase
    .channel('public:profiles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
    .subscribe();
};
