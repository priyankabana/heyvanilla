import type { ComponentType } from 'react';
import { WaterWidget } from '@/components/widgets/WaterWidget';
import { CaloriesWidget } from '@/components/widgets/CaloriesWidget';
import { TasksWidget } from '@/components/widgets/TasksWidget';
import { MoodWidget } from '@/components/widgets/MoodWidget';
import { StreakWidget } from '@/components/widgets/StreakWidget';
import { FinanceWidget } from '@/components/widgets/FinanceWidget';
import { SpendingWidget } from '@/components/widgets/SpendingWidget';
import { GoalsWidget } from '@/components/widgets/GoalsWidget';
import { BillsWidget } from '@/components/widgets/BillsWidget';
import { ReadingWidget } from '@/components/widgets/ReadingWidget';
import { WatchingWidget } from '@/components/widgets/WatchingWidget';
import { QuoteWidget } from '@/components/widgets/QuoteWidget';
import { CountdownWidget } from '@/components/widgets/CountdownWidget';
import { MemoriesWidget } from '@/components/widgets/MemoriesWidget';
import { SummaryWidget } from '@/components/widgets/SummaryWidget';
import { MoodBoardWidget } from '@/components/widgets/MoodBoardWidget';
import { FocusWidget } from '@/components/widgets/FocusWidget';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { NotesWidget } from '@/components/widgets/NotesWidget';
import { SpotifyWidget } from './SpotifyWidget';

export interface WidgetDef {
  key: string;
  label: string;
  span: 1 | 2; // columns spanned on the desktop grid
  Component: ComponentType;
}

// The canonical list + default order. Order/visibility is overridden per user
// by what's saved in the widget_layout table.
export const WIDGETS: WidgetDef[] = [
  { key: 'calendar', label: 'Calendar', span: 1, Component: CalendarWidget },
  { key: 'summary', label: 'Today at a glance', span: 1, Component: SummaryWidget },
  { key: 'tasks', label: 'Tasks', span: 1, Component: TasksWidget },
  { key: 'notes', label: 'Notes', span: 1, Component: NotesWidget },
  { key: 'water', label: 'Water', span: 1, Component: WaterWidget },
  { key: 'calories', label: 'Calories', span: 1, Component: CaloriesWidget },
  { key: 'mood', label: 'Mood', span: 1, Component: MoodWidget },
  { key: 'focus', label: 'Focus', span: 1, Component: FocusWidget },
  { key: 'streak', label: 'Streak', span: 1, Component: StreakWidget },
  { key: 'finance', label: 'This month', span: 1, Component: FinanceWidget },
  { key: 'spending', label: 'Spent today', span: 1, Component: SpendingWidget },
  { key: 'goals', label: 'Goals', span: 1, Component: GoalsWidget },
  { key: 'bills', label: 'Upcoming bills', span: 1, Component: BillsWidget },
  { key: 'quote', label: 'Quote of the day', span: 2, Component: QuoteWidget },
  { key: 'moodboard', label: 'Mood board', span: 1, Component: MoodBoardWidget },
  { key: 'memories', label: 'On this day', span: 1, Component: MemoriesWidget },
  { key: 'countdown', label: 'Countdown', span: 1, Component: CountdownWidget },
  { key: 'reading', label: 'Currently reading', span: 1, Component: ReadingWidget },
  { key: 'watching', label: 'Currently watching', span: 1, Component: WatchingWidget },
  { key: 'spotify', label: 'Now playing', span: 1, Component: SpotifyWidget },
];

export const WIDGET_MAP = new Map(WIDGETS.map((w) => [w.key, w]));
export const DEFAULT_ORDER = WIDGETS.map((w) => w.key);
