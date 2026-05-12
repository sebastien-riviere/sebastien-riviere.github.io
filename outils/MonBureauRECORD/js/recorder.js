/* MonBureauRECORD — Capture live (getDisplayMedia + MediaRecorder) */
const Recorder = {
  _stream: null,
  _displayStream: null,
  _audioCtx: null,
  _recorder: null,
  _chunks: [],
  _segmentTimer: null,
  _timerInterval: null,
  _autoShotInterval: null,
  _segmentIndex: 0,
  _startTime: 0,
  _pausedAt: 0,
  _totalPaused: 0,
  _segmentMinutes: 15,
  _bitrate: 'medium',

  async start(options = {}) {
    if (State.get('isRecording')) return false;

    const {
      withMic = false,
      segmentMinutes = CONFIG.DEFAULT_SEGMENT_DURATION,
      bitrate = CONFIG.DEFAULT_BITRATE,
      autoShot = false,
      autoShotInterval = CONFIG.DEFAULT_SCREENSHOT_INTERVAL,
    } = options;

    this._segmentMinutes = segmentMinutes;
    this._bitrate = bitrate;

    // 1. Display stream
    let displayStream;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
    } catch (err) {
      throw new Error(err.name === 'NotAllowedError'
        ? 'Accès à l\'écran refusé. Autorisez le partage pour continuer.'
        : 'Impossible de démarrer la capture : ' + err.message);
    }

    this._displayStream = displayStream;
    let finalStream = displayStream;

    // 2. Mix microphone si demandé + audio système
    const hasSystemAudio = displayStream.getAudioTracks().length > 0;

    if (withMic) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (hasSystemAudio) {
          // Mix both audio sources
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          this._audioCtx = ctx;
          const dest = ctx.createMediaStreamDestination();
          ctx.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks())).connect(dest);
          ctx.createMediaStreamSource(micStream).connect(dest);
          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } else {
          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
        }
      } catch (err) {
        UI.toast('Micro non accessible — capture sans micro.', 'warning');
      }
    }

    this._stream = finalStream;

    // 3. Init session
    Session.create('capture');
    this._segmentIndex = 0;
    this._startTime = Date.now();
    this._totalPaused = 0;
    this._pausedAt = 0;

    State.set({ isRecording: true, isPaused: false, elapsed: 0 });

    // 4. Start segment
    this._startSegment();

    // 5. Timer
    this._timerInterval = setInterval(() => {
      if (State.get('isPaused')) return;
      const el = Math.floor((Date.now() - this._startTime - this._totalPaused) / 1000);
      State.set({ elapsed: el });
      UI.updateTimer(el);
    }, 500);

    // 6. Auto screenshot
    if (autoShot) {
      this._autoShotInterval = setInterval(() => {
        if (State.get('isRecording') && !State.get('isPaused')) {
          this.takeScreenshot();
        }
      }, autoShotInterval * 1000);
      State.set({ autoScreenshot: true });
    }

    // 7. End on user stop sharing
    displayStream.getVideoTracks()[0].addEventListener('ended', () => this.stop());

    return true;
  },

  _startSegment() {
    const mime = Utils.getSupportedMime();
    const br = CONFIG.RECORDING_BITRATES[this._bitrate];
    this._chunks = [];

    const opts = {
      mimeType: mime,
      videoBitsPerSecond: br.v,
      audioBitsPerSecond: br.a,
    };

    try {
      this._recorder = new MediaRecorder(this._stream, opts);
    } catch {
      this._recorder = new MediaRecorder(this._stream);
    }

    this._recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };

    this._recorder.onstop = () => {
      const blob = new Blob(this._chunks, { type: this._recorder.mimeType || 'video/webm' });
      Session.addSegment(blob, this._segmentIndex, this._segmentMinutes * 60);
      UI.updateSegments();
      UI.updateStats();
    };

    this._recorder.start(1000);

    this._segmentTimer = setTimeout(() => {
      if (State.get('isRecording') && this._recorder.state !== 'inactive') {
        this._recorder.stop();
        this._segmentIndex++;
        UI.toast(`Segment ${this._segmentIndex} sauvegardé`, 'success');
        if (State.get('isRecording')) this._startSegment();
      }
    }, this._segmentMinutes * 60 * 1000);
  },

  pause() {
    if (!State.get('isRecording') || State.get('isPaused')) return;
    if (this._recorder?.state === 'recording') this._recorder.pause();
    this._pausedAt = Date.now();
    State.set({ isPaused: true });
    UI.toast('Capture en pause', 'info');
  },

  resume() {
    if (!State.get('isRecording') || !State.get('isPaused')) return;
    if (this._recorder?.state === 'paused') this._recorder.resume();
    this._totalPaused += Date.now() - this._pausedAt;
    State.set({ isPaused: false });
    UI.toast('Capture reprise', 'success');
  },

  async stop() {
    if (!State.get('isRecording')) return;
    State.set({ isRecording: false, isPaused: false });

    clearTimeout(this._segmentTimer);
    clearInterval(this._timerInterval);
    if (this._autoShotInterval) clearInterval(this._autoShotInterval);

    if (this._recorder && this._recorder.state !== 'inactive') {
      try { this._recorder.stop(); } catch {}
    }
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
    if (this._displayStream) this._displayStream.getTracks().forEach(t => t.stop());
    if (this._audioCtx) { try { await this._audioCtx.close(); } catch {} }

    const elapsed = Math.floor((Date.now() - this._startTime - this._totalPaused) / 1000);
    Session.setDuration(elapsed);

    // Petit délai pour que onstop finisse
    setTimeout(() => {
      State.set({ canExport: true });
      UI.goto('postprocess');
      UI.toast('Capture terminée', 'success');
    }, 600);
  },

  takeScreenshot() {
    const video = document.getElementById('cockpitPreview');
    if (!video || !video.videoWidth) {
      UI.toast('Capture impossible — flux non prêt.', 'warning');
      return null;
    }
    const dataUrl = Utils.snapshotVideo(video, CONFIG.PDF_QUALITY);
    if (!dataUrl) return null;
    const elapsed = State.get('elapsed');
    const shot = Session.addScreenshot(dataUrl, elapsed);
    UI.addShotToCockpit(shot);
    UI.updateStats();
    return shot;
  },
};
