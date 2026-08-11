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
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.6rem] bg-accent shadow-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <svg
          viewBox="0 0 32 32"
          className="size-6 text-primary"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 25V9.75C9 7.68 10.68 6 12.75 6h3.75a5 5 0 0 1 0 10H9"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m15 16 7 9"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M11.2 10.2h7.1M11.2 13h7.1"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.42"
          />
        </svg>
      </span>
      <span>
        Ropes<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
