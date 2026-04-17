import { useState, useCallback } from 'react';

interface UseTranslationReturn {
  translate: (text: string) => Promise<string | null>;
  isTranslating: boolean;
  error: string | null;
}

export function useTranslation(): UseTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.translatedText) {
        return data.translatedText;
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err: any) {
      setError(`Translation failed: ${err.message}`);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating, error };
}