"use client";
import { useCallback, useEffect, useState } from "react";
import { CHANGE_EVENT, list, remove, upsert } from "./db";
import { SEED } from "./seed";
import type { TableMap, TableName } from "./types";

/**
 * Live table hook: loads rows, re-loads on any change (incl. other tabs in local mode).
 * `code` is the guest's invitation code: the public site passes it along so the server hands
 * over the private pages (venue, programme, FAQ) for a code it issued and withholds them
 * otherwise. The binder leaves it empty — its admin cookie already unlocks everything.
 */
export function useTable<T extends TableName>(t: T, fallbackToSeed = true, code = "") {
  const [rows, setRows] = useState<TableMap[T][]>(fallbackToSeed ? (SEED[t] as TableMap[T][]) : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try { setRows(await list(t, code)); setError(null); } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [t, code]);

  useEffect(() => {
    reload();
    const onChange = (e: Event) => { const d = (e as CustomEvent).detail; if (d === t || d === "*") reload(); };
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key === `jsos:${t}`) reload(); };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(CHANGE_EVENT, onChange); window.removeEventListener("storage", onStorage); };
  }, [t, code, reload]);

  const save = useCallback(async (row: TableMap[T] | TableMap[T][]) => {
    // optimistic
    setRows((cur) => {
      const next = [...cur] as (TableMap[T] & { id: string })[];
      for (const r of (Array.isArray(row) ? row : [row]) as (TableMap[T] & { id: string })[]) {
        const i = next.findIndex((x) => x.id === r.id);
        if (i >= 0) next[i] = r; else next.push(r);
      }
      return next;
    });
    try { await upsert(t, row); } catch (e) { setError((e as Error).message); reload(); }
  }, [t, reload]);

  const del = useCallback(async (id: string) => {
    setRows((cur) => (cur as { id: string }[]).filter((x) => x.id !== id) as TableMap[T][]);
    try { await remove(t, id); } catch (e) { setError((e as Error).message); reload(); }
  }, [t, reload]);

  return { rows, setRows, loading, error, reload, save, del };
}

export function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = Math.max(0, new Date(target).getTime() - (now ?? new Date(target).getTime()));
  return {
    ready: now !== null,
    days: Math.floor(diff / 864e5),
    hours: Math.floor((diff / 36e5) % 24),
    minutes: Math.floor((diff / 6e4) % 60),
    seconds: Math.floor((diff / 1e3) % 60),
  };
}
