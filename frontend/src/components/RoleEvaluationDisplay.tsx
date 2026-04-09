import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, CheckCircle2, XCircle } from 'lucide-react';
import rolesData from '@/data/roles.json';
import type { RoleEvaluation } from '@/lib/atsScorer';

interface Props {
  evaluation: RoleEvaluation | null;
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function RoleEvaluationDisplay({ evaluation, selectedRole, onRoleChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Role-Based Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a target role" />
          </SelectTrigger>
          <SelectContent>
            {rolesData.map(r => (
              <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {evaluation && (
          <>
            <div className="text-center py-3">
              <div className="text-4xl font-bold text-foreground">{evaluation.overallScore}%</div>
              <p className="text-sm text-muted-foreground">Overall Fit Score</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Section Scores</p>
              {evaluation.sectionScores.map(s => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {s.found ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      {s.name}
                    </span>
                    <span className="font-semibold text-foreground">{s.score}%</span>
                  </div>
                  <Progress value={s.score} className="h-1.5" />
                </div>
              ))}
            </div>

            {evaluation.matchedSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Matched Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.matchedSkills.map(s => (
                    <Badge key={s} className="bg-success/15 text-success border-success/30">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {evaluation.missingSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" /> Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.missingSkills.map(s => (
                    <Badge key={s} variant="outline" className="text-destructive border-destructive/30">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!evaluation && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Select a role to see detailed evaluation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
