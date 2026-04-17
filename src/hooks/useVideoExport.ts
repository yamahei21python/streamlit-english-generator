import { useState, useCallback } from 'react';
import type { VideoSentenceSegment } from '@/lib/video/video-generator';

interface UseVideoExportReturn {
  exportMP4: (segments: VideoSentenceSegment[]) => Promise<void>;
  isExporting: boolean;
  progress: number;
  error: string | null;
}

export function useVideoExport(): UseVideoExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportMP4 = useCallback(async (segments: VideoSentenceSegment[]) => {
    if (segments.length === 0) return;

    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      const { VideoGenerator } = await import("@/lib/video/video-generator");
      const generator = new VideoGenerator({
        onProgress: (p: number) => setProgress(p)
      });

      const videoBlob = await generator.generate(segments);
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const yyyymmdd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      a.download = `FlashSpeak_${yyyymmdd}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  return { exportMP4, isExporting, progress, error };
}