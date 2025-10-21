"use client";

import React, { useEffect, useRef } from "react";
import Markdown from "@/components/Markdown";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
  brandColor?: string;
  children?: React.ReactNode; // if provided, render children instead of Markdown
};

export default function MarkdownModal({ isOpen, onClose, title = "", content = "", brandColor = "#5B8F5B", children }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-black/40 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-5">
              {children ? (
                <div className="max-w-none">
                  {children}
                </div>
              ) : (
                <Markdown content={content} className="prose max-w-none" />
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 bg-gray-50 px-5 py-3 border-t">
              <button
                onClick={onClose}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

