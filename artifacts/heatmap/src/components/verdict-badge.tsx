import { Badge } from "@/components/ui/badge";

type Verdict = "positive" | "negative" | "neutral" | "mixed";

interface VerdictBadgeProps {
  verdict: Verdict | string;
  className?: string;
}

export function VerdictBadge({ verdict, className = "" }: VerdictBadgeProps) {
  const v = verdict.toLowerCase();
  
  if (v === "positive") {
    return <Badge className={`bg-emerald-500 hover:bg-emerald-600 text-white ${className}`}>Positive</Badge>;
  }
  if (v === "negative") {
    return <Badge className={`bg-rose-500 hover:bg-rose-600 text-white ${className}`}>Negative</Badge>;
  }
  if (v === "mixed") {
    return <Badge className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}>Mixed</Badge>;
  }
  return <Badge className={`bg-slate-400 hover:bg-slate-500 text-white ${className}`}>Neutral</Badge>;
}
