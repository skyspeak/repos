import { useState, useRef, useEffect } from 'react';
import { Category, BUCKETS } from '@/types';
import { streamLLM, loadDeepDiveCache, canRefreshDeepDive } from '@/lib/llm';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Settings2, StopCircle, Play, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  category: Category;
  onOpenSettings: () => void;
}

function buildDeepDivePrompt(c: Category): string {
  return `# AI Disruption Deep-Dive: ${c.name}

You are an AI venture analyst. Produce a single structured deep-dive on
**${c.name}** (sector: ${c.bucket}). Keep tone tight, specific, named.

# Context
- TAM: $${c.marketSize}B at ${c.cagr}% CAGR
- Composite disruption: ${c.composite.toFixed(1)} / 10
- Time horizon: ${c.scores.timeHorizon} years
- Top incumbents: ${c.incumbents.slice(0, 3).map(i => i.name).join(', ')}
- Notable challengers: ${c.challengers.slice(0, 3).map(i => i.name).join(', ')}
- GTM motion: ${c.gtmMotion}

# Required output (use exactly these four section headers, in order)

## 1. Supply Chain Leverage Point
Identify the single layer of the value chain (input → intermediary → end buyer)
where AI extracts the most stranded margin. Name the specific actors being
displaced and the dollar pool at risk. Be concrete.

## 2. Product Architecture Recommendation
Describe the reference AI-native product. Cover: (a) core AI primitives
(models, agents, retrieval — be specific), (b) data flywheel and why
competitors cannot replicate it, (c) integration architecture (named source
systems and write-back surface).

## 3. GTM Wedge
The exact wedge to enter the market. Cover: (a) beachhead customer segment
with 3 named target accounts, (b) GTM motion and ACV, (c) the first 5 paying
customers and how to land them.

## 4. Competitive Moat Thesis
Why this startup wins long-term. Cover: (a) what compounds (data, network,
distribution), (b) why incumbents cannot copy it within 24 months, (c) the
single biggest risk that breaks the thesis and how to mitigate it.

Be specific with company names, dollar amounts, and dates. Use bullet points
and **bold** for scannability.`;
}

export default function LLMDrawer({ category, onOpenSettings }: Props) {
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [cacheInfo, setCacheInfo] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bucket = BUCKETS.find(b => b.id === category.bucket);
  const cacheKey = category.id;

  useEffect(() => {
    controllerRef.current?.abort();
    requestIdRef.current += 1;
    setOutput('');
    setError('');
    setStreaming(false);
    setCacheInfo(null);

    const cached = loadDeepDiveCache(cacheKey);
    if (cached) {
      setOutput(cached.output);
      setCacheInfo(`Cached analysis from ${new Date(cached.cachedAt).toLocaleString()}. Refreshes daily at UTC midnight.`);
    }
  }, [category.id, cacheKey]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  function startStream(force = false) {
    if (!force && !canRefreshDeepDive(cacheKey) && output) {
      setError('This category was already analyzed today. Use Regenerate to force a new analysis.');
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const myRequestId = ++requestIdRef.current;

    setOutput('');
    setError('');
    setCacheInfo(null);
    setStreaming(true);

    const prompt = buildDeepDivePrompt(category);
    let accum = '';

    streamLLM(
      prompt,
      (chunk) => {
        if (myRequestId !== requestIdRef.current) return;
        accum += chunk;
        setOutput(accum);
      },
      () => {
        if (myRequestId !== requestIdRef.current) return;
        setStreaming(false);
        if (accum) {
          setCacheInfo('Analysis cached until UTC midnight.');
        }
      },
      (e) => {
        if (myRequestId !== requestIdRef.current) return;
        setError(e);
        setStreaming(false);
      },
      controller.signal,
      cacheKey,
    );
  }

  function stopStream() {
    controllerRef.current?.abort();
    requestIdRef.current += 1;
    setStreaming(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Deep Dive</span>
        <span className="text-xs text-muted-foreground truncate">{category.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1 text-xs text-muted-foreground"
          onClick={onOpenSettings}
        >
          <Settings2 className="w-3 h-3" />
          Settings
        </Button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Streams a structured analysis covering <span className="text-foreground font-medium">supply-chain leverage</span>,{' '}
        <span className="text-foreground font-medium">product architecture</span>,{' '}
        <span className="text-foreground font-medium">GTM wedge</span>, and{' '}
        <span className="text-foreground font-medium">competitive moat</span>. Results refresh daily at UTC midnight.
      </p>

      {cacheInfo && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5">
          <Clock className="w-3 h-3" />
          {cacheInfo}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {!streaming && !output && (
          <Button
            size="sm"
            onClick={() => startStream(false)}
            className="h-7 text-xs gap-1.5"
            style={bucket ? { backgroundColor: bucket.color } : undefined}
          >
            <Play className="w-3 h-3" />
            Generate Deep Dive
          </Button>
        )}
        {streaming && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={stopStream}
          >
            <StopCircle className="w-3 h-3" />
            Stop
          </Button>
        )}
        {output && !streaming && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => startStream(true)}
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs gap-1"
            onClick={onOpenSettings}
          >
            <Settings2 className="w-3 h-3" />
            Configure API Key
          </Button>
        </div>
      )}

      {!output && !error && !streaming && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Generate a structured AI analysis for this category</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Uses server API keys from .env or browser AI Settings</p>
        </div>
      )}

      {(output || streaming) && (
        <div
          ref={scrollRef}
          className="max-h-96 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4"
        >
          <div className="llm-prose text-sm leading-relaxed text-foreground">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
          {streaming && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
      )}
    </div>
  );
}
