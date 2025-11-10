"use client";

import { toast, type ToastOptions } from "react-toastify";

const base: ToastOptions = {
  // Container sets theme/light and general behavior. Keep per-call light.
};

export const notify = {
  success: (msg: string, opts?: ToastOptions) => toast.success(msg, { ...base, ...opts }),
  error: (msg: string, opts?: ToastOptions) => toast.error(msg, { ...base, ...opts }),
  info: (msg: string, opts?: ToastOptions) => toast.info(msg, { ...base, ...opts }),
  warning: (msg: string, opts?: ToastOptions) => toast.warning(msg, { ...base, ...opts }),
};

export default notify;

