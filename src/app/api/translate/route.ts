import { NextRequest, NextResponse } from 'next/server';
import translate from 'google-translate-api-x';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    // 改行で分割して、空行をスキップして一括翻訳する
    const lines = text.split('\n').map((l: string) => l.trim());
    const validLines = lines.filter((l: string) => l.length > 0);
    
    if (validLines.length === 0) {
      return NextResponse.json({ translatedText: '' });
    }
    
    // 日本語から英語へ翻訳
    const res = await translate(validLines, { to: 'en' });
    const results = Array.isArray(res) ? res.map(r => r.text) : [res.text];
    
    // 元の改行を復元する
    let translatedIndex = 0;
    const finalLines = lines.map((l: string) => {
      if (l.length === 0) return '';
      return results[translatedIndex++];
    });

    return NextResponse.json({ translatedText: finalLines.join('\n') });
    
  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
  }
}
