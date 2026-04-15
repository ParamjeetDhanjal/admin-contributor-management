export interface Team {
  id: string;
  name: string;
  created_at: string;
  memberCount?: number;
}

export interface Profile {
  id: string;
  email: string;
  author_name: string;
  phone_number: string;
  pricing: number;
  team_id: string | null;
  pay_structure: 'flat' | 'task';
  webdesk_category?: 'Columnist' | 'Desk Writer';
  role: 'admin' | 'user';
  is_approved: boolean;
  team?: Team;
  created_at?: string;
}

export interface Story {
  id: string;
  story_id?: string;
  headline: string;
  user_id: string;
  amount: number;
  created_at: string;
  is_deleted?: boolean;
  profiles?: Profile & { teams: Team | null };
}

export interface WriterStats {
  total_stories: number;
  earned_this_month: number;
  submission_frequency: number; // stories per week or similar
}
