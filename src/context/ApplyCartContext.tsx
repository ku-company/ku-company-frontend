"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartJob = {
  id: number;
  description?: string;
  jobType?: string;
  position?: string;
  job_title?: string;
  available_position?: number;
  company_name?: string;
  company_location?: string;
  company?: { id?: number; company_name?: string; location?: string };
};

type ApplyCartContextType = {
  items: CartJob[];
  add: (job: CartJob) => void;
  remove: (jobId: number) => void;
  clear: () => void;
  contains: (jobId: number) => boolean;
  count: number;
};

const Ctx = createContext<ApplyCartContextType | undefined>(undefined);
const STORAGE_KEY = "apply_cart";

export function ApplyCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartJob[]>([]);

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (job: CartJob) => {
    setItems((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
  };
  const remove = (jobId: number) => {
    setItems((prev) => prev.filter((j) => j.id !== jobId));
  };
  const clear = () => setItems([]);
  const contains = (jobId: number) => items.some((j) => j.id === jobId);
  const count = items.length;

  const value = useMemo(
    () => ({ items, add, remove, clear, contains, count }),
    [items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApplyCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApplyCart must be used within ApplyCartProvider");
  return ctx;
}

