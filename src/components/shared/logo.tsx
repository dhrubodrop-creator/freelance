import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-heading text-xl font-bold tracking-tight",
        dark ? "text-white" : "text-foreground",
        className
      )}
    >
      Ropes
      <span className={cn("text-accent", dark ? "text-accent" : "text-accent")}>.</span>
    </Link>
  );
}
