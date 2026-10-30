/**
 * OVA SENA - Reproductor de Audio / Podcast Pedagógico
 * Incorpora Web Audio API con síntesis armónica cálida para emulación sonora
 * y control total de reproducción, barra de avance, volumen y formas de onda.
 */

class PedagogicalAudioPlayer {
  constructor(options = {}) {
    this.totalDuration = options.duration || 195; // 3 min 15 seg
    this.currentTime = 0;
    this.isPlaying = false;
    this.volume = 0.8;
    this.onTimeUpdate = options.onTimeUpdate || null;
    this.onStateChange = options.onStateChange || null;

    this.audioContext = null;
    this.gainNode = null;
    this.oscillatorNodes = [];
    this.timerInterval = null;
    this.isMuted = false;
  }

  initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        this.gainNode.connect(this.audioContext.destination);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  play() {
    this.initAudioContext();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startSyntheticAcousticBed();

    this.timerInterval = setInterval(() => {
      this.currentTime += 1;
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = this.totalDuration;
        this.pause();
      }
      if (typeof this.onTimeUpdate === 'function') {
        this.onTimeUpdate(this.currentTime, this.totalDuration);
      }
    }, 1000);

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(true);
    }
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    this.stopSyntheticAcousticBed();

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(false);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(seconds) {
    this.currentTime = Math.max(0, Math.min(seconds, this.totalDuration));
    if (typeof this.onTimeUpdate === 'function') {
      this.onTimeUpdate(this.currentTime, this.totalDuration);
    }
  }

  skip(seconds) {
    this.seek(this.currentTime + seconds);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  // Generador de tono acústico ambiental cálido para emular audio real sin dependencias externas
  startSyntheticAcousticBed() {
    if (!this.audioContext) return;
    try {
      this.stopSyntheticAcousticBed();
      const now = this.audioContext.currentTime;

      // Acorde armónico sutil y relajante (Do mayor con novena: 130.81Hz, 196Hz, 293.66Hz)
      const freqs = [130.81, 196.00, 293.66];
      freqs.forEach((freq, harmonicIndex) => {
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Amplitud muy suave y envolvente
        const targetVolume = (0.015 / (harmonicIndex + 1));
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.exponentialRampToValueAtTime(targetVolume, now + 1.2);

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start(now);

        this.oscillatorNodes.push({ osc, gain: oscGain });
      });
    } catch (e) {
      console.warn("Audio synthetic context note:", e);
    }
  }

  stopSyntheticAcousticBed() {
    if (!this.audioContext) return;
    try {
      const now = this.audioContext.currentTime;
      this.oscillatorNodes.forEach(({ osc, gain }) => {
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          setTimeout(() => {
            try { osc.stop(); osc.disconnect(); } catch (err) {}
          }, 350);
        } catch (err) {}
      });
      this.oscillatorNodes = [];
    } catch (e) {}
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainderSeconds.toString().padStart(2, '0')}`;
  }
}

// Exportar globalmente
if (typeof window !== "undefined") {
  window.PedagogicalAudioPlayer = PedagogicalAudioPlayer;
}
