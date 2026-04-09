export interface BackendError {
  message: string;
  error_text: string;
  suggestions: string[];
}

export interface DetectedError {
  totalIssues: number;
  grammarErrors: BackendError[];
  unprofessionalIssues: BackendError[];
}
