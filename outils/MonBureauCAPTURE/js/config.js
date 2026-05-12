/* MonBureauCAPTURE — Config */
const CONFIG = Object.freeze({
  APP_NAME: 'MonBureauCAPTURE',
  VERSION: '1.6.1',
  BUILD: '2025.05',

  ACCEPTED_EXT: ['webm','mp4','mov','mkv','avi','mp3','wav','m4a','aac','ogg','flac','opus'],

  SCREENSHOT_INTERVALS: [5, 10, 15, 30, 60, 120],
  DEFAULT_SCREENSHOT_INTERVAL: 30,

  SEGMENT_DURATIONS: [5, 10, 15, 20, 30, 45, 60],
  DEFAULT_SEGMENT_DURATION: 15,

  RECORDING_BITRATES: {
    low:    { v: 1_500_000,  a: 96_000,  label: 'Légère (≈ 0.7 Go/h)' },
    medium: { v: 3_000_000,  a: 128_000, label: 'Standard (≈ 1.4 Go/h)' },
    high:   { v: 6_000_000,  a: 192_000, label: 'Haute (≈ 2.7 Go/h)' },
  },
  DEFAULT_BITRATE: 'medium',

  PREFERRED_MIME_TYPES: [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ],

  PDF_QUALITY: 0.85,

  PRIVACY: [
    'Aucun fichier n\'est envoyé sur un serveur.',
    'Tout reste sur votre ordinateur.',
    'L\'app ne contient pas d\'IA.',
    'L\'app ne télécharge pas de vidéo depuis Internet.',
    'La conversion se lance avec un script local généré automatiquement.',
    'Le navigateur ne peut pas lancer ce script à votre place.',
    'L\'import dans NotebookLM est manuel.',
  ],

  IDB_NAME: 'monbureaucapture',
  IDB_VERSION: 1,
  IDB_STORE: 'sessions',
  PREFS_KEY: 'mbc_preferences',
});
