import { Link } from "wouter";
import { format } from "date-fns";
import { Trash2, FileText, ArrowRight, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { 
  useListAnalyses, 
  useDeleteAnalysis,
  getListAnalysesQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function History() {
  const { data: analyses, isLoading } = useListAnalyses();
  const deleteMutation = useDeleteAnalysis();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        toast({ title: "Analysis deleted" });
      },
      onError: () => {
        toast({ 
          title: "Could not delete", 
          description: "Something went wrong.",
          variant: "destructive"
        });
      }
    });
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Your past document reviews.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">No analyses yet</h2>
          <p className="text-muted-foreground mt-2">
            You haven't run any documents through the analyzer yet. Paste your first earnings transcript or presentation to get started.
          </p>
        </div>
        <Link href="/investment" className="inline-flex items-center justify-center h-10 px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
          Start Analysis
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Your past document reviews.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-border/50">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg line-clamp-1">{analysis.companyName || "Unknown Company"}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mt-1.5 gap-2">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {formatDocType(analysis.documentType)}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(analysis.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
              <VerdictBadge verdict={analysis.overallVerdict} className="ml-2 shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              <p className="line-clamp-3">
                {analysis.summary || "No summary available."}
              </p>
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between border-t bg-muted/10 px-6 py-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 px-2 -ml-2" data-testid={`button-delete-${analysis.id}`}>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete analysis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the analysis for {analysis.companyName || "this company"}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(analysis.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Link href={`/investment/analysis/${analysis.id}`} className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1" data-testid={`link-analysis-${analysis.id}`}>
                View Details
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
