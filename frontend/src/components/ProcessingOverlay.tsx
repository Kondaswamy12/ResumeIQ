import { useEffect, useState } from 'react';
import { FileSearch, ScanLine, Brain, Sparkles, CheckCircle2, type LucideIcon } from 'lucide-react';

type Step = { icon: LucideIcon; label: string };

const DEFAULT_STEPS: Step[] = [
  { icon: FileSearch, label: 'Parsing resume content' },
  { icon: ScanLine, label: 'Scanning for keywords & sections' },
  { icon: Brain, label: 'Computing ATS score' },
  { icon: Sparkles, label: 'Finalizing insights' },
];

interface ProcessingOverlayProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  steps?: Step[];
}

export function ProcessingOverlay({
  open,
  title = 'Analyzing your resume',
  subtitle = 'Hang tight, this only takes a moment…',
  steps = DEFAULT_STEPS,
}: ProcessingOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    const id = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 200);
    return () => clearInterval(id);
  }, [open, steps.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border bg-card/90 p-8 shadow-elegant animate-scale-in">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse-glow" />
            <div className="relative h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center animate-float">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < step;
            const isActive = i === step;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                  isActive
                    ? 'border-primary/40 bg-primary/5 shadow-glow'
                    : isDone
                    ? 'border-success/30 bg-success/5'
                    : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-success text-success-foreground' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />}
                </div>
                <span className={`text-sm flex-1 ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
                {isActive && (
                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-primary animate-[shimmer_1.2s_linear_infinite]" style={{ backgroundSize: '200% 100%' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
