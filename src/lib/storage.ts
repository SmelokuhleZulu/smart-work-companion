import { useCallback, useEffect, useState } from "react";

export type SavedEmail = {
  id: string;
  createdAt: number;
  recipient: string;
  purpose: string;
  tone: string;
  subject: string;
  body: string;
};

export type SavedSummary = {
  id: string;
  createdAt: number;
  title: string;
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: { owner: string; task: string }[];
  deadlines: string[];
  risks: string[];
};

export type SavedPlan = {
  id: string;
  createdAt: number;
  hours: string;
  deadline: string;
  priorities: { rank: number; task: string; priority: "High" | "Medium" | "Low" }[];
  schedule: { time: string; task: string }[];
  tips: string[];
};

export type SavedResearch = {
  id: string;
  createdAt: number;
  topic: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  risks: string[];
  resources: { title: string; description: string }[];
};

export type ActivityEntry = {
  id: string;
  ts: number;
  kind: "email" | "summary" | "plan" | "research" | "chat";
  label: string;
};

export type Kpis = {
  emails: number;
  summaries: number;
  plans: number;
  research: number;
};

const KEYS = {
  emails: "wpa.emails",
  summaries: "wpa.summaries",
  plans: "wpa.plans",
  research: "wpa.research",
  chat: "wpa.chat",
  activity: "wpa.activity",
  kpis: "wpa.kpis",
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("wpa:storage", { detail: { key } }));
  } catch {
    /* noop */
  }
}

export function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));

  useEffect(() => {
    setValue(read(key, initial));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === key) setValue(read(key, initial));
    };
    window.addEventListener("wpa:storage", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("wpa:storage", onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, v);
        return v;
      });
    },
    [key],
  );

  return [value, update] as const;
}

export function logActivity(kind: ActivityEntry["kind"], label: string) {
  const current = read<ActivityEntry[]>(KEYS.activity, []);
  const entry: ActivityEntry = { id: uid(), ts: Date.now(), kind, label };
  write(KEYS.activity, [entry, ...current].slice(0, 20));

  const kpis = read<Kpis>(KEYS.kpis, { emails: 0, summaries: 0, plans: 0, research: 0 });
  if (kind === "email") kpis.emails += 1;
  else if (kind === "summary") kpis.summaries += 1;
  else if (kind === "plan") kpis.plans += 1;
  else if (kind === "research") kpis.research += 1;
  write(KEYS.kpis, kpis);
}

export const storageKeys = KEYS;

export function clearAllData() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent("wpa:storage", { detail: { key: "*" } }));
}
