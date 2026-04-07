import { NextRequest, NextResponse } from 'next/server';
import { Communicate } from 'edge-tts-universal';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const voice = searchParams.get('voice') || 'ja-JP-NanamiNeural';

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    const communicate = new Communicate(text, { voice });
    const stream = communicate.stream();
    
    // 音声バイナリデータのみを抽出して蓄積する
    const audioChunks: Buffer[] = [];
    for await (const chunk of stream) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }
    
    if (audioChunks.length === 0) {
      throw new Error('No audio data received from TTS service');
    }

    // すべての音声バイナリを結合
    const buffer = Buffer.concat(audioChunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 });
  }
}
