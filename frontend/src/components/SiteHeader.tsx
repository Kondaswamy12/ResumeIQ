import { Sparkles, FileText, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function SiteHeader({ fileName }: { fileName?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  return (
    <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-lg rounded-xl" />
            <div className="relative rounded-xl bg-gradient-primary p-2 shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">ResumeIQ</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Smart Resume Evaluation System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fileName && (
            <Badge variant="secondary" className="hidden sm:flex gap-1.5 max-w-[200px] truncate">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{fileName}</span>
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
