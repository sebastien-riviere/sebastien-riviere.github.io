/* MonBureauCAPTURE — Scripts FFmpeg multi-OS */
const Scripts = {
  _input(s) {
    if (s?.file?.name) return s.file.name;
    if (s?.segments?.length) return 'segment_01.webm';
    return 'input.webm';
  },

  _base(s) { return this._input(s).replace(/\.[^.]+$/, ''); },

  list(s = Session.current()) {
    const input = this._input(s);
    const base = this._base(s);
    return [
      {
        id: 'mp3',
        title: 'Extraire en MP3',
        desc: 'Audio MP3 haute qualité (220 kbps).',
        cmd: `ffmpeg -i "${input}" -vn -c:a libmp3lame -q:a 2 "${base}.mp3"`,
      },
      {
        id: 'wav16k',
        title: 'WAV mono 16 kHz (transcription)',
        desc: 'Format optimal pour Whisper et autres moteurs de transcription.',
        cmd: `ffmpeg -i "${input}" -vn -ac 1 -ar 16000 -c:a pcm_s16le "${base}_16k.wav"`,
      },
      {
        id: 'mp4',
        title: 'Convertir en MP4 H.264',
        desc: 'MP4 universel compatible Mac, Windows, mobile.',
        cmd: `ffmpeg -i "${input}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k "${base}.mp4"`,
      },
      {
        id: 'segments15',
        title: 'Découper en segments de 15 minutes',
        desc: 'Sans réencodage — copie rapide.',
        cmd: `ffmpeg -i "${input}" -c copy -map 0 -segment_time 900 -f segment -reset_timestamps 1 "${base}_part_%02d.mp4"`,
      },
      {
        id: 'normalize',
        title: 'Normaliser le volume audio',
        desc: 'Égalise le niveau sonore (loudnorm EBU R128).',
        cmd: `ffmpeg -i "${input}" -af loudnorm=I=-16:TP=-1.5:LRA=11 "${base}_normalized.mp4"`,
      },
      {
        id: 'compress',
        title: 'Compresser fortement la vidéo',
        desc: 'Réduit fortement le poids — qualité moyenne (CRF 28).',
        cmd: `ffmpeg -i "${input}" -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 96k "${base}_compressed.mp4"`,
      },
      {
        id: 'gif',
        title: 'Créer un GIF animé (10s)',
        desc: 'Convertit les 10 premières secondes en GIF.',
        cmd: `ffmpeg -i "${input}" -t 10 -vf "fps=10,scale=480:-1:flags=lanczos" "${base}.gif"`,
      },
      {
        id: 'thumbnail',
        title: 'Miniature toutes les 30s',
        desc: 'Extrait une image toutes les 30 secondes.',
        cmd: `ffmpeg -i "${input}" -vf "fps=1/30" "${base}_thumb_%03d.jpg"`,
      },
    ];
  },

  buildBat(s = Session.current()) {
    const input = this._input(s);
    const base = this._base(s);
    const cmds = this.list(s);
    const lines = [
      `@echo off`,
      `chcp 65001 >nul`,
      `REM ===================================================`,
      `REM ${CONFIG.APP_NAME} v${CONFIG.VERSION} - Scripts FFmpeg Windows`,
      `REM Session : ${s?.id || 'N/A'}`,
      `REM Genere le : ${Utils.formatDateTime()}`,
      `REM ===================================================`,
      ``,
      `REM IMPORTANT :`,
      `REM 1. Placez ce fichier dans le meme dossier que "${input}"`,
      `REM 2. FFmpeg doit etre installe : https://ffmpeg.org/download.html`,
      `REM 3. Le navigateur ne peut pas lancer ce script a votre place.`,
      ``,
      `setlocal`,
      `set "INPUT=${input}"`,
      `set "BASE=${base}"`,
      ``,
      `if not exist "%INPUT%" (`,
      `  echo [ERREUR] Fichier "%INPUT%" introuvable.`,
      `  pause`,
      `  exit /b 1`,
      `)`,
      ``,
      `:menu`,
      `cls`,
      `echo =================================================`,
      `echo  ${CONFIG.APP_NAME} - Scripts FFmpeg`,
      `echo =================================================`,
      `echo  Fichier : %INPUT%`,
      `echo =================================================`,
      ...cmds.map((c, i) => `echo  [${i + 1}] ${c.title}`),
      `echo  [Q] Quitter`,
      `echo =================================================`,
      `set /p choice="Votre choix : "`,
      ``,
      ...cmds.map((c, i) => [
        `if "%choice%"=="${i + 1}" (`,
        `  echo.`,
        `  echo Execution : ${c.title}`,
        `  ${c.cmd}`,
        `  echo.`,
        `  pause`,
        `  goto menu`,
        `)`,
      ].join('\r\n')),
      ``,
      `if /i "%choice%"=="Q" exit /b 0`,
      `echo Choix invalide.`,
      `pause`,
      `goto menu`,
    ];
    return lines.join('\r\n');
  },

  buildSh(s = Session.current()) {
    const input = this._input(s);
    const base = this._base(s);
    const cmds = this.list(s);
    return [
      `#!/usr/bin/env bash`,
      `# ===================================================`,
      `# ${CONFIG.APP_NAME} v${CONFIG.VERSION} - Scripts FFmpeg Mac/Linux`,
      `# Session : ${s?.id || 'N/A'}`,
      `# Généré le : ${Utils.formatDateTime()}`,
      `# ===================================================`,
      ``,
      `# IMPORTANT :`,
      `# 1. Placez ce fichier dans le même dossier que "${input}"`,
      `# 2. Rendez-le exécutable : chmod +x $(basename "$0")`,
      `# 3. FFmpeg requis : https://ffmpeg.org/download.html`,
      `# 4. Le navigateur ne peut pas lancer ce script à votre place.`,
      ``,
      `set -e`,
      `INPUT="${input}"`,
      `BASE="${base}"`,
      ``,
      `if [ ! -f "$INPUT" ]; then`,
      `  echo "[ERREUR] Fichier $INPUT introuvable."`,
      `  exit 1`,
      `fi`,
      ``,
      `if ! command -v ffmpeg &> /dev/null; then`,
      `  echo "[ERREUR] FFmpeg n'est pas installé."`,
      `  echo "Installation Mac : brew install ffmpeg"`,
      `  echo "Installation Linux : sudo apt install ffmpeg"`,
      `  exit 1`,
      `fi`,
      ``,
      `while true; do`,
      `  clear`,
      `  echo "================================================="`,
      `  echo " ${CONFIG.APP_NAME} - Scripts FFmpeg"`,
      `  echo "================================================="`,
      `  echo " Fichier : $INPUT"`,
      `  echo "================================================="`,
      ...cmds.map((c, i) => `  echo " [${i + 1}] ${c.title}"`),
      `  echo " [q] Quitter"`,
      `  echo "================================================="`,
      `  read -p "Votre choix : " choice`,
      `  case $choice in`,
      ...cmds.map((c, i) => [
        `    ${i + 1})`,
        `      echo "Exécution : ${c.title}"`,
        `      ${c.cmd}`,
        `      read -p "Appuyez sur Entrée pour continuer..."`,
        `      ;;`,
      ].join('\n')),
      `    q|Q) exit 0 ;;`,
      `    *) echo "Choix invalide" ; sleep 1 ;;`,
      `  esac`,
      `done`,
    ].join('\n');
  },

  files(s = Session.current()) {
    return [
      { name: 'ffmpeg_windows.bat', content: this.buildBat(s) },
      { name: 'ffmpeg_mac_linux.sh', content: this.buildSh(s) },
    ];
  },

  downloadBat() {
    const s = Session.current(); if (!s) return;
    Utils.downloadText(this.buildBat(s), `${Utils.slug(s.title)}_ffmpeg_windows.bat`, 'text/plain');
    UI.toast('Script Windows téléchargé', 'success');
  },

  downloadSh() {
    const s = Session.current(); if (!s) return;
    Utils.downloadText(this.buildSh(s), `${Utils.slug(s.title)}_ffmpeg_mac_linux.sh`, 'text/plain');
    UI.toast('Script Mac/Linux téléchargé', 'success');
  },
};
