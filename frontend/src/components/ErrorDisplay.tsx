import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Type, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ErrorItem {
  type: 'grammar' | 'unprofessional';
  message: string;
  suggestions?: string[];
}

export function ErrorDisplay({ errors }: { errors: ErrorItem[] }) {

  // ✅ No issues
  if (!errors || errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-success" />
            Error Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="rounded-full bg-success/10 p-3 w-fit mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <p className="font-medium text-foreground">No issues found!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your resume looks clean and professional.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🔥 Split by type
  const grammarErrors = errors.filter(e => e.type === 'grammar');
  const unprofessionalErrors = errors.filter(e => e.type === 'unprofessional');

  // 🔥 Reusable Issue Card
  const IssueCard = ({
    err,
    index,
    type
  }: {
    err: ErrorItem;
    index: number;
    type: 'grammar' | 'unprofessional';
  }) => {
    const isGrammar = type === 'grammar';

    return (
      <div
        className={`
          relative border rounded-lg p-4 bg-muted/40
          ${isGrammar ? 'border-l-4 border-yellow-500' : 'border-l-4 border-red-500'}
        `}
      >
        <p className="text-xs text-muted-foreground mb-2">
          Issue {index + 1}
        </p>

        {/* Original */}
        <div className="flex items-start gap-2">
          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="text-sm font-medium text-destructive">
              "{err.message}"
            </p>
          </div>
        </div>

        {/* Suggestion */}
        {err.suggestions?.length > 0 && (
          <div className="flex items-start gap-2 mt-3">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Suggestion</p>
              <p className="text-sm font-medium text-success">
                {err.suggestions[0]}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-warning" />
          Error Detection
          <Badge variant="outline" className="ml-auto">
            {errors.length} issue{errors.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Grammar */}
        {grammarErrors.length > 0 && (
          <div>
            <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-yellow-600">
              <Type className="h-4 w-4" />
              Grammar Issues
            </p>

            <div className="space-y-3">
              {grammarErrors.map((err, i) => (
                <IssueCard key={i} err={err} index={i} type="grammar" />
              ))}
            </div>
          </div>
        )}

        {/* Unprofessional */}
        {unprofessionalErrors.length > 0 && (
          <div>
            <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Unprofessional Content
            </p>

            <div className="space-y-3">
              {unprofessionalErrors.map((err, i) => (
                <IssueCard key={i} err={err} index={i} type="unprofessional" />
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}