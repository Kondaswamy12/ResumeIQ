import { Card } from '@/components/ui/card';
import { Award, AlertCircle, Target, Layers } from 'lucide-react';
import type { ATSResult, RoleMatch } from '@/lib/atsScorer';

interface Props {
  atsResult: ATSResult | null;
  errors: any[];
  roleMatches: RoleMatch[] | null;
}

export function ResultsSummary({ atsResult, errors, roleMatches }: Props) {
  const topRole = roleMatches?.[0];
  const stats = [
    {
      icon: Award,
      label: 'ATS Score',
      value: atsResult ? `${atsResult.overallScore}%` : '—',
      tone: atsResult && atsResult.overallScore >= 70 ? 'success' : atsResult && atsResult.overallScore >= 40 ? 'warning' : 'destructive',
    },
    { icon: AlertCircle, label: 'Issues Found', value: errors.length.toString(), tone: errors.length === 0 ? 'success' : 'warning' },
    { icon: Target, label: 'Top Role', value: topRole?.role ?? '—', tone: 'primary' },
    { icon: Layers, label: 'Match Rate', value: topRole ? `${topRole.matchPercentage}%` : '—', tone: 'accent' },
  ] as const;

  const toneClass: Record<string, string> = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className="relative overflow-hidden p-4 hover:shadow-elegant transition-all animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1 truncate">{s.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass[s.tone]}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
