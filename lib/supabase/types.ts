// Hand-written Supabase types. Strict on purpose — no `any` anywhere in the app.
// Once the schema is live you can regenerate with:
//   supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Aesthetic =
  | 'princess-barbie'
  | 'strawberry-kiss'
  | 'matcha-strawberry'
  | 'purple-life'
  | 'moon'
  | 'apple-cider'
  | 'lana-del-ray'
  | 'midnight-rain'
  | 'midnight-plum';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high';
export type JournalType = 'gratitude' | 'reflection' | 'free';
export type MediaType = 'movie' | 'show' | 'book';
export type WishlistType = 'wish' | 'bucket';
export type Mood = 'happy' | 'mid' | 'sad' | 'anxious' | 'blessed';

export type UsersProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  theme: 'light' | 'dark' | 'auto';
  aesthetic: Aesthetic;
  created_at: string;
}

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  frequency_type: FrequencyType;
  frequency_days: number[] | null;
  reminder_time: string | null;
  start_date: string;
  created_at: string;
}

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export type Task = {
  id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  category: string | null;
  completed: boolean;
  position: number;
  created_at: string;
}

export type JournalEntry = {
  id: string;
  user_id: string;
  type: JournalType;
  content: Json;
  mood: string | null;
  tags: string[] | null;
  photo_url: string | null;
  created_at: string;
}

export type Note = {
  id: string;
  user_id: string;
  content: string;
  color: string | null;
  pinned: boolean;
  checklist: boolean;
  created_at: string;
}

export type FinanceBill = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string | null;
  status: string;
  recurring: boolean;
  frequency: string | null;
}

export type FinanceIncome = {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  date: string;
  category: string | null;
}

export type FinanceExpense = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  date: string;
  note: string | null;
}

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  deadline: string | null;
  progress_percent: number;
  why_matters: string | null;
  subtasks: Json;
  completed: boolean;
}

export type WishlistItem = {
  id: string;
  user_id: string;
  name: string;
  price: number | null;
  link: string | null;
  image_url: string | null;
  priority: string | null;
  purchased: boolean;
  type: WishlistType;
}

export type MediaItem = {
  id: string;
  user_id: string;
  title: string;
  type: MediaType;
  status: string | null;
  rating: number | null;
  review: string | null;
  poster_url: string | null;
  progress: number | null;
  author: string | null;
}

export type HealthWater = {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  goal_ml: number;
}

export type HealthSleep = {
  id: string;
  user_id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  quality: number | null;
}

export type HealthDiet = {
  id: string;
  user_id: string;
  date: string;
  meal_type: string | null;
  food_name: string | null;
  photo_url: string | null;
}

export type StudySession = {
  id: string;
  user_id: string;
  subject: string;
  duration_mins: number;
  topic: string | null;
  date: string;
}

export type VisionBoardItem = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  position: Json;
  board_name: string;
}

export type MoodLog = {
  id: string;
  user_id: string;
  date: string;
  mood: Mood;
  note: string | null;
}

export type Achievement = {
  id: string;
  user_id: string;
  badge_key: string;
  unlocked_at: string;
}

export type WidgetLayout = {
  id: string;
  user_id: string;
  layout: Json;
}

// Small helper: a table definition where Insert allows omitting db-defaulted
// columns and Update is a partial. The Relationships key is required by the
// Supabase client's generics — without it the whole schema resolves to `never`.
type TableDef<Row, Req extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Req> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users_profile: TableDef<UsersProfile, 'id'>;
      habits: TableDef<Habit, 'user_id' | 'name'>;
      habit_logs: TableDef<HabitLog, 'user_id' | 'habit_id' | 'date'>;
      tasks: TableDef<Task, 'user_id' | 'title'>;
      journal_entries: TableDef<JournalEntry, 'user_id'>;
      notes: TableDef<Note, 'user_id'>;
      finance_bills: TableDef<FinanceBill, 'user_id' | 'name'>;
      finance_income: TableDef<FinanceIncome, 'user_id' | 'source'>;
      finance_expenses: TableDef<FinanceExpense, 'user_id' | 'category'>;
      goals: TableDef<Goal, 'user_id' | 'title'>;
      wishlist: TableDef<WishlistItem, 'user_id' | 'name'>;
      media: TableDef<MediaItem, 'user_id' | 'title' | 'type'>;
      health_water: TableDef<HealthWater, 'user_id'>;
      health_sleep: TableDef<HealthSleep, 'user_id'>;
      health_diet: TableDef<HealthDiet, 'user_id'>;
      study_sessions: TableDef<StudySession, 'user_id' | 'subject'>;
      vision_board: TableDef<VisionBoardItem, 'user_id' | 'image_url'>;
      mood_log: TableDef<MoodLog, 'user_id' | 'mood'>;
      achievements: TableDef<Achievement, 'user_id' | 'badge_key'>;
      widget_layout: TableDef<WidgetLayout, 'user_id'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
