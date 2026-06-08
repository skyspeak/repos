import { useState, useEffect } from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import HeatmapPage from '@/pages/HeatmapPage';
import MethodologyPage from '@/pages/MethodologyPage';
import JobsPage from '@/pages/JobsPage';
import SourcesPage from '@/pages/SourcesPage';
import InvestmentHome from '@/pages/investment-home';
import InvestmentHistory from '@/pages/investment-history';
import InvestmentDetail from '@/pages/investment-detail';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CATEGORIES from '@/data/categories';
import { fetchAppConfig } from '@/lib/llm';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HeatmapPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/sources" component={SourcesPage} />
      <Route path="/methodology" component={MethodologyPage} />
      <Route path="/investment" component={InvestmentHome} />
      <Route path="/investment/history" component={InvestmentHistory} />
      <Route path="/investment/analysis/:id" component={InvestmentDetail} />
    </Switch>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('heatmap-dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('heatmap-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    fetchAppConfig();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
          <main className="min-h-[calc(100vh-8rem)]">
            <Router />
          </main>
          <Footer
            totalCategories={CATEGORIES.length}
            lastUpdated={CATEGORIES.map(c => c.lastUpdated).sort().reverse()[0]}
          />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
