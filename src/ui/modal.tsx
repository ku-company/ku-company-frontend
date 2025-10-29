"use client";
import * as React from "react";
import { cn } from "@/ui/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, children, className }: ModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4 animate-in fade-in-0"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl bg-white shadow-xl outline outline-1 outline-gray-200 animate-in zoom-in-95 duration-200",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;

