import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResumeUploadProps {
  onFileUpload: (file: File) => void; 
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

export function ResumeUpload({ onFileUpload, isProcessing, setIsProcessing }: ResumeUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ UPDATED: no text extraction, only send file
  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      await onFileUpload(file); 
    } catch (e: any) {
      setError('Upload failed.');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUpload, setIsProcessing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  }, [processFile]);

  const clearFile = () => {
    setFileName(null);
    setError(null);
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-primary" />
          Upload Resume
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
            ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40'}
            ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground">Uploading {fileName}...</p>
            </div>
          ) : fileName ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <span className="font-medium text-foreground">{fileName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Drop your resume here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse — PDF / DOCX</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm mt-3 text-center">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}