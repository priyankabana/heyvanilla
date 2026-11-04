'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import SplashScreen, { hasSplashed } from '@/components/SplashScreen';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
} from '@/lib/validations/auth';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const params = useSearchParams();
  const redirectedFrom = params.get('redirectedFrom') ?? '/';

  // Splash plays once per session, before anything. Decided AFTER mount so the
  // server and first client render produce identical HTML (no hydration error).
  const [splashing, setSplashing] = useState<boolean | null>(null);

  useEffect(() => {
    setSplashing(!hasSplashed());
  }, []);

  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverMsg, setServerMsg] = useState<{
    kind: 'error' | 'ok';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      mode === 'login'
        ? loginSchema
        : mode === 'signup'
        ? signupSchema
        : forgotPasswordSchema,
    [mode]
  );

  // Live validity so the submit button can be disabled until the form is good.
  const isValid = useMemo(() => {
    const payload =
      mode === 'forgot'
        ? { email: form.email }
        : mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
    return schema.safeParse(payload).success;
  }, [schema, form, mode]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setServerMsg(null);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setServerMsg(null);
  }

  async function handleSubmit() {
    const payload =
      mode === 'forgot'
        ? { email: form.email }
        : mode === 'login'
        ? { email: form.email, password: form.password }
        : form;

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setServerMsg(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.replace(redirectedFrom);
        router.refresh();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) throw error;
        setServerMsg({
          kind: 'ok',
          text: 'Check your inbox to confirm your email, then come back in.',
        });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        });
        if (error) throw error;
        setServerMsg({
          kind: 'ok',
          text: 'If that email exists, a reset link is on its way.',
        });
      }
    } catch {
      // Generic message on purpose — never leak the real auth error.
      setServerMsg({
        kind: 'error',
        text: "That didn't work. Double-check and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerMsg({ kind: 'error', text: 'Could not reach Google right now.' });
      setSubmitting(false);
    }
  }

  // Until we've decided (post-mount), paint the same black backdrop the splash
  // uses so there's nothing for hydration to mismatch against.
  if (splashing === null) {
    return <div className="fixed inset-0 z-[100]" style={{ backgroundColor: '#0a0a0a' }} />;
  }

  if (splashing) {
    return <SplashScreen onFinish={() => setSplashing(false)} />;
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      {/* Soft themed atmosphere behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 60% at 30% 20%, var(--accent-light), transparent 60%), radial-gradient(60% 50% at 80% 90%, var(--accent), transparent 70%)',
          opacity: 0.45,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card relative z-10 w-full max-w-md p-8"
      >
        {/* Logo fades in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-7 text-center"
        >
          <h1
            className="text-4xl"
            style={{ fontFamily: 'var(--font-playfair), serif', fontWeight: 400 }}
          >
            <span className="wordmark-hey">Hey</span>
            <span className="wordmark-vanilla">Vanilla</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {mode === 'login'
              ? 'welcome back. ready when you are.'
              : mode === 'signup'
              ? 'let’s make your little corner of calm.'
              : 'no stress — we’ll get you back in.'}
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  name="name"
                  label="Name"
                  placeholder="what should I call you?"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  error={errors.name}
                  autoComplete="name"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          {mode !== 'forgot' && (
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          {serverMsg && (
            <div
              role="status"
              className="rounded-[var(--radius)] px-3 py-2 text-xs"
              style={{
                background:
                  serverMsg.kind === 'error'
                    ? 'color-mix(in srgb, var(--danger) 14%, transparent)'
                    : 'color-mix(in srgb, var(--success) 16%, transparent)',
                color:
                  serverMsg.kind === 'error'
                    ? 'var(--danger)'
                    : 'var(--success)',
              }}
            >
              {serverMsg.text}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isValid}
            className="mt-1 w-full"
          >
            {mode === 'login'
              ? 'Sign in'
              : mode === 'signup'
              ? 'Create account'
              : 'Send reset link'}
            <ArrowRight size={16} />
          </Button>

          {mode !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 py-1 text-xs text-text-secondary">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full"
              >
                <GoogleMark />
                Continue with Google
              </Button>
            </>
          )}
        </div>

        {/* Mode switches */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-text-secondary">
          {mode === 'login' && (
            <>
              <button
                className="transition-colors hover:text-text-primary"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
              <span>
                New here?{' '}
                <button
                  className="font-medium text-[var(--accent)] hover:underline"
                  onClick={() => switchMode('signup')}
                >
                  Make an account
                </button>
              </span>
            </>
          )}
          {mode === 'signup' && (
            <span>
              Already have one?{' '}
              <button
                className="font-medium text-[var(--accent)] hover:underline"
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
            </span>
          )}
          {mode === 'forgot' && (
            <button
              className="font-medium text-[var(--accent)] hover:underline"
              onClick={() => switchMode('login')}
            >
              Back to sign in
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-text-secondary">
          Made with 🤍 — don&apos;t melt, Vanilla.
        </p>

        {/* tiny decorative icons reserved for later use */}
        <span className="sr-only">
          <Mail /> <Lock /> <User />
        </span>
      </motion.div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.1 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 42.3 16 47 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.9 35.7 45 30.4 45 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
