import { Link, useLocation } from 'wouter';
import { Moon, Sun, Settings2, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LLMSettingsModal from './LLMSettingsModal';

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ darkMode, onToggleDark }: Props) {
  const [location] = useLocation();
  const [llmOpen, setLlmOpen] = useState(false);

  const isInvestment = location.startsWith('/investment');

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-4">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Disruptor</span>
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">2025</span>
          </div>

          <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Heatmap
            </Link>
            <Link
              href="/jobs"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location === '/jobs' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/sources"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location === '/sources' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Sources
            </Link>
            <Link
              href="/methodology"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location === '/methodology' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Methodology
            </Link>
            <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
            <Link
              href="/investment"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isInvestment ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Investment
            </Link>
            {isInvestment && (
              <Link
                href="/investment/history"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  location === '/investment/history' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                History
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground text-xs hidden sm:flex"
              onClick={() => setLlmOpen(true)}
            >
              <Settings2 className="w-3.5 h-3.5" />
              AI Settings
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setLlmOpen(true)}
              title="AI Settings"
            >
              <Settings2 className="w-4 h-4 sm:hidden" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleDark}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>
      <LLMSettingsModal open={llmOpen} onClose={() => setLlmOpen(false)} />
    </>
  );
}
