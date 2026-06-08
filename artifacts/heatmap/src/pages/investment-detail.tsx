import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { 
  ChevronLeft, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Download,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Building2
} from "lucide-react";

import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";

import { VerdictBadge } from "@/components/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export default function AnalysisDetail() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;

  const { data: analysis, isLoading, isError } = useGetAnalysis(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAnalysisQueryKey(id),
    }
  });

  const formatDocType = (type: string) => {
    switch (type) {
      case 'earnings_transcript': return "Earnings Transcript";
      case 'earnings_presentation': return "Earnings Presentation";
      case 's1_filing': return "S-1 Filing";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Analysis Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">We couldn't find the analysis you're looking for.</p>
        <Link href="/investment" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  // Group checklist items by category
  const categories = Array.from(new Set(analysis.checklist.map(item => item.category)));

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">
      
      {/* Header */}
      <div>
        <Link href="/investment/history" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to History
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-background text-muted-foreground border-border">
                {formatDocType(analysis.documentType)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Analyzed {format(new Date(analysis.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              {analysis.companyName || "Unknown Company"}
            </h1>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <span className="text-sm text-muted-foreground font-medium">Overall Verdict</span>
            <VerdictBadge verdict={analysis.overallVerdict} className="text-sm px-4 py-1" />
            <a
              href={`/api/analyses/${analysis.id}/markdown`}
              download
              data-testid="button-download-markdown"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors hover:bg-muted/50"
            >
              <Download className="w-3.5 h-3.5" />
              Download as Markdown
            </a>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20 shadow-sm overflow-hidden">
        <div className="h-1 bg-primary w-full"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            The Bottom Line
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-foreground/90">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Strengths & Risks */}
      {((analysis.keyStrengths && analysis.keyStrengths.length > 0) || 
        (analysis.keyRisks && analysis.keyRisks.length > 0)) && (
        <div className="grid md:grid-cols-2 gap-6">
          {analysis.keyStrengths && analysis.keyStrengths.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyStrengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-950/80 dark:text-emerald-100/80">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {analysis.keyRisks && analysis.keyRisks.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-rose-800 dark:text-rose-400 flex items-center gap-2 text-lg">
                  <ShieldAlert className="w-5 h-5" />
                  Key Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-rose-950/80 dark:text-rose-100/80">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Full Checklist */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight border-b pb-4">Detailed Breakdown</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We extracted the most important metrics and statements from the document and translated them to plain English.
          </p>
        </div>

        {categories.map((category) => {
          const items = analysis.checklist.filter(i => i.category === category);
          
          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                {category}
                <Badge variant="secondary" className="ml-2 font-normal text-xs">{items.length} items</Badge>
              </h3>
              
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <Card key={idx} className="border-border overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Metric name and value block */}
                      <div className="md:w-1/3 bg-muted/30 p-5 border-b md:border-b-0 md:border-r flex flex-col justify-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">{item.metric}</div>
                        
                        {item.value ? (
                          <div className="text-2xl font-bold font-mono tracking-tight text-foreground my-2">{item.value}</div>
                        ) : (
                          <div className="text-base font-medium text-foreground my-2">Qualitative</div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-auto pt-2">
                          <VerdictBadge verdict={item.verdict} className="text-[10px] px-2 py-0 h-5" />
                          
                          {item.yoyChange && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-mono flex items-center gap-1 border-muted-foreground/30 text-muted-foreground">
                              {item.yoyChange.includes('-') ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              YoY: {item.yoyChange}
                            </Badge>
                          )}
                          
                          {item.qoqChange && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-mono flex items-center gap-1 border-muted-foreground/30 text-muted-foreground">
                              {item.qoqChange.includes('-') ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              QoQ: {item.qoqChange}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Meaning and explanation block */}
                      <div className="md:w-2/3 p-5 flex flex-col">
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-foreground mb-1">What this means</h4>
                          <p className="text-sm text-muted-foreground">{item.whatItMeans}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-foreground mb-1">Verdict Reason</h4>
                          <p className="text-sm text-muted-foreground">{item.verdictReason}</p>
                        </div>
                        
                        {item.flags && (
                          <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-sm p-3 rounded-md border border-amber-200 dark:border-amber-900/50">
                            <span className="font-semibold block mb-1">Notable Flag</span>
                            {item.flags}
                          </div>
                        )}
                        
                        <Accordion type="single" collapsible className="w-full mt-auto">
                          <AccordionItem value="what-it-is" className="border-none">
                            <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:text-foreground">
                              <span className="flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                What exactly is this metric?
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md mt-1">
                              {item.whatItIs}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
