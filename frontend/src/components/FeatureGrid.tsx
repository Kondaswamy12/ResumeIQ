import { ScanLine, ShieldAlert, Target, Briefcase } from 'lucide-react';

const FEATURES = [
  { icon: ScanLine, title: 'ATS Scoring', desc: 'Keyword, section & format checks rolled into a single score.', tone: 'from-primary/20 to-primary/5' },
  { icon: ShieldAlert, title: 'Error Detection', desc: 'Catch typos, emojis and unprofessional symbols.', tone: 'from-destructive/20 to-destructive/5' },
  { icon: Target, title: 'Role Matching', desc: 'Compare against 10+ roles to find your strongest fit.', tone: 'from-accent/20 to-accent/5' },
  { icon: Briefcase, title: 'Skill Gaps', desc: 'See exactly which skills to add for your target role.', tone: 'from-chart-4/20 to-chart-4/5' },
];

export function FeatureGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`group rounded-xl border border-border bg-gradient-to-br ${f.tone} p-4 hover:shadow-elegant hover:-translate-y-0.5 transition-all animate-fade-in-up`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
