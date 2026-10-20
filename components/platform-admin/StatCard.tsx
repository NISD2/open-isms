import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  /** A string when the figure is a rate or a dash, not a count. */
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
