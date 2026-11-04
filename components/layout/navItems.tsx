import {
  Home,
  Repeat,
  CheckSquare,
  BookOpen,
  StickyNote,
  Wallet,
  Target,
  Sparkles,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Image as ImageIcon,
  Smile,
  Award,
  CalendarRange,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  primary?: boolean; // shown in the mobile bottom bar's first slots
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', Icon: Home, primary: true },
  { href: '/habits', label: 'Habits', Icon: Repeat, primary: true },
  { href: '/tasks', label: 'Tasks', Icon: CheckSquare, primary: true },
  { href: '/journal', label: 'Journal', Icon: BookOpen, primary: true },
  { href: '/notes', label: 'Notes', Icon: StickyNote },
  { href: '/finance', label: 'Finance', Icon: Wallet },
  { href: '/goals', label: 'Goals', Icon: Target },
  { href: '/wishlist', label: 'Wishlist', Icon: Sparkles },
  { href: '/media', label: 'Media', Icon: Clapperboard },
  { href: '/health', label: 'Health', Icon: HeartPulse },
  { href: '/study', label: 'Study', Icon: GraduationCap },
  { href: '/vision', label: 'Vision', Icon: ImageIcon },
  { href: '/mood', label: 'Mood', Icon: Smile },
  { href: '/review', label: 'Your year', Icon: CalendarRange },
  { href: '/achievements', label: 'Wins', Icon: Award },
  { href: '/settings', label: 'Settings', Icon: Settings, primary: true },
];
