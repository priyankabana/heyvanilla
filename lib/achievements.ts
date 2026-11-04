// Shared achievement definitions. Used by both the /achievements gallery and
// the AchievementWatcher that unlocks + toasts new badges in the background.

export interface Stats {
  habits: number;
  habitLogs: number;
  tasksDone: number;
  journal: number;
  studyMins: number;
  moods: number;
  goals: number;
}

export interface Badge {
  key: string;
  emoji: string;
  title: string;
  hint: string;
  unlocked: (s: Stats) => boolean;
}

export const BADGES: Badge[] = [
  { key: 'first-habit', emoji: '🌱', title: 'First sprout', hint: 'Create your first habit', unlocked: (s) => s.habits >= 1 },
  { key: 'ten-checkins', emoji: '✅', title: 'Showing up', hint: 'Tick off 10 habit days', unlocked: (s) => s.habitLogs >= 10 },
  { key: 'fifty-checkins', emoji: '🔥', title: 'On a roll', hint: '50 habit days logged', unlocked: (s) => s.habitLogs >= 50 },
  { key: 'first-task', emoji: '✔️', title: 'Getting it done', hint: 'Finish your first task', unlocked: (s) => s.tasksDone >= 1 },
  { key: 'twenty-tasks', emoji: '💪', title: 'Task crusher', hint: 'Finish 20 tasks', unlocked: (s) => s.tasksDone >= 20 },
  { key: 'first-journal', emoji: '📖', title: 'Dear diary', hint: 'Write your first entry', unlocked: (s) => s.journal >= 1 },
  { key: 'hundred-journal', emoji: '✍️', title: 'Chronicler', hint: 'Write 100 journal entries', unlocked: (s) => s.journal >= 100 },
  { key: 'study-hour', emoji: '⏱️', title: 'Deep focus', hint: 'Log 60 minutes of study', unlocked: (s) => s.studyMins >= 60 },
  { key: 'study-ten-hours', emoji: '🎓', title: 'Scholar', hint: '10 hours of study logged', unlocked: (s) => s.studyMins >= 600 },
  { key: 'mood-week', emoji: '💌', title: 'Tuned in', hint: 'Check your mood 7 times', unlocked: (s) => s.moods >= 7 },
  { key: 'first-goal', emoji: '🎯', title: 'Dreamer', hint: 'Set your first goal', unlocked: (s) => s.goals >= 1 },
];

export const BADGE_MAP = new Map(BADGES.map((b) => [b.key, b]));

export function earnedKeys(stats: Stats): string[] {
  return BADGES.filter((b) => b.unlocked(stats)).map((b) => b.key);
}
