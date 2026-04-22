import { useState, useCallback } from 'react';
import { ResumeUpload } from '@/components/ResumeUpload';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RoleMatchDisplay } from '@/components/RoleMatchDisplay';
import { RoleEvaluationDisplay } from '@/components/RoleEvaluationDisplay';
import { useEffect } from "react";

import { Hero } from '@/components/Hero';
import { SiteHeader } from '@/components/SiteHeader';
import { FeatureGrid } from '@/components/FeatureGrid';
import { ResultsSummary } from '@/components/ResultsSummary';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Search, Code2, Eye, EyeOff, Download, RotateCcw,FileText, Sparkles
} from 'lucide-react';

import { uploadResume } from '@/service/resume';
import { getRequest } from '@/service/api';
import { postRequest } from '@/service/post';
import { exportResultsToPdf } from '@/lib/exportPdf';

import type { ATSResult, RoleMatch, RoleEvaluation } from '@/lib/atsScorer';

const Index = () => {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [roleMatches, setRoleMatches] = useState<RoleMatch[] | null>(null);
  const [roleEval, setRoleEval] = useState<RoleEvaluation | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    const handleUnload = () => {
      if (resumeId) {
        navigator.sendBeacon(
          `https://resumeiq-606i.onrender.com.onrender.com/api/resume/${resumeId}`
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [resumeId]);

  
  const [overlay, setOverlay] = useState({
    open: false,
    title: '',
    subtitle: '',
    steps: [] as { icon: any; label: string }[],
  });

  

  
  const runWithOverlay = (
    config: {
      title: string;
      subtitle: string;
      steps: { icon: any; label: string }[];
      duration?: number;
    },
    action: () => Promise<void> | void
  ) => {
    setOverlay({
      open: true,
      title: config.title,
      subtitle: config.subtitle,
      steps: config.steps,
    });

    setTimeout(async () => {
      await action();
      setOverlay((o) => ({ ...o, open: false }));
    }, config.duration ?? 1100);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      const data = await uploadResume(file);
      setResumeId(data.resume_id);
      setResumeText(data.full_text);
      setFileName(data.filename);
      setAtsResult(data.ats_score);

      const grammar = data?.grammar_issues?.grammar_errors || [];
      const unprof = data?.grammar_issues?.unprofessional_issues || [];

      const formattedErrors = [
        ...grammar.map((e: any) => ({
          type: "grammar",
          message: e.error_text,
          suggestions: e.suggestions,
        })),
        ...unprof.map((e: any) => ({
          type: "unprofessional",
          message: e.error_text,
          suggestions: e.suggestions,
        })),
      ];

      setErrors(formattedErrors);

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const runRoleMatch = async () => {
    if (!resumeId) return;
    try {
      const data = await getRequest(`https://resumeiq-606i.onrender.com/api/recommend-roles/${resumeId}`);

      const mapped = data.recommended_roles.map((r: any) => ({
        role: r.role,
        matchPercentage: r.overall_score,
        matchedSkills: r.matched_skills || [],
        missingSkills: r.missing_skills || [],
      }));

      setRoleMatches(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const runAnalysis = () => {
    if (!resumeText) return;

    runWithOverlay(
      {
        title: "Analyzing Resume",
        subtitle: "Scanning and evaluating...",
        steps: [
          { icon: Code2, label: "Parsing resume" },
          { icon: Search, label: "Analyzing content" },
          { icon: Download, label: "Generating score" },
        ],
      },
      async () => {
        await runRoleMatch();
        setActiveTab('overview');
      }
    );
  };

  const handleRoleChange = async (role: string) => {
    if (!resumeId) return;
    setSelectedRole(role);

    const data = await postRequest(
      `https://resumeiq-606i.onrender.com/api/evaluate-role/${resumeId}`,
      { role }
    );

    const ev = data.evaluation;

    setRoleEval({
      role: data.role,
      overallScore: ev.overall_score,
      sectionScores: ev.section_scores,
      matchedSkills: ev.matched_skills,
      missingSkills: ev.missing_skills,
    });

    setActiveTab('evaluate');
  };

  const handleExportPdf = () => {
    runWithOverlay(
      {
        title: "Generating PDF",
        subtitle: "Preparing report...",
        steps: [
          { icon: Download, label: "Collecting data" },
          { icon: Code2, label: "Formatting report" },
          { icon: Search, label: "Finalizing file" },
        ],
      },
      () => {
        exportResultsToPdf({
          fileName, atsResult, errors, roleMatches, roleEval, selectedRole
        });
      }
    );
  };

  const resetAll = () => {
    runWithOverlay(
      {
        title: "Resetting",
        subtitle: "Clearing data...",
        steps: [
          { icon: RotateCcw, label: "Clearing state" },
          { icon: Search, label: "Resetting UI" },
        ],
        duration: 800,
      },
      
      () => {
        if (resumeId) {
        navigator.sendBeacon(
          `https://resumeiq-606i.onrender.com/api/resume/${resumeId}`
        );
      }
        setResumeId(null);
        setResumeText('');
        setFileName('');
        setAtsResult(null);
        setErrors([]);
        setRoleMatches(null);
        setRoleEval(null);
        setSelectedRole('');
      }
    );
  };

  const hasResults = !!roleMatches;

  return (
    <div className="min-h-screen bg-background">

      <SiteHeader fileName={fileName} />

      {/* 🔥 Overlay */}
      <ProcessingOverlay
        open={overlay.open}
        title={overlay.title}
        subtitle={overlay.subtitle}
        steps={overlay.steps}
      />

      {!resumeText && <Hero />}

      <main className="max-w-7xl mx-auto px-4 py-10">

        {!resumeText && <FeatureGrid />}

        <div className="max-w-2xl mx-auto mb-8">
          <ResumeUpload
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

        {resumeText && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">

            <Button onClick={runAnalysis} size="lg" className="gap-2 bg-gradient-primary shadow-glow">
              <Code2 className="h-4 w-4" />
              Analyze Resume
            </Button>

            <Button
              onClick={() =>
                runWithOverlay(
                  {
                    title: "Matching Roles",
                    subtitle: "Comparing with job roles...",
                    steps: [
                      { icon: Search, label: "Fetching roles" },
                      { icon: Code2, label: "Matching skills" },
                      { icon: Download, label: "Ranking matches" },
                    ],
                  },
                  async () => {
                    await runRoleMatch();
                    setActiveTab('roles');
                  }
                )
              }
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Check Role Match
            </Button>

            <Button onClick={handleExportPdf} variant="outline" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? <EyeOff /> : <Eye />}
            </Button>

            <Button onClick={resetAll} variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>

          </div>
        )}

        {showDebug && resumeText && (
          <Card className="mb-6">
        <CardHeader>
    <CardTitle className="text-sm">Extracted Text</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-xs space-y-1">
      {resumeText.split(" $n$ ").map((line, index) => (
        <p key={index} className="text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  </CardContent>
</Card>
        )}

        {hasResults && (
          <>
            <ResultsSummary atsResult={atsResult} errors={errors} roleMatches={roleMatches} />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 max-w-2xl mx-auto mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
  <div className="max-w-3xl mx-auto">
    {atsResult && <ATSScoreDisplay result={atsResult} />}
    {errors.length > 0 && <ErrorDisplay errors={errors} />}
  </div>
</TabsContent>

<TabsContent value="errors">
  <div className="max-w-3xl mx-auto">
    {errors.length > 0 ? (
      <ErrorDisplay errors={errors} />
    ) : (
      <Card className="p-6 text-center">No errors</Card>
    )}
  </div>
</TabsContent>

<TabsContent value="roles">
  <div className="max-w-3xl mx-auto">
    {roleMatches && <RoleMatchDisplay matches={roleMatches} />}
  </div>
</TabsContent>

<TabsContent value="evaluate">
  <div className="max-w-3xl mx-auto">
    <RoleEvaluationDisplay
      evaluation={roleEval}
      selectedRole={selectedRole}
      onRoleChange={handleRoleChange}
    />
  </div>
</TabsContent>

            </Tabs>
          </>
        )}
        

      {!resumeText && (
          <div className="text-center py-12 animate-fade-in">
            <div className="relative w-fit mx-auto mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative rounded-full bg-gradient-primary p-6 animate-float shadow-glow">
                <FileText className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Upload your resume to get started</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get instant ATS scoring, error detection, and role matching — all processed locally, no data leaves your browser.
            </p>
          </div>
        )}
      </main>
      

      <footer className="relative z-10 border-t border-border bg-bg/80 backdrop-blur-sm">
  <div className="mx-auto max-w-7xl px-6 py-12">

    <div className="grid gap-10 md:grid-cols-4">
      
      {/* New Logo + Description */}
      <div>
        <div className="flex items-start gap-3">
          
          {/* Logo Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-lg rounded-xl" />
            <div className="relative rounded-xl bg-gradient-primary p-2 shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>

          {/* Logo Text */}
          <div>
            <h1 className="text-lg font-bold text-text leading-tight">
              ResumeIQ
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-text/60">
              Smart Resume Evaluation System
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-text/70 leading-relaxed">
          Smart resume feedback to help students land their first big role.
        </p>
      </div>

      {/* Columns */}
      {[
        { title: "Product", items: ["Resume Score", "Templates", "ATS Checker", "Job Match"] },
        { title: "Resources", items: ["Resume Tips", "Sample Resumes", "Career Blog", "Internship Guide"] },
        { title: "Company", items: ["About", "Privacy", "Terms", "Contact"] },
      ].map((col) => (
        <div key={col.title}>
          <div className="text-sm font-semibold text-text">
            {col.title}
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {col.items.map((item) => (
              <li
                key={item}
                className="cursor-pointer text-text/70 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* Bottom Bar */}
    <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-6 text-sm text-text/60">
      <div>
        © {new Date().getFullYear()} ResumeIQ. All rights reserved.
      </div>

      {/* Optional Socials */}
      <div className="flex items-center gap-4">
        <span className="cursor-pointer hover:text-primary transition">Twitter</span>
        <span className="cursor-pointer hover:text-primary transition">LinkedIn</span>
        <span className="cursor-pointer hover:text-primary transition">GitHub</span>
      </div>
    </div>

  </div>
</footer>
    </div>
  );
};

export default Index;
