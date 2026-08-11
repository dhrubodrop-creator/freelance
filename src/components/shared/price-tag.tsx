import { Badge } from "@/components/ui/badge";
import { getDiscountedPrice, formatINR, PROMO_DISCOUNT_PERCENT } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  size = "default",
  className,
}: {
  price: number;
  size?: "default" | "lg";
  className?: string;
}) {
  const discounted = getDiscountedPrice(price);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span
        className={cn(
          "font-heading font-bold",
          size === "lg" ? "text-h2" : "text-lg"
        )}
      >
        {formatINR(discounted)}
      </span>
      <span className="text-sm text-muted-foreground line-through">{formatINR(price)}</span>
      <Badge variant="accent">{PROMO_DISCOUNT_PERCENT}% off</Badge>
    </div>
  );
}
