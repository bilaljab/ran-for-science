import { Badge } from "@/components/ui/Badge";

type Tone = "primary" | "mint" | "mauve" | "neutral";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <Badge tone={tone}>{label}</Badge>;
}
