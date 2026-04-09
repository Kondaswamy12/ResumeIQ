import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import type { RoleMatch } from '@/lib/atsScorer';

export function RoleMatchDisplay({ matches }: { matches: RoleMatch[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Role Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((m) => {
          const color = m.matchPercentage >= 70 ? 'text-success' : m.matchPercentage >= 40 ? 'text-warning' : 'text-destructive';
          return (
            <div key={m.role} className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{m.role}</span>
                <span className={`font-bold text-sm ${color}`}>{m.matchPercentage}%</span>
              </div>
              <Progress value={m.matchPercentage} className="h-2" />
              <div className="flex flex-wrap gap-1">
                {m.matchedSkills.slice(0, 5).map(s => (
                  <Badge key={s} variant="outline" className="text-xs bg-success/10 text-success border-success/30">{s}</Badge>
                ))}
                {m.missingSkills.slice(0, 3).map(s => (
                  <Badge key={s} variant="outline" className="text-xs text-muted-foreground">{s}</Badge>
                ))}
                {m.matchedSkills.length + m.missingSkills.length > 8 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{m.matchedSkills.length + m.missingSkills.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
