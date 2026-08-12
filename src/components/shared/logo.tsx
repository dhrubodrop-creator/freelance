import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Ropes home"
      className={cn(
        "group inline-flex w-fit items-center gap-2.5 font-heading text-xl font-bold tracking-tight",
        dark ? "text-white" : "text-foreground",
        className
      )}
    >
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.65rem] border border-accent-400 bg-accent shadow-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <svg
          viewBox="0 0 36 36"
          className="size-[1.65rem] text-primary"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m17.7 11.3-3.3-3.1a5.3 5.3 0 0 0-7.3 7.7l6.2 5.8a5.3 5.3 0 0 0 7.3-.1l1.8-1.8"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m18.3 24.7 3.3 3.1a5.3 5.3 0 0 0 7.3-7.7l-6.2-5.8a5.3 5.3 0 0 0-7.3.1l-1.8 1.8"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m15.2 19.8 5.6-5.6"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </span>
      <span>
        Ropes<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
