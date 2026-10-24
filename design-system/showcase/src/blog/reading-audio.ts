export type SoundScene = 'piano' | 'cloud' | 'rain';

/** Original pentatonic phrases, synthesized locally; the scheduler uses the audio clock. */
export class ReadingAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private dry?: GainNode;
  private wet?: GainNode;
  private reverb?: ConvolverNode;
  private rain?: AudioBufferSourceNode;
  private timer?: ReturnType<typeof setInterval>;
  private voices = new Set<OscillatorNode>();
  private nextTime = 0;
  private beat = 0;
  private level = 0.3;
  private scene: SoundScene = 'piano';
  private running = false;

  private init() {
    const ctx = new AudioContext();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 3;
    this.master.connect(compressor).connect(ctx.destination);
    this.dry = ctx.createGain(); this.dry.gain.value = 0.8;
    this.wet = ctx.createGain(); this.wet.gain.value = 0.24;
    this.reverb = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, ctx.sampleRate * 3, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    this.reverb.buffer = impulse;
    this.dry.connect(this.master);
    this.reverb.connect(this.wet).connect(this.master);
  }

  setVolume(value: number) {
    this.level = Math.max(0, Math.min(1, value));
    if (this.running && this.context && this.master) this.master.gain.setTargetAtTime(this.level * 0.65, this.context.currentTime, 0.15);
  }

  private note(midi: number, at: number, duration: number, amplitude: number, pan: number) {
    const ctx = this.context!;
    const cloud = this.scene === 'cloud';
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(amplitude, at + (cloud ? 0.8 : 0.018));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cloud ? 1100 : 2400;
    const stereo = ctx.createStereoPanner(); stereo.pan.value = pan;
    envelope.connect(filter).connect(stereo);
    stereo.connect(this.dry!); stereo.connect(this.reverb!);
    let remaining = 3;
    [1, 2, 3].forEach((partial, index) => {
      const tone = ctx.createOscillator();
      const harmonic = ctx.createGain();
      tone.type = 'sine'; tone.frequency.value = 440 * Math.pow(2, (midi - 69) / 12) * partial;
      harmonic.gain.value = [1, 0.18, 0.055][index];
      tone.connect(harmonic).connect(envelope);
      this.voices.add(tone);
      tone.onended = () => {
        this.voices.delete(tone); tone.disconnect(); harmonic.disconnect();
        if (--remaining === 0) { envelope.disconnect(); filter.disconnect(); stereo.disconnect(); }
      };
      tone.start(at); tone.stop(at + duration + 0.1);
    });
  }

  private schedule() {
    const ctx = this.context!;
    // Resume from the current clock after background timer throttling, without a burst of notes.
    this.nextTime = Math.max(this.nextTime, ctx.currentTime + 0.05);
    const melody = [72, 76, 79, 83, 79, 76, 74, 0, 72, 79, 81, 76, 74, 71, 72, 0, 76, 79, 84, 83, 79, 76, 74, 0, 71, 74, 79, 76, 74, 0, 72, 0];
    const chords = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
    while (this.nextTime < ctx.currentTime + 0.6) {
      const step = this.beat % melody.length;
      if (this.scene === 'cloud') {
        if (step % 8 === 0) chords[Math.floor(step / 8)].forEach((key, i) => this.note(key + 12, this.nextTime + i * 0.13, 7, 0.055, (i - 1) * 0.4));
      } else {
        const key = melody[step];
        if (key) this.note(key, this.nextTime, 3.8, this.scene === 'rain' ? 0.075 : 0.11, Math.sin(step * 0.8) * 0.35);
        if (step % 4 === 0) {
          const chord = chords[Math.floor(step / 8)];
          this.note(chord[(step / 4) % 3], this.nextTime, 5.2, 0.075, -0.25);
        }
      }
      this.beat++;
      this.nextTime += this.scene === 'cloud' ? 0.85 : 0.72;
    }
  }

  private startRain() {
    const ctx = this.context!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Repeatable, continuous low-level noise; the loop boundaries are crossfaded to zero.
    for (let i = 0; i < data.length; i++) {
      const edge = Math.min(1, i / 1500, (data.length - 1 - i) / 1500);
      data[i] = (Math.random() * 2 - 1) * edge;
    }
    const rain = ctx.createBufferSource(); rain.buffer = buffer; rain.loop = true;
    const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 1800;
    const high = ctx.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 380;
    const gain = ctx.createGain(); gain.gain.value = 0.07;
    rain.connect(low).connect(high).connect(gain).connect(this.master!);
    rain.onended = () => { rain.disconnect(); low.disconnect(); high.disconnect(); gain.disconnect(); };
    this.rain = rain; rain.start();
  }

  async play(scene: SoundScene) {
    if (!this.context) this.init();
    await this.context!.resume();
    if (this.context!.state !== 'running') throw new Error('Audio unavailable');
    this.scene = scene; this.running = true; this.beat = 0;
    this.nextTime = this.context!.currentTime + 0.1;
    this.master!.gain.cancelScheduledValues(this.context!.currentTime);
    this.master!.gain.setValueAtTime(0, this.context!.currentTime);
    this.master!.gain.linearRampToValueAtTime(this.level * 0.65, this.context!.currentTime + 1.2);
    if (scene === 'rain') this.startRain();
    this.schedule(); this.timer = setInterval(() => this.schedule(), 180);
  }

  async pause() {
    if (!this.context || !this.running) return;
    clearInterval(this.timer); this.running = false;
    const ctx = this.context;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    for (const voice of this.voices) voice.stop(ctx.currentTime + 0.65);
    this.rain?.stop(ctx.currentTime + 0.65); this.rain = undefined;
    await new Promise(resolve => setTimeout(resolve, 700));
    await ctx.suspend();
  }
}
