

export interface ATSResult {
  overallScore: number;
  keywordScore: number;
  sectionScore: number;
  formattingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  foundSections: string[];
  missingSections: string[];
  formattingIssues: string[];
}

export interface RoleMatch {
  role: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface SectionScore {
  name: string;
  score: number;
  found: boolean;
}

export interface RoleEvaluation {
  role: string;
  overallScore: number;
  sectionScores: SectionScore[];
  matchedSkills: string[];
  missingSkills: string[];
}

