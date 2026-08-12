import { BadgePercent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getDiscountedPrice, getDiscountPercent, formatINR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  slug,
  size = "default",
  className,
}: {
  price: number;
  slug?: string;
  size?: "default" | "lg";
  className?: string;
}) {
  const discounted = getDiscountedPrice(price, slug);
  const percent = getDiscountPercent(price, slug);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span
        className={cn(
          "font-heading font-bold text-accent-600",
          size === "lg" ? "text-h2" : "text-lg"
        )}
      >
        {formatINR(discounted)}
      </span>
      <span className="text-sm text-muted-foreground line-through">{formatINR(price)}</span>
      <Badge variant="accent" className="gap-1 font-semibold">
        <BadgePercent className="size-3" />
        {size === "lg" ? `Special discount · ${percent}% off` : `${percent}% off`}
      </Badge>
    </div>
  );
}
