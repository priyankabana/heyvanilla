'use client';

import { useEffect, useState } from 'react';
import { Check, Save, Sun, Moon, Monitor } from 'lucide-react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import type { UsersProfile } from '@/lib/supabase/types';
import { writer } from '@/lib/supabase/write';
import { useTheme, AESTHETICS, type Mode } from '@/components/providers/ThemeProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SignOutButton } from '@/components/layout/SignOutButton';
import { cn } from '@/lib/utils/cn';

const SWATCH: Record<string, string> = {
  'princess-barbie': '#bc335f',
  'strawberry-kiss': '#e8537e',
  'matcha-strawberry': '#7fa96b',
  'purple-life': '#8b5cf6',
  moon: '#6b7280',
  'apple-cider': '#c2703d',
  'lana-del-ray': '#9b6a6c',
  'midnight-rain': '#5b8fb9',
  'midnight-plum': '#8e6a9e',
};

export function SettingsView() {
  const { supabase, user } = useSupabase();
  const { aesthetic, setAesthetic, mode, setMode } = useTheme();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('users_profile').select('*').eq('id', user.id).single();
      const profile = data as UsersProfile | null;
      if (profile?.name) setName(profile.name);
      else if (user.user_metadata?.name) setName(user.user_metadata.name as string);
    })();
  }, [supabase, user]);

  async function saveName() {
    if (!user) return;
    setSaving(true);
    await writer(supabase, 'users_profile').update({ name: name.trim() || null }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="make it yours." />

      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Profile</h2>
        <div className="flex flex-col gap-3">
          <Input name="name" label="Name" placeholder="What should I call you?" value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-text-secondary">Signed in as {user?.email}</p>
          <Button onClick={saveName} loading={saving} className="self-start">
            {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}
          </Button>
        </div>
      </Card>

      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'light', label: 'Light', Icon: Sun },
            { key: 'dark', label: 'Dark', Icon: Moon },
            { key: 'auto', label: 'Auto', Icon: Monitor },
          ] as { key: Mode; label: string; Icon: typeof Sun }[]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-[var(--radius)] border px-3 py-3 text-xs transition-all',
                mode === key ? 'border-[var(--accent)] bg-white/40 text-text-primary' : 'border-border text-text-secondary hover:bg-white/30'
              )}
            >
              <Icon size={18} className={mode === key ? 'text-[var(--accent)]' : ''} />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Auto follows your device. Dark keeps your aesthetic&apos;s accent over a dark canvas.
        </p>
      </Card>

      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Aesthetic</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AESTHETICS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAesthetic(key)}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left text-sm transition-all',
                aesthetic === key ? 'border-[var(--accent)] bg-white/40' : 'border-border hover:bg-white/30'
              )}
            >
              <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: SWATCH[key] }} aria-hidden />
              <span className="flex-1 text-text-primary">{label}</span>
              {aesthetic === key && <Check size={16} className="text-[var(--accent)]" />}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">Account</h2>
        <SignOutButton />
      </Card>
    </>
  );
}
