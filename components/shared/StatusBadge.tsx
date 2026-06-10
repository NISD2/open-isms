import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface StatusBadgeProps {
  status: string;
  config: Record<string, { variant: BadgeVariant; className?: string }>;
  label: string;
}

export function StatusBadge({ status, config, label }: StatusBadgeProps) {
  const cfg = config[status] ?? { variant: "outline" as BadgeVariant };
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {label}
    </Badge>
  );
}
