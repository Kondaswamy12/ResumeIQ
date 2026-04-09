
import { useState, useCallback } from 'react';
import { ResumeUpload } from '@/components/ResumeUpload';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RoleMatchDisplay } from '@/components/RoleMatchDisplay';
import { RoleEvaluationDisplay } from '@/components/RoleEvaluationDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Search, Eye, EyeOff, Download } from 'lucide-react';

import { uploadResume } from '@/service/resume';
import { getRequest } from '@/service/api';
import { postRequest } from '@/service/post';
import { exportResultsToPdf } from '@/lib/exportPdf';

import type { ATSResult, RoleMatch, RoleEvaluation } from '@/lib/atsScorer';

// ---------- TYPES ----------
interface BackendError {
  message: string;
  error_text: string;
  suggestions: string[];
}

interface DetectedError {
  totalIssues: number;
  grammarErrors: BackendError[];
  unprofessionalIssues: BackendError[];
}

const Index = () => {
  const [resumeText, setResumeText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [errors, setErrors] = useState<DetectedError | null>(null);
  const [roleMatches, setRoleMatches] = useState<RoleMatch[] | null>(null);
  const [roleEval, setRoleEval] = useState<RoleEvaluation | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // ---------- FILE UPLOAD ----------
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);

      const data = await uploadResume(file);

      console.log("UPLOAD RESPONSE:", data); // 🔥 DEBUG

      setResumeText(data.full_text);
      setFileName(data.filename);
      setAtsResult(data.ats_score);

      // ✅ SAFE ERROR MAPPING
      const grammarErrors = data?.grammar_issues?.grammar_errors || [];
      const unprofessionalIssues = data?.grammar_issues?.unprofessional_issues || [];

      const totalIssues =
        grammarErrors.length + unprofessionalIssues.length;

      const errorData = {
        totalIssues,
        grammarErrors,
        unprofessionalIssues,
      };

      console.log("PROCESSED ERRORS:", errorData); // 🔥 DEBUG

      setErrors(errorData);

      setRoleMatches(null);
      setRoleEval(null);
      setSelectedRole('');

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ---------- ROLE MATCH ----------
  const runRoleMatch = useCallback(async () => {
    try {
      const data = await getRequest("http://127.0.0.1:8000/api/recommend-roles");

      const mapped: RoleMatch[] = data.recommended_roles.map((r: any) => ({
        role: r.role,
        matchPercentage: r.overall_score,
        matchedSkills: r.matched_skills,
        missingSkills: r.missing_skills,
      }));

      setRoleMatches(mapped);

    } catch (err) {
      console.error(err);
    }
  }, []);

  // ---------- ROLE EVALUATION ----------
  const handleRoleChange = useCallback(async (role: string) => {
    try {
      setSelectedRole(role);

      const data = await postRequest(
        "http://127.0.0.1:8000/api/evaluate-role",
        { role }
      );

      const ev = data.evaluation;

      const mapped: RoleEvaluation = {
        role: data.role,
        overallScore: ev.overall_score,
        sectionScores: ev.section_scores.map((s: any) => ({
          name: s.name,
          score: s.score,
          found: s.found,
        })),
        matchedSkills: ev.matched_skills,
        missingSkills: ev.missing_skills,
      };

      setRoleEval(mapped);

    } catch (err) {
      console.error(err);
    }
  }, []);

  // 🔥 CHECK IF ANY ERROR EXISTS
  const hasErrors =
    errors &&
    (errors.grammarErrors.length > 0 ||
      errors.unprofessionalIssues.length > 0);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ResumeIQ</h1>
              <p className="text-xs text-muted-foreground">Smart Resume Evaluation System</p>
            </div>
          </div>
          {fileName && (
            <Badge variant="secondary" className="gap-1.5">
              <FileText className="h-3 w-3" />
              {fileName}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Upload */}
        <div className="max-w-2xl mx-auto mb-8">
          <ResumeUpload
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

        {/* Actions */}
        {resumeText && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Button onClick={runRoleMatch} variant="secondary" size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Check Role Match
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="gap-1.5"
            >
              {showDebug ? <EyeOff /> : <Eye />}
              {showDebug ? 'Hide' : 'Show'} Extracted Text
            </Button>
          </div>
        )}

        {/* Debug */}
        {showDebug && resumeText && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Extracted Text (Debug)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted rounded-lg p-4 max-h-64 overflow-auto whitespace-pre-wrap font-mono">
                {resumeText}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(atsResult || roleMatches) && (
          <>
            {/* Export */}
            <div className="flex justify-end mb-4">
              <Button
                onClick={() =>
                  exportResultsToPdf({
                    fileName,
                    atsResult,
                    errors,
                    roleMatches,
                    roleEval,
                    selectedRole,
                  })
                }
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {atsResult && <ATSScoreDisplay result={atsResult} />}

              {/* ✅ FIXED ERROR DISPLAY */}
              {hasErrors && <ErrorDisplay errors={errors} />}

              {roleMatches && <RoleMatchDisplay matches={roleMatches} />}

              <RoleEvaluationDisplay
                evaluation={roleEval}
                selectedRole={selectedRole}
                onRoleChange={handleRoleChange}
              />
            </div>
          </>
        )}

        {/* Empty */}
        {!resumeText && (
          <div className="text-center py-16">
            <div className="rounded-full bg-primary/10 p-6 w-fit mx-auto mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Upload your resume to get started
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get ATS scoring, role matching, and evaluation using backend APIs.
            </p>
          </div>
        )}

      </main>
    </div>
  );
};

export default Index;

