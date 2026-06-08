import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LLMSettings, PROVIDER_PRESETS, loadLLMSettings, saveLLMSettings } from '@/lib/llm';
import { Eye, EyeOff, CheckCircle2, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LLMSettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<LLMSettings>(loadLLMSettings);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(loadLLMSettings());
      setSaved(false);
      setCleared(false);
    }
  }, [open]);

  function handleProviderChange(p: string) {
    const preset = PROVIDER_PRESETS[p];
    setSettings(s => ({
      ...s,
      provider: p as LLMSettings['provider'],
      baseUrl: preset.baseUrl,
      model: preset.model,
    }));
  }

  function handleSave() {
    saveLLMSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  function handleClearKey() {
    const next = { ...settings, apiKey: '' };
    setSettings(next);
    saveLLMSettings(next);
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>AI Deep-Dive Settings</SheetTitle>
          <SheetDescription className="text-xs">
            Configure your LLM provider for AI deep-dive analysis. When OPENROUTER_API_KEY
            and GEMINI_API_KEY are set in the server .env, deep dives use the server proxy
            automatically (keys never reach the browser). Browser keys below are a fallback.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={settings.provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>
                API Key
                {PROVIDER_PRESETS[settings.provider]?.keyOptional && (
                  <span className="text-muted-foreground font-normal"> (optional)</span>
                )}
              </Label>
              {settings.apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {cleared ? 'Cleared' : 'Clear key'}
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                placeholder={PROVIDER_PRESETS[settings.provider]?.keyOptional ? 'Leave blank for local server' : 'sk-...'}
                className="pr-9 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Model</Label>
            <Input
              value={settings.model}
              onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
              placeholder="gpt-4o"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Base URL</Label>
            <Input
              value={settings.baseUrl}
              onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              OpenAI-compatible endpoint — calls <code className="font-mono">/chat/completions</code>{' '}
              for OpenAI, OpenRouter, Gemini, Mistral, NVIDIA, Ollama, and custom URLs.
              When the Anthropic preset is selected, requests go to the native{' '}
              <code className="font-mono">/v1/messages</code> endpoint with Anthropic&apos;s
              <code className="font-mono"> x-api-key</code> header.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border">
          <Button onClick={handleSave} className="w-full gap-2">
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Settings'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
