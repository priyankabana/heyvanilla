'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const FLAG = 'heyvanilla_named';

/** On the very first login (no name yet), asks what to call you, then saves it
 *  to the profile + auth metadata so the greeting and "[Name]'s day" use it. */
export function NamePrompt() {
  const { supabase, user } = useSupabase();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || localStorage.getItem(FLAG) === '1') return;
    const metaName = user.user_metadata?.name as string | undefined;
    if (metaName && metaName.trim()) {
      localStorage.setItem(FLAG, '1');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('users_profile')
        .select('name')
        .eq('id', user.id)
        .single();
      const profileName = (data as { name: string | null } | null)?.name;
      if (cancelled) return;
      if (profileName && profileName.trim()) {
        localStorage.setItem(FLAG, '1');
        return;
      }
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  async function save() {
    if (!user || !name.trim()) return;
    setSaving(true);
    const n = name.trim();
    await writer(supabase, 'users_profile').update({ name: n }).eq('id', user.id);
    try {
      await supabase.auth.updateUser({ data: { name: n } });
    } catch {
      /* metadata update is best-effort */
    }
    localStorage.setItem(FLAG, '1');
    setSaving(false);
    setOpen(false);
    // reload so the greeting + "[Name]'s day" immediately reflect the new name
    window.location.reload();
  }

  return (
    <Modal open={open} onClose={() => {}} title="welcome in 🤍">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          First things first — what should we call you?
        </p>
        <Input
          name="callme"
          label="Your name"
          placeholder="e.g. Prii"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
        />
        <Button onClick={save} loading={saving} disabled={!name.trim()} className="w-full">
          That&rsquo;s me
        </Button>
      </div>
    </Modal>
  );
}
