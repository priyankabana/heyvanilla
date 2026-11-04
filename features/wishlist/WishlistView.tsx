'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, ExternalLink } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import type { WishlistType } from '@/lib/supabase/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export function WishlistView() {
  const { rows, loading, insert, update, remove } = useRows('wishlist', {});
  const [tab, setTab] = useState<WishlistType>('wish');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const items = rows.filter((r) => r.type === tab);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await insert({
      name: name.trim(),
      type: tab,
      price: price ? parseFloat(price) : null,
      link: link.trim() || null,
    });
    setSaving(false);
    setName('');
    setPrice('');
    setLink('');
    setOpen(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Wishlist"
        subtitle="things you want, places you'll go."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <Chip active={tab === 'wish'} onClick={() => setTab('wish')}>Wishes</Chip>
        <Chip active={tab === 'bucket'} onClick={() => setTab('bucket')}>Bucket list</Chip>
      </div>

      {items.length === 0 ? (
        <EmptyState
          emoji={tab === 'wish' ? '🚼' : '🌍'}
          title={tab === 'wish' ? 'No wishes yet' : 'Bucket list is empty'}
          hint={tab === 'wish' ? 'Add something you have your eye on.' : 'What do you want to do before you forget to?'}
          action={<Button onClick={() => setOpen(true)}>Add one</Button>}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="flex items-center gap-3 p-3.5">
              <button
                onClick={() => update(it.id, { purchased: !it.purchased })}
                aria-label={it.purchased ? 'Mark not done' : 'Mark done'}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                style={{ borderColor: it.purchased ? 'var(--accent)' : 'var(--border)', backgroundColor: it.purchased ? 'var(--accent)' : 'transparent' }}
              >
                {it.purchased && <Check size={14} className="text-white" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={it.purchased ? 'truncate text-sm text-text-secondary line-through' : 'truncate text-sm text-text-primary'}>{it.name}</p>
                {it.price != null && <p className="text-xs text-text-secondary">{`₹${Number(it.price).toLocaleString('en-IN')}`}</p>}
              </div>
              {it.link && (
                <a href={it.link} target="_blank" rel="noopener noreferrer" aria-label="Open link" className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]">
                  <ExternalLink size={15} />
                </a>
              )}
              <button onClick={() => remove(it.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--danger)]">
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={tab === 'wish' ? 'New wish' : 'New bucket-list item'}>
        <div className="flex flex-col gap-4">
          <Input name="name" label="What is it?" placeholder={tab === 'wish' ? 'Headphones, a book...' : 'See the northern lights...'} value={name} onChange={(e) => setName(e.target.value)} />
          {tab === 'wish' && (
            <>
              <Input name="price" type="number" inputMode="decimal" label="Price (optional)" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              <Input name="link" type="url" label="Link (optional)" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
            </>
          )}
          <Button onClick={add} loading={saving} disabled={!name.trim()} className="w-full">Add</Button>
        </div>
      </Modal>
    </>
  );
}
