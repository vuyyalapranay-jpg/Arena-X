// src/game/core/SoundManager.ts
// ARENA X — PHASE 8: PROFESSIONAL AUDIO & CINEMATIC SOUND SYSTEM
// Multi-bus audio architecture: Master, Music, SFX, Character Voices, and Stage Ambience.
// Procedural Web Audio synthesizers + dynamic BGM + 16-fighter voice formant engine.

import { FighterId } from '../characters/RosterConfig';

export type VoiceLineType =
  | 'SELECT'
  | 'INTRO'
  | 'ROUND_START'
  | 'ATTACK_LIGHT'
  | 'ATTACK_HEAVY'
  | 'HURT_LIGHT'
  | 'HURT_HEAVY'
  | 'SPECIAL'
  | 'ULTIMATE'
  | 'VICTORY'
  | 'DEFEAT';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  ambienceVolume: number;
  isMuted: boolean;
}

const STORAGE_KEY = 'arena_x_audio_settings';

export class SoundManager {
  private ctx: AudioContext | null = null;

  // Multi-bus Gain Channels
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Current volume levels (0.0 to 1.0)
  private masterVol = 0.8;
  private musicVol = 0.65;
  private sfxVol = 0.85;
  private voiceVol = 0.9;
  private ambienceVol = 0.5;
  private isMuted = false;

  // Background Music state
  private currentBgmId: string | null = null;
  private bgmIntervalId: number | null = null;
  private activeBgmOscillators: OscillatorNode[] = [];
  private bgmCrossfadeTimer: number | null = null;

  // Stage Ambience state
  private activeAmbienceNodes: AudioNode[] = [];
  private currentAmbienceStage: string | null = null;

  // Anti-spam voice debounce per character (timestamp in ms)
  private lastVoiceTimestamp: Record<string, number> = {};

  constructor() {
    this.loadSettings();
    this.setupUnlockListeners();
  }

  // --- AUDIO CONTEXT INITIALIZATION & UNLOCK ---

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.initAudio();
      ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((event) => {
        window.removeEventListener(event, unlock);
      });
    };
    ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((event) => {
      window.addEventListener(event, unlock, { once: true });
    });
  }

  public initAudio(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.ctx = new AudioCtxClass();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVol,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);

      // Music channel
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Character Voice channel
      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.voiceVol, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      // Ambience channel
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceVol, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      return this.ctx;
    } catch (e) {
      console.warn('[SoundManager] Web Audio API failed to initialize:', e);
      return null;
    }
  }

  // --- VOLUME CONTROLS & PERSISTENCE ---

  private loadSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>;
        if (typeof parsed.masterVolume === 'number') this.masterVol = parsed.masterVolume;
        if (typeof parsed.musicVolume === 'number') this.musicVol = parsed.musicVolume;
        if (typeof parsed.sfxVolume === 'number') this.sfxVol = parsed.sfxVolume;
        if (typeof parsed.voiceVolume === 'number') this.voiceVol = parsed.voiceVolume;
        if (typeof parsed.ambienceVolume === 'number') this.ambienceVol = parsed.ambienceVolume;
        if (typeof parsed.isMuted === 'boolean') this.isMuted = parsed.isMuted;
      }
    } catch (e) {
      console.warn('[SoundManager] Could not read audio settings:', e);
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const settings: AudioSettings = {
        masterVolume: this.masterVol,
        musicVolume: this.musicVol,
        sfxVolume: this.sfxVol,
        voiceVolume: this.voiceVol,
        ambienceVolume: this.ambienceVol,
        isMuted: this.isMuted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SoundManager] Could not save audio settings:', e);
    }
  }

  public getSettings(): AudioSettings {
    return {
      masterVolume: this.masterVol,
      musicVolume: this.musicVol,
      sfxVolume: this.sfxVol,
      voiceVolume: this.voiceVol,
      ambienceVolume: this.ambienceVol,
      isMuted: this.isMuted,
    };
  }

  public setMasterVolume(val: number): void {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVol,
        this.ctx.currentTime
      );
    }
    this.saveSettings();
  }

  public setMusicVolume(val: number): void {
    this.musicVol = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setSfxVolume(val: number): void {
    this.sfxVol = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setVoiceVolume(val: number): void {
    this.voiceVol = Math.max(0, Math.min(1, val));
    if (this.voiceGain && this.ctx) {
      this.voiceGain.gain.setValueAtTime(this.voiceVol, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setAmbienceVolume(val: number): void {
    this.ambienceVol = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVol, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVol,
        this.ctx.currentTime
      );
    }
    this.saveSettings();
    return this.isMuted;
  }

  // --- DYNAMIC BACKGROUND MUSIC (BGM) SYSTEM ---

  public stopBGM(fadeDuration = 0.4): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.bgmCrossfadeTimer !== null) {
      clearTimeout(this.bgmCrossfadeTimer);
      this.bgmCrossfadeTimer = null;
    }

    if (this.musicGain && this.ctx && fadeDuration > 0) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
      setTimeout(() => {
        this.cleanupOscillators();
        if (this.musicGain && this.ctx) {
          this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
        }
      }, fadeDuration * 1000);
    } else {
      this.cleanupOscillators();
    }
    this.currentBgmId = null;
  }

  private cleanupOscillators(): void {
    this.activeBgmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeBgmOscillators = [];
  }

  public playMenuMusic(): void {
    if (this.currentBgmId === 'MENU') return;
    this.initAudio();
    if (!this.ctx || !this.musicGain) return;

    this.stopBGM(0.3);
    this.currentBgmId = 'MENU';

    // Cyberpunk Synthwave driving arpeggio chord progression: Am -> F -> C -> G
    const chords = [
      [220.0, 261.63, 329.63, 440.0], // A minor
      [174.61, 220.0, 261.63, 349.23], // F major
      [130.81, 164.81, 196.0, 261.63], // C major
      [196.0, 246.94, 293.66, 392.0], // G major
    ];

    let chordIdx = 0;
    let noteIdx = 0;

    const tick = () => {
      if (!this.ctx || !this.musicGain || this.currentBgmId !== 'MENU') return;

      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx];
      const freq = currentChord[noteIdx % currentChord.length];

      // Arpeggiator synth lead
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * (noteIdx % 2 === 0 ? 1 : 2), now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + (noteIdx % 4) * 300, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.18);

      // Bass note on first beat of chord
      if (noteIdx === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(currentChord[0] * 0.5, now);
        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.7);
      }

      noteIdx++;
      if (noteIdx >= 8) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    // 140 BPM 16th notes = ~107ms per tick
    this.bgmIntervalId = window.setInterval(tick, 108);
  }

  public playStageMusic(stageId: string): void {
    if (this.currentBgmId === stageId) return;
    this.initAudio();
    if (!this.ctx || !this.musicGain) return;

    this.stopBGM(0.4);
    this.currentBgmId = stageId;

    let baseFreqs: number[];
    let tempoMs: number;
    let waveType: OscillatorType;

    switch (stageId) {
      case 'VOLCANIC_BATTLEFIELD':
        // Heavy Industrial Metal - 160 BPM, Sawtooth low riff
        baseFreqs = [73.42, 82.41, 87.31, 98.0, 110.0, 73.42]; // D2 blues scale
        tempoMs = 94;
        waveType = 'sawtooth';
        break;

      case 'ANCIENT_TEMPLE':
        // Orchestral Taiko martial theme - 120 BPM, Pentatonic Japanese scale (Hirajoshi)
        baseFreqs = [220.0, 246.94, 261.63, 329.63, 349.23]; // A, B, C, E, F
        tempoMs = 125;
        waveType = 'sine';
        break;

      case 'FROZEN_WASTELAND':
        // Cold crystalline bell & sweeping sub-bass - 110 BPM
        baseFreqs = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
        tempoMs = 136;
        waveType = 'sine';
        break;

      case 'CYBERPUNK_ROOFTOP':
        // Dark club electro, syncopated bass - 135 BPM
        baseFreqs = [110.0, 130.81, 146.83, 164.81, 196.0];
        tempoMs = 111;
        waveType = 'square';
        break;

      case 'MYSTIC_FOREST':
        // Enchanted woodwinds & ambient bells - 115 BPM
        baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
        tempoMs = 130;
        waveType = 'triangle';
        break;

      case 'NEON_CITY':
      default:
        // Cyberpunk electro breakbeat - 130 BPM
        baseFreqs = [146.83, 174.61, 220.0, 261.63, 293.66]; // D minor
        tempoMs = 115;
        waveType = 'sawtooth';
        break;
    }

    let step = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain || this.currentBgmId !== stageId) return;
      const now = this.ctx.currentTime;
      const freq = baseFreqs[step % baseFreqs.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = stageId === 'VOLCANIC_BATTLEFIELD' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(stageId === 'VOLCANIC_BATTLEFIELD' ? 450 : 1200, now);

      const amp = stageId === 'VOLCANIC_BATTLEFIELD' ? 0.14 : 0.09;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + (tempoMs / 1000) * 1.8);

      // Percussive kick on 4th step
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

        kickGain.gain.setValueAtTime(0.24, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      step++;
    };

    this.bgmIntervalId = window.setInterval(tick, tempoMs);
  }

  public playVictoryMusic(): void {
    this.stopBGM(0.2);
    this.initAudio();
    if (!this.ctx || !this.musicGain) return;
    this.currentBgmId = 'VICTORY';

    // Heroic triumphant fanfare: C4, E4, G4, C5, with brass chord swell
    const notes = [261.63, 329.63, 392.0, 523.25];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const startTime = now + idx * 0.12;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startTime);
      osc.stop(startTime + 1.25);
    });
  }

  public playDefeatMusic(): void {
    this.stopBGM(0.2);
    this.initAudio();
    if (!this.ctx || !this.musicGain) return;
    this.currentBgmId = 'DEFEAT';

    // Somber minor cadence: Eb4, D4, C4, Ab3
    const notes = [311.13, 293.66, 261.63, 207.65];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const startTime = now + idx * 0.28;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  }

  // --- STAGE ENVIRONMENTAL AMBIENCE ---

  public playStageAmbience(stageId: string): void {
    if (this.currentAmbienceStage === stageId) return;
    this.initAudio();
    if (!this.ctx || !this.ambienceGain) return;

    this.stopStageAmbience();
    this.currentAmbienceStage = stageId;

    const duration = 2.5;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    switch (stageId) {
      case 'VOLCANIC_BATTLEFIELD':
        // Low bubbling magma & rumbling heat
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        break;

      case 'FROZEN_WASTELAND':
        // Howling wind & icy resonance
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        filter.Q.setValueAtTime(4.0, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        break;

      case 'NEON_CITY':
        // Rain droplets & cityscape roar
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        break;

      case 'CYBERPUNK_ROOFTOP':
        // High altitude gust & neon hum
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        break;

      case 'MYSTIC_FOREST':
        // Forest canopy shimmer & wind
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
        break;

      case 'ANCIENT_TEMPLE':
      default:
        // Mountain breeze & rustling leaves
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        break;
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);

    src.start();
    this.activeAmbienceNodes = [src, filter, gain];
  }

  public stopStageAmbience(): void {
    this.activeAmbienceNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioBufferSourceNode).stop === 'function') {
          (node as AudioBufferSourceNode).stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.activeAmbienceNodes = [];
    this.currentAmbienceStage = null;
  }

  // --- REUSABLE CHARACTER VOICE SYSTEM (ALL 16 FIGHTERS) ---

  public playVoiceLine(fighterId: FighterId | string, lineType: VoiceLineType): void {
    this.initAudio();
    if (!this.ctx || !this.voiceGain || this.isMuted) return;

    // Throttle voice lines per fighter (min 280ms between vocalisations)
    const upperId = (fighterId || 'KAI').toUpperCase();
    const nowMs = Date.now();
    const lastTime = this.lastVoiceTimestamp[upperId] || 0;
    if (nowMs - lastTime < 280 && lineType !== 'ULTIMATE' && lineType !== 'VICTORY') {
      return;
    }
    this.lastVoiceTimestamp[upperId] = nowMs;

    // Formant frequency configurations per fighter identity
    const profiles: Record<
      string,
      { basePitch: number; formants: [number, number]; wave: OscillatorType; timbre: number }
    > = {
      KAI: { basePitch: 240, formants: [800, 2200], wave: 'sawtooth', timbre: 1.0 }, // Sharp anime martial artist
      SHADOW: { basePitch: 140, formants: [450, 1600], wave: 'sawtooth', timbre: 0.8 }, // Deep ominous whisperer
      BLAZE: { basePitch: 190, formants: [650, 1900], wave: 'square', timbre: 1.2 }, // Fiery roaring brawler
      FROST: { basePitch: 220, formants: [900, 2600], wave: 'sine', timbre: 0.9 }, // Crisp calculated aristocrat
      VOLT: { basePitch: 280, formants: [1100, 3100], wave: 'sawtooth', timbre: 1.3 }, // Electric rapid youth
      TERRA: { basePitch: 105, formants: [350, 1200], wave: 'triangle', timbre: 1.4 }, // Deep earth colossus
      PHANTOM: { basePitch: 165, formants: [500, 1800], wave: 'sine', timbre: 0.7 }, // Spectral ethereal spirit
      RONIN: { basePitch: 155, formants: [550, 1700], wave: 'sawtooth', timbre: 1.1 }, // Stoic traditional kiai
      VIPER: { basePitch: 260, formants: [1000, 3400], wave: 'sawtooth', timbre: 0.85 }, // Sibilant deadly assassin
      TITAN: { basePitch: 95, formants: [300, 950], wave: 'triangle', timbre: 1.5 }, // Massive resonant juggernaut
      NOVA: { basePitch: 310, formants: [1200, 3500], wave: 'sine', timbre: 1.1 }, // Radiant cosmic youth
      REAPER: { basePitch: 115, formants: [400, 1400], wave: 'square', timbre: 1.0 }, // Harsh death warden
      AETHER: { basePitch: 250, formants: [850, 2800], wave: 'sine', timbre: 0.95 }, // Serene celestial sovereign
      RYUZEN: { basePitch: 150, formants: [500, 1600], wave: 'sawtooth', timbre: 1.3 }, // Draconic martial master
      ECLIPSE: { basePitch: 130, formants: [420, 1500], wave: 'sawtooth', timbre: 0.9 }, // Umbral shadow lord
      ZENITH: { basePitch: 200, formants: [700, 2400], wave: 'sawtooth', timbre: 1.05 }, // Apex cybernetic commander
    };

    const cfg = profiles[upperId] || profiles.KAI;
    const now = this.ctx.currentTime;

    // Pitch inflection & duration by line type
    let startPitch = cfg.basePitch;
    let endPitch = cfg.basePitch;
    let duration = 0.22;
    let amp = 0.35 * cfg.timbre;

    switch (lineType) {
      case 'SELECT':
        startPitch = cfg.basePitch * 0.9;
        endPitch = cfg.basePitch * 1.25;
        duration = 0.35;
        amp = 0.45;
        break;

      case 'INTRO':
      case 'ROUND_START':
        startPitch = cfg.basePitch * 1.1;
        endPitch = cfg.basePitch * 1.35;
        duration = 0.4;
        amp = 0.5;
        break;

      case 'ATTACK_LIGHT':
        startPitch = cfg.basePitch * 1.15;
        endPitch = cfg.basePitch * 0.95;
        duration = 0.12;
        amp = 0.28;
        break;

      case 'ATTACK_HEAVY':
        startPitch = cfg.basePitch * 1.4;
        endPitch = cfg.basePitch * 0.85;
        duration = 0.28;
        amp = 0.5;
        break;

      case 'HURT_LIGHT':
        startPitch = cfg.basePitch * 1.2;
        endPitch = cfg.basePitch * 0.9;
        duration = 0.14;
        amp = 0.32;
        break;

      case 'HURT_HEAVY':
        startPitch = cfg.basePitch * 1.35;
        endPitch = cfg.basePitch * 0.7;
        duration = 0.32;
        amp = 0.55;
        break;

      case 'SPECIAL':
        startPitch = cfg.basePitch * 1.25;
        endPitch = cfg.basePitch * 1.6;
        duration = 0.45;
        amp = 0.6;
        break;

      case 'ULTIMATE':
        startPitch = cfg.basePitch * 1.2;
        endPitch = cfg.basePitch * 2.1;
        duration = 0.75;
        amp = 0.75;
        break;

      case 'VICTORY':
        startPitch = cfg.basePitch * 1.0;
        endPitch = cfg.basePitch * 1.4;
        duration = 0.55;
        amp = 0.55;
        break;

      case 'DEFEAT':
        startPitch = cfg.basePitch * 1.1;
        endPitch = cfg.basePitch * 0.55;
        duration = 0.65;
        amp = 0.45;
        break;
    }

    // Two-formant vocal vocalization tract
    const osc = this.ctx.createOscillator();
    const f1 = this.ctx.createBiquadFilter();
    const f2 = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = cfg.wave;
    osc.frequency.setValueAtTime(startPitch, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endPitch), now + duration);

    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(cfg.formants[0], now);
    f1.Q.setValueAtTime(3.5, now);

    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(cfg.formants[1], now);
    f2.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(this.voiceGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // --- COMPREHENSIVE COMBAT SOUND EFFECTS ---

  public playPunchWhoosh(isHeavy = false): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = isHeavy ? 290 : 340;
    const endFreq = isHeavy ? 60 : 90;
    const duration = isHeavy ? 0.16 : 0.11;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHeavy ? 650 : 900, this.ctx.currentTime);

    gain.gain.setValueAtTime(isHeavy ? 0.45 : 0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playKickWhoosh(isHeavy = false): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isHeavy ? 360 : 420;
    const endFreq = isHeavy ? 45 : 70;
    const duration = isHeavy ? 0.22 : 0.16;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(isHeavy ? 0.5 : 0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playLightHit(pitchOffset = 0): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const baseFreq = 180 + pitchOffset * 20;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    // High snap
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
    noise.start(now);
    noise.stop(now + 0.05);
  }

  public playHeavyHit(pitchOffset = 0): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 + pitchOffset * 15, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    // Crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  public playPunchHit(): void {
    this.playHeavyHit();
  }

  public playKickHit(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.26);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(580, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playCounterHit(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Sharp counter metallic ring + heavy punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);

    this.playHeavyHit(2);
  }

  public playBlockClank(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.22);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playBlockClang(): void {
    this.playBlockClank();
  }

  public playGuardBreak(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Shattering high crunch + low drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

    gain.gain.setValueAtTime(0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playKnockdownImpact(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.32);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playWakeupRecovery(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playJump(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playLanding(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playDashWhoosh(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(95, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playSpecialAttack(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(820, this.ctx.currentTime + 0.32);

    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  public playEnergyCharge(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playProjectileLaunch(isKai = true): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isKai ? 'triangle' : 'sine';
    const startFreq = isKai ? 880 : 360;
    const endFreq = isKai ? 220 : 110;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.48, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playSurgeActivate(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(920, this.ctx.currentTime + 0.4);
    osc2.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.4);
    osc2.stop(this.ctx.currentTime + 0.4);
  }

  public playSubBassDrop(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Cinematic 40Hz -> 18Hz sub-bass drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(18, this.ctx.currentTime + 0.85);

    gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }

  public playCinematicImpact(): void {
    this.playSubBassDrop();
    this.playEnergyExplosion();
  }

  public playUltimateActivation(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    this.playSubBassDrop();

    // Cinematic chord crescendo
    const freqs = [130.81, 196.0, 261.63, 392.0, 523.25];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.65);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    });
  }

  public playEnergyExplosion(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.55);

    subGain.gain.setValueAtTime(0.95, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.55);

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.45);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start();
    whiteNoise.stop(this.ctx.currentTime + 0.45);
  }

  public playRoundStartGong(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  public playKOGong(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(75, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 1.5);
    osc2.stop(this.ctx.currentTime + 1.5);
  }

  public playMenuHover(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playMenuSelect(): void {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}

export const soundManager = new SoundManager();
