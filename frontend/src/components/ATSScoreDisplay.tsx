import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, FileCheck } from 'lucide-react';
import type { ATSResult } from '@/lib/atsScorer';

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'hsl(var(--success))' : score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground">{score}%</span>
      </div>
    </div>
  );
}

function SubScore({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className={`h-4 w-4 ${color}`} />
          {label}
        </span>
        <span className="font-semibold text-foreground">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

export function ATSScoreDisplay({ result }: { result: ATSResult }) {

  
  const uniqueMatched = Array.from(new Set(result.matchedKeywords));
  const uniqueMissing = Array.from(new Set(result.missingKeywords));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-primary" />
          ATS Score
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-8">
          <ScoreRing score={result.overallScore} />

          <div className="flex-1 space-y-3">
            <SubScore label="Keywords" score={result.keywordScore} icon={CheckCircle2} />
            <SubScore label="Sections" score={result.sectionScore} icon={AlertTriangle} />
            <SubScore label="Formatting" score={result.formattingScore} icon={XCircle} />
          </div>
        </div>

        
        {uniqueMatched.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Matched Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueMatched.map((k, index) => (
                <Badge
                  key={`${k}-${index}`} 
                  variant="default"
                  className="bg-success/15 text-success border-success/30 hover:bg-success/20"
                >
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {uniqueMissing.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Missing Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueMissing.map((k, index) => (
                <Badge
                  key={`${k}-${index}`} 
                  variant="outline"
                  className="text-destructive border-destructive/30"
                >
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Formatting Issues */}
        {result.formattingIssues.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Formatting Issues</p>
            <ul className="space-y-1">
              {result.formattingIssues.map((issue, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}