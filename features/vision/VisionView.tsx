'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2, UploadCloud } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useVisionUrls } from '@/lib/hooks/useVisionUrls';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  }
}

export function VisionView() {
  const { rows, loading, insert, remove } = useRows('vision_board', {});
  const { supabase, user } = useSupabase();
  const urls = useVisionUrls(rows);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('That image is over 5MB — pick a smaller one.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError('');
    setOpen(false);
  }

  async function upload() {
    if (!file || !user) return;
    setUploading(true);
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${uid()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) {
      const msg = /bucket|not found/i.test(upErr.message)
        ? 'Upload storage isn\u2019t set up yet. Run supabase/schema.sql in your Supabase project to create the "uploads" bucket, then try again.'
        : upErr.message;
      setError(msg);
      setUploading(false);
      return;
    }
    // Store the storage path; we render via signed URLs (private bucket).
    await insert({ image_url: path, caption: caption.trim() || null });
    setUploading(false);
    reset();
  }

  if (loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Vision board"
        subtitle="the life you're quietly building toward."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          emoji="✨"
          title="Empty board"
          hint="Upload an image that feels like where you're headed."
          action={<Button onClick={() => setOpen(true)}>Upload an image</Button>}
        />
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
          {rows.map((v) => (
            <div
              key={v.id}
              className="group relative break-inside-avoid overflow-hidden rounded-[var(--radius)] ring-1 ring-black/5"
            >
              {urls[v.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[v.id]}
                  alt={v.caption ?? 'Vision'}
                  className="w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="skeleton aspect-square w-full" />
              )}
              {v.caption && (
                <p className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-xs text-white">
                  {v.caption}
                </p>
              )}
              <button
                onClick={() => remove(v.id)}
                aria-label="Remove"
                className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={reset} title="Add to board">
        <div className="flex flex-col gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 w-full rounded-[var(--radius)] object-cover"
            />
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border bg-white/20 px-6 py-10 text-text-secondary transition-colors hover:text-[var(--accent)]"
            >
              <UploadCloud size={28} />
              <span className="text-sm">Tap to choose an image</span>
              <span className="text-xs text-text-secondary/70">JPG / PNG · up to 5MB</span>
            </button>
          )}

          {preview && (
            <button
              onClick={() => fileRef.current?.click()}
              className="self-start text-xs text-[var(--accent)] hover:underline"
            >
              Choose a different image
            </button>
          )}

          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

          <Input
            name="caption"
            label="Caption (optional)"
            placeholder="A note to your future self"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Button onClick={upload} loading={uploading} disabled={!file} className="w-full">
            {uploading ? 'Uploading…' : 'Add to board'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
