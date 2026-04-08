import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } from 'mediabunny';

export interface VideoSentenceSegment {
  type: 'jp' | 'en' | 'silence';
  jp: string;
  en: string;
  audioUrl?: string;
  duration?: number; // ms
}

export interface VideoGenOptions {
  width?: number;
  height?: number;
  fps?: number;
  onProgress?: (progress: number) => void;
}

export class VideoGenerator {
  public width: number;
  public height: number;
  public fps: number;
  private onProgress?: (progress: number) => void;

  constructor(options: VideoGenOptions = {}) {
    this.width = options.width || 1280;
    this.height = options.height || 720;
    this.fps = options.fps || 30;
    this.onProgress = options.onProgress;
  }

  /**
   * Fetches an MP3 from a URL and decodes it into an AudioBuffer.
   */
  private async decodeAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();
    return audioBuffer;
  }

  /**
   * Concatenates multiple AudioBuffers into one.
   */
  private mergeAudioBuffers(buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer {
    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const out = ctx.createBuffer(
      buffers[0].numberOfChannels,
      totalLength,
      buffers[0].sampleRate
    );

    let offset = 0;
    for (const b of buffers) {
      for (let i = 0; i < b.numberOfChannels; i++) {
        out.getChannelData(i).set(b.getChannelData(i), offset);
      }
      offset += b.length;
    }
    return out;
  }

  public async generate(segments: VideoSentenceSegment[]): Promise<Blob> {
    if (typeof window === 'undefined') throw new Error('Browser environment required');

    // 1. Prepare Audio
    const audioBuffers: AudioBuffer[] = [];
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      this.onProgress?.((i / segments.length) * 0.2);

      if (segment.audioUrl) {
        const buffer = await this.decodeAudio(segment.audioUrl);
        audioBuffers.push(buffer);
      } else if (segment.duration) {
        // Create silence buffer
        const silentBuffer = audioCtx.createBuffer(1, (segment.duration / 1000) * audioCtx.sampleRate, audioCtx.sampleRate);
        audioBuffers.push(silentBuffer);
      }
    }
    const finalAudio = this.mergeAudioBuffers(audioBuffers, audioCtx);
    await audioCtx.close();

    // 2. Setup Mediabunny Output
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: target,
    });

    // 3. Setup Video Source (Canvas)
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const videoSource = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: 2_500_000,
    });
    output.addVideoTrack(videoSource);

    // 4. Setup Audio Source
    const audioSource = new AudioBufferSource({
      codec: 'aac',
      bitrate: 128_000,
    });
    output.addAudioTrack(audioSource);

    // 5. Start Encoding
    await output.start();

    // Add audio data first (or in parallel)
    await audioSource.add(finalAudio);
    audioSource.close();

    let currentFrame = 0;
    let currentPairIndex = 0;
    let framesInCurrentSentence = 0;
    let lastActiveType: 'jp' | 'en' | null = null;

    // Estimate total frames for progress
    const totalFrames = Math.ceil(finalAudio.duration * this.fps);
    const frameGap = 1 / this.fps;

    // Rendering Loop
    while (currentFrame < totalFrames) {
      const segment = segments[currentPairIndex];
      const audioBuffer = audioBuffers[currentPairIndex];
      const sentenceDurationInFrames = Math.ceil(audioBuffer.duration * this.fps);

      // Update last active type if not silence
      if (segment.type === 'jp' || segment.type === 'en') {
        lastActiveType = segment.type;
      }

      // Draw frame
      this.drawFrame(ctx, segment.en, segment.jp, segment.type, lastActiveType);
      
      // Feed frame to Mediabunny (timestamp and duration in seconds)
      await videoSource.add(currentFrame * frameGap, frameGap);

      currentFrame++;
      framesInCurrentSentence++;

      if (framesInCurrentSentence >= sentenceDurationInFrames && currentPairIndex < segments.length - 1) {
        currentPairIndex++;
        framesInCurrentSentence = 0;
      }

      if (currentFrame % 10 === 0) {
        this.onProgress?.(0.2 + (currentFrame / totalFrames) * 0.8);
      }
    }

    videoSource.close();
    await output.finalize();
    this.onProgress?.(1.0);

    if (!target.buffer) throw new Error('Failed to generate video buffer');
    return new Blob([target.buffer], { type: 'video/mp4' });
  }

  private drawFrame(ctx: CanvasRenderingContext2D, en: string, jp: string, type: 'jp' | 'en' | 'silence', lastActiveType: 'jp' | 'en' | null) {
    // Background: Dark Gradient matching app aesthetic
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Accent Line (Top) - Changes color based on phase
    ctx.fillStyle = type === 'jp' ? '#666666' : type === 'en' ? '#0a72ef' : '#333333';
    ctx.fillRect(0, 0, this.width, 4);

    // English Text (Center)
    const enActive = type === 'en' || (type === 'silence' && lastActiveType === 'en');
    const jpActive = type === 'jp' || (type === 'silence' && lastActiveType === 'jp');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Render English
    ctx.fillStyle = enActive ? 'white' : '#555555';
    ctx.font = enActive ? 'bold 72px Inter, sans-serif' : '500 48px Inter, sans-serif';
    this.fillWrappedText(ctx, en, this.width / 2, this.height / 2 - 40, this.width * 0.8, enActive ? 85 : 60);

    // Render Japanese
    ctx.fillStyle = jpActive ? 'white' : '#555555';
    ctx.font = jpActive ? 'bold 48px sans-serif' : '500 32px sans-serif';
    ctx.fillText(jp, this.width / 2, this.height / 2 + 120);
  }

  private fillWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], x, startY + k * lineHeight);
    }
  }
}
