import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-6", className)} {...props} />;
}

export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return <section className={cn("py-18 md:py-22", className)} {...props} />;
}
