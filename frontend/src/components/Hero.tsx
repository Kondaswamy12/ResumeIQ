import { Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { icon: TrendingUp, label: 'ATS Match Accuracy', value: '96%' },
  { icon: Zap, label: 'Avg. Analysis Time', value: '<5s' },
  { icon: Shield, label: 'Data Privacy', value: '100%' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Animated blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 rounded-full bg-chart-4/10 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
        <Badge variant="secondary" className="mb-5 gap-1.5 border border-primary/20 bg-primary/5 text-primary animate-fade-in">
          <Sparkles className="h-3 w-3" />
          AI-grade resume intelligence — runs entirely in your browser
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground animate-fade-in-up">
          Land interviews with a{' '}
          <span
            className="bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-transparent animate-gradient-x"
            style={{ backgroundSize: '200% 200%' }}
          >
            resume that scores
          </span>
        </h1>

        <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          Upload once, get an instant ATS breakdown, error checks, role matches and tailored recommendations — no signup required.
        </p>

        {/* Stats strip */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-glow transition-all animate-fade-in-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
