import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { FileText, TrendingUp, AlertTriangle, Building, Presentation, FileBox } from "lucide-react";

import { 
  useCreateAnalysis, 
  useGetAnalysisStats,
  getListAnalysesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

type FormValues = {
  documentType: "earnings_transcript" | "earnings_presentation" | "s1_filing";
  companyName?: string;
  documentText: string;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAnalysis = useCreateAnalysis();
  const { data: stats } = useGetAnalysisStats();

  const form = useForm<FormValues>({
    defaultValues: {
      documentType: "earnings_transcript",
      companyName: "",
      documentText: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!values.documentText || values.documentText.length < 50) {
      form.setError("documentText", {
        message: "Please paste the document text (at least 50 characters).",
      });
      return;
    }
    createAnalysis.mutate({
      data: {
        documentType: values.documentType,
        documentText: values.documentText,
        companyName: values.companyName || null,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        const cached = (data as { cached?: boolean }).cached;
        toast({
          title: cached ? "Returned cached analysis" : "Analysis complete!",
          description: cached ? "Same document was analyzed within the last 24 hours." : undefined,
        });
        setLocation(`/investment/analysis/${data.id}`);
      },
      onError: (err) => {
        toast({ 
          title: "Analysis failed", 
          description: "Something went wrong while analyzing. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Understand companies in plain English
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Paste dense financial documents. Get a structured, beginner-friendly analysis breaking down the strengths, risks, and what it all means.
        </p>
      </section>

      {stats && stats.totalAnalyses > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalAnalyses}</div>
              <div className="text-xs text-muted-foreground font-medium">Analyses Done</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.byVerdict.positive}</div>
              <div className="text-xs text-muted-foreground font-medium">Positive Looks</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.byVerdict.mixed}</div>
              <div className="text-xs text-muted-foreground font-medium">Mixed Signals</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{stats.byVerdict.negative}</div>
              <div className="text-xs text-muted-foreground font-medium">Red Flags</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>New Analysis</CardTitle>
              <CardDescription>Paste your document below to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-document-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="earnings_transcript">Earnings Call Transcript</SelectItem>
                              <SelectItem value="earnings_presentation">Earnings Presentation</SelectItem>
                              <SelectItem value="s1_filing">S-1 IPO Filing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Apple, Tesla" {...field} data-testid="input-company-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="documentText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the full text of the document here..." 
                            className="min-h-[300px] resize-y font-mono text-sm bg-muted/30" 
                            {...field} 
                            data-testid="textarea-document-text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg" 
                    disabled={createAnalysis.isPending}
                    data-testid="button-submit-analysis"
                  >
                    {createAnalysis.isPending ? (
                      <>
                        <Spinner className="mr-2 h-5 w-5" />
                        Analyzing your document... (this takes 10-30s)
                      </>
                    ) : (
                      "Analyze Document"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              What should I paste?
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <strong className="block text-foreground flex items-center gap-1.5 mb-1">
                  <Presentation className="w-4 h-4 text-muted-foreground" />
                  Earnings Transcripts
                </strong>
                <span className="text-muted-foreground">The text from a company's quarterly call with Wall Street. Great for seeing how management answers tough questions.</span>
              </div>
              
              <div>
                <strong className="block text-foreground flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Earnings Presentations
                </strong>
                <span className="text-muted-foreground">The slide deck companies release. Try selecting all text (Ctrl+A) on a PDF and pasting it here.</span>
              </div>

              <div>
                <strong className="block text-foreground flex items-center gap-1.5 mb-1">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  S-1 Filings (IPOs)
                </strong>
                <span className="text-muted-foreground">The massive document a company files before going public. Paste the "Business" or "Risk Factors" section.</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Disclaimer
            </h3>
            <p className="text-sm text-muted-foreground">
              This tool uses AI to summarize and analyze text. It is for educational purposes only and does not constitute financial advice. AI can make mistakes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
