import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(isoTime: string) {
  return new Date(isoTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateTime(isoTime: string) {
  return new Date(isoTime).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
