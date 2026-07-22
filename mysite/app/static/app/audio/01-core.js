let audioCtx, analyser, source, processor, gainNode, mediaDest, silentGain;
let raf;
let currentEstimatedPitch = null;
let noteHistory = [];
let scoreEvents = [];
let currentScoreEvent = null;
let captureStartTime = 0;
let lastDetectedNote = null;
let noteDisplay = null;
let referencePlaybackId = 0;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const controls = document.getElementById('controls');
const monitor = document.getElementById('monitor');
const meterFill = document.querySelector('#meter>div');
const canvas = document.getElementById('spectrum');
const ctx = canvas.getContext('2d');
const suggestList = document.getElementById('suggestList');
const recStart = document.getElementById('recStart');
const recStop = document.getElementById('recStop');
const dlList = document.getElementById('dlList');
const pitchLabel = document.getElementById('pitch');
const centsLabel = document.getElementById('cents');
const currentNoteSummary = document.getElementById('currentNoteSummary');
const practiceStatusDetails = document.getElementById('practiceStatusDetails');
const pitchSummary = document.getElementById('pitchSummary');
const centsSummary = document.getElementById('centsSummary');
const targetSummary = document.getElementById('targetSummary');
const tuningMeter = document.getElementById('tuningMeter');
const tuningRow = document.getElementById('tuningRow');
const tuningNeedle = document.getElementById('tuningNeedle');
const stabilityLabel = document.getElementById('stability');
const recordingAnalysis = document.getElementById('recordingAnalysis');
const listenRef = document.getElementById('listenRef');
const reference = document.getElementById('reference');
const scoreContainer = document.getElementById('scoreContainer');
const exportMusicXMLBtn = document.getElementById('exportMusicXMLBtn');
const exportMidiBtn = document.getElementById('exportMidiBtn');
const playScoreBtn = document.getElementById('playScoreBtn');
const clearScoreBtn = document.getElementById('clearScoreBtn');
const transcriptionBpm = document.getElementById('transcriptionBpm');
const transcriptionMeter = document.getElementById('transcriptionMeter');
const transcriptionInstrument = document.getElementById('transcriptionInstrument');
const transcriptionKey = document.getElementById('transcriptionKey');
const transcriptionDetectedKey = document.getElementById('transcriptionDetectedKey');
const transcriptionTitle = document.getElementById('transcriptionTitle');
const startTranscriptionBtn = document.getElementById('startTranscriptionBtn');
const stopTranscriptionBtn = document.getElementById('stopTranscriptionBtn');
const playTranscriptionBtn = document.getElementById('playTranscriptionBtn');
const playTranscriptionKeyBtn = document.getElementById('playTranscriptionKeyBtn');
const clearTranscriptionBtn = document.getElementById('clearTranscriptionBtn');
const saveTranscriptionBtn = document.getElementById('saveTranscriptionBtn');
const saveTranscriptionPdfBtn = document.getElementById('saveTranscriptionPdfBtn');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const studentScoreContainer = document.getElementById('studentScoreContainer');
const transcriptionEditor = document.getElementById('transcriptionEditor');
const transcriptionEditSelection = document.getElementById('transcriptionEditSelection');
const transcriptionNoteList = document.getElementById('transcriptionNoteList');
const transcriptionSemitoneDown = document.getElementById('transcriptionSemitoneDown');
const transcriptionNaturalNote = document.getElementById('transcriptionNaturalNote');
const transcriptionSemitoneUp = document.getElementById('transcriptionSemitoneUp');
const transcriptionOctaveDown = document.getElementById('transcriptionOctaveDown');
const transcriptionOctaveUp = document.getElementById('transcriptionOctaveUp');
const transcriptionDeleteNote = document.getElementById('transcriptionDeleteNote');
const transcriptionDurationTools = Array.from(document.querySelectorAll('.transcription-duration-tool'));
// exercise UI
const exerciseSelect = document.getElementById('exerciseSelect');
const startExerciseBtn = document.getElementById('startExerciseBtn');
const stopExerciseBtn = document.getElementById('stopExerciseBtn');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const feedbackList = document.getElementById('feedbackList');
const sessionList = document.getElementById('sessionList');
const syncLocalDataBtn = document.getElementById('syncLocalDataBtn');
const syncStatusEl = document.getElementById('syncStatus');
// metronome + target elements
const metronomeBpm = document.getElementById('metronomeBpm');
const startMetronomeBtn = document.getElementById('startMetronomeBtn');
const stopMetronomeBtn = document.getElementById('stopMetronomeBtn');
const targetNoteSelect = document.getElementById('targetNote');
const toleranceCentsInput = document.getElementById('toleranceCents');
const targetMatchEl = document.getElementById('targetMatch');
const beginnerExercise = document.getElementById('beginnerExercise');
const beginnerInstrument = document.getElementById('beginnerInstrument');
const beginnerTargetNote = document.getElementById('beginnerTargetNote');
const beginnerBpm = document.getElementById('beginnerBpm');
const beginnerStartBtn = document.getElementById('beginnerStartBtn');
const beginnerStopBtn = document.getElementById('beginnerStopBtn');
const beginnerRepeatBtn = document.getElementById('beginnerRepeatBtn');
const beginnerReferenceBtn = document.getElementById('beginnerReferenceBtn');
const beginnerMetronomeBtn = document.getElementById('beginnerMetronomeBtn');
const perceptionControls = document.getElementById('perceptionControls');
const perceptionKey = document.getElementById('perceptionKey');
const perceptionScale = document.getElementById('perceptionScale');
const perceptionPattern = document.getElementById('perceptionPattern');
const worshipSaxReferenceBtn = document.getElementById('worshipSaxReferenceBtn');
const calibrateMicBtn = document.getElementById('calibrateMicBtn');
const calibrationStatus = document.getElementById('calibrationStatus');
const beginnerLight = document.getElementById('beginnerLight');
const beginnerMessage = document.getElementById('beginnerMessage');
const beginnerProgressFill = document.getElementById('beginnerProgressFill');
const beginnerProgressText = document.getElementById('beginnerProgressText');
const beginnerBestText = document.getElementById('beginnerBestText');
const routineStepTitle = document.getElementById('routineStepTitle');
const routineStepHelp = document.getElementById('routineStepHelp');
const routineSequence = document.getElementById('routineSequence');
const routinePrevBtn = document.getElementById('routinePrevBtn');
const routineNextBtn = document.getElementById('routineNextBtn');
const advancedToggle = document.getElementById('advancedToggle');
const advancedTools = document.getElementById('advancedTools');
const chordSheetUrl = document.getElementById('chordSheetUrl');
const fetchChordSheetBtn = document.getElementById('fetchChordSheetBtn');
const chordSheetInput = document.getElementById('chordSheetInput');
const arrangementBuilder = document.getElementById('arrangementBuilder');
const arrangementBpm = document.getElementById('arrangementBpm');
const arrangementStyle = document.getElementById('arrangementStyle');
const analyzeChordSheetBtn = document.getElementById('analyzeChordSheetBtn');
const playArrangementBtn = document.getElementById('playArrangementBtn');
const useArrangementPracticeBtn = document.getElementById('useArrangementPracticeBtn');
const arrangementSummary = document.getElementById('arrangementSummary');
const arrangementChords = document.getElementById('arrangementChords');
const arrangementNotes = document.getElementById('arrangementNotes');
const melodicCipher = document.getElementById('melodicCipher');
const lyricMelodyBuilder = document.getElementById('lyricMelodyBuilder');
const lyricMelodyInput = document.getElementById('lyricMelodyInput');
const renderLyricMelodyBtn = document.getElementById('renderLyricMelodyBtn');
const playLyricMelodyBtn = document.getElementById('playLyricMelodyBtn');
const practiceLyricMelodyBtn = document.getElementById('practiceLyricMelodyBtn');
const lyricMelodyOutput = document.getElementById('lyricMelodyOutput');
const readingExecutionBuilder = document.getElementById('readingExecutionBuilder');
const transcriptionBuilder = document.getElementById('transcriptionBuilder');
const readingLevel = document.getElementById('readingLevel');
const readingKey = document.getElementById('readingKey');
const readingMeter = document.getElementById('readingMeter');
const readingBpm = document.getElementById('readingBpm');
const readingPitchTheory = document.getElementById('readingPitchTheory');
const readingRhythmTheory = document.getElementById('readingRhythmTheory');
const readingFunctionTheory = document.getElementById('readingFunctionTheory');
const readingScoreSvg = document.getElementById('readingScoreSvg');
const readingNotes = document.getElementById('readingNotes');
const readingSummary = document.getElementById('readingSummary');
const readingPageNav = document.getElementById('readingPageNav');
const readingPrevPageBtn = document.getElementById('readingPrevPageBtn');
const readingNextPageBtn = document.getElementById('readingNextPageBtn');
const readingPageStatus = document.getElementById('readingPageStatus');
const generateReadingExerciseBtn = document.getElementById('generateReadingExerciseBtn');
const playReadingExerciseBtn = document.getElementById('playReadingExerciseBtn');
const playReadingPageBtn = document.getElementById('playReadingPageBtn');
const pauseReadingBtn = document.getElementById('pauseReadingBtn');
const stopReadingBtn = document.getElementById('stopReadingBtn');
const repeatReadingBtn = document.getElementById('repeatReadingBtn');
const readingPlaybackTime = document.getElementById('readingPlaybackTime');
const readingProgressFill = document.getElementById('readingProgressFill');
const readingProgress = document.getElementById('readingProgress');
const readingToolbarBpm = document.getElementById('readingToolbarBpm');
const readingBpmMinus = document.getElementById('readingBpmMinus');
const readingBpmPlus = document.getElementById('readingBpmPlus');
const readingFullscreen = document.getElementById('readingFullscreen');
const scorePlayerShell = document.getElementById('scorePlayerShell');
const readingStudyModeBtn = document.getElementById('readingStudyModeBtn');
const readingOriginalModeBtn = document.getElementById('readingOriginalModeBtn');
const toggleExecutionViewBtn = document.getElementById('toggleExecutionViewBtn');
const readingOriginalView = document.getElementById('readingOriginalView');
const practiceReadingExerciseBtn = document.getElementById('practiceReadingExerciseBtn');
const scoreFileInput = document.getElementById('scoreFileInput');
const importScoreBtn = document.getElementById('importScoreBtn');
const captureScoreBtn = document.getElementById('captureScoreBtn');
const scoreCameraInput = document.getElementById('scoreCameraInput');
const scoreImportStatus = document.getElementById('scoreImportStatus');
const savedScoreTitle = document.getElementById('savedScoreTitle');
const saveScoreLibraryBtn = document.getElementById('saveScoreLibraryBtn');
const savedScoreStatus = document.getElementById('savedScoreStatus');
const savedScoresList = document.getElementById('savedScoresList');
const exercises = document.getElementById('exercises');
const labelCollection = document.getElementById('labelCollection');
const downloads = document.getElementById('downloads');
const suggestions = document.getElementById('suggestions');
const stageButtons = Array.from(document.querySelectorAll('[data-stage-target]'));
const openStageButtons = Array.from(document.querySelectorAll('[data-open-stage]'));
const practiceExerciseButtons = Array.from(document.querySelectorAll('[data-practice-exercise]'));
const progressOverview = document.getElementById('progressOverview');
const profilePanel = document.getElementById('profilePanel');
const advancedEntry = document.getElementById('advancedEntry');
const progressSyncBtn = document.getElementById('progressSyncBtn');
const progressSyncStatus = document.getElementById('progressSyncStatus');
const profileInstrumentLabel = document.getElementById('profileInstrumentLabel');
const profileInstrumentBtn = document.getElementById('profileInstrumentBtn');
const profileCalibrateBtn = document.getElementById('profileCalibrateBtn');
const profileAdvancedBtn = document.getElementById('profileAdvancedBtn');
const dashboardPage = document.querySelector('.dashboard-page');

function resizeCanvas(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function updateDashboardSummary(note, pitch, centsText){
  if(note && practiceStatusDetails) practiceStatusDetails.open = true;
  if(currentNoteSummary) currentNoteSummary.textContent = note || '--';
  if(pitchSummary) pitchSummary.textContent = pitch ? pitch.toFixed(1) : '--';
  if(centsSummary) centsSummary.textContent = centsText || '--';
  if(targetSummary){
    const target = beginnerTargetNote && beginnerTargetNote.value
      ? beginnerTargetNote.value
      : (targetNoteSelect && targetNoteSelect.value ? targetNoteSelect.value : 'Iniciante');
    targetSummary.textContent = target;
  }
}

function compactStageElements(){
  const allAdvanced = advancedTools ? Array.from(advancedTools.children) : [];
  const scorePanel = scoreContainer ? scoreContainer.parentElement : null;
  const pitchPanel = pitchLabel ? pitchLabel.parentElement : null;
  const notePanel = document.getElementById('currentNote') ? document.getElementById('currentNote').parentElement : null;
  const realtimeTitle = document.getElementById('realtime') ? document.getElementById('realtime').previousElementSibling : null;
  const recordingPanel = recordingAnalysis ? recordingAnalysis.parentElement : null;
  const livePanels = [
    meterFill ? meterFill.parentElement : null,
    canvas,
    realtimeTitle,
    document.getElementById('realtime'),
    pitchPanel,
    notePanel,
    tuningRow,
    scorePanel,
    reference,
  ];
  const progressPanels = [progressOverview, downloads, suggestions, recordingPanel].filter(Boolean);
  const profilePanels = [profilePanel].filter(Boolean);
  const dedicatedPanels = [
    arrangementBuilder, lyricMelodyBuilder, readingExecutionBuilder, transcriptionBuilder,
    ...progressPanels, ...profilePanels,
  ].filter(Boolean);
  const advancedPanels = allAdvanced.filter(el => !dedicatedPanels.includes(el));
  return {
    allAdvanced,
    stages: {
      practice: [document.getElementById('beginnerPanel')],
      repertoire: [arrangementBuilder, lyricMelodyBuilder],
      reading: [readingExecutionBuilder],
      transcription: [transcriptionBuilder],
      live: livePanels,
      progress: progressPanels,
      profile: profilePanels,
      advanced: advancedPanels,
    },
  };
}

function showAppStage(stageName){
  const {allAdvanced, stages} = compactStageElements();
  const beginnerPanel = document.getElementById('beginnerPanel');
  if(beginnerPanel) beginnerPanel.classList.add('stage-hidden');
  allAdvanced.forEach(el => el.classList.add('stage-hidden'));
  const activeStage = stages[stageName] || stages.practice;
  activeStage.forEach(el => {
    if(el) el.classList.remove('stage-hidden');
  });
  if(advancedTools){
    const usesAdvanced = activeStage.some(el => allAdvanced.includes(el));
    advancedTools.classList.toggle('stage-hidden', !usesAdvanced);
  }
  stageButtons.forEach(btn => {
    const active = btn.dataset.stageTarget === stageName;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  if(dashboardPage){
    ['practice','repertoire','progress','profile','reading','transcription','advanced'].forEach(name=>{
      dashboardPage.classList.toggle(`stage-${name}`, name === stageName);
    });
  }
  resizeCanvas();
}

stageButtons.forEach(btn => {
  btn.addEventListener('click', () => showAppStage(btn.dataset.stageTarget || 'practice'));
});
openStageButtons.forEach(btn => {
  btn.addEventListener('click', ()=>showAppStage(btn.dataset.openStage || 'practice'));
});
practiceExerciseButtons.forEach(btn => {
  btn.addEventListener('click', ()=>{
    if(beginnerExercise){
      beginnerExercise.value = btn.dataset.practiceExercise || 'routine_level_1';
      beginnerExercise.dispatchEvent(new Event('change'));
    }
    showAppStage('practice');
  });
});

let pitchHistory = [];
let workletNode, recordedFrames = [], recordingFlag = false;
// realtime feature UI elements
const rmsFillEl = document.getElementById('rmsFill');
const centroidValEl = document.getElementById('centroidVal');
const fluxValEl = document.getElementById('fluxVal');
const hnrValEl = document.getElementById('hnrVal');
const attackValEl = document.getElementById('attackVal');
const specCanvas = document.getElementById('spectrogram');
const specCtx = specCanvas ? specCanvas.getContext('2d') : null;
let specWriteX = 0;
let prevMagnitudes = null;
let prevRms = 0;
let exerciseActive = false;
let sessionSnapshots = [];
let sessionsStoreKey = 'sax_practice_sessions_v1';
let metronomeIntervalId = null;
let beginnerActive = false;
let beginnerGoalSeconds = 5;
let beginnerHoldStart = null;
let beginnerBestHold = 0;
let beginnerRoutineIndex = 0;
let beginnerTimerId = null;
let beginnerTimerStart = null;
let beginnerScaleIndex = 0;
let beginnerAttemptFrames = 0;
let beginnerCorrectFrames = 0;
let beginnerMistakeFrames = 0;
let beginnerCompletedNotes = 0;
let beginnerExerciseStartedAt = 0;
let missedPitchFrames = 0;
let latestRms = 0;
let calibrationMode = null;
let calibrationSamples = [];
let calibrationTimer = null;
let calibratedNoiseRms = 0.0015;
let calibratedNoteRms = 0.003;
let currentArrangement = null;
let currentLyricMelody = null;
let currentReadingExercise = null;
let readingScorePage = 0;
let readingOsmd = null;
let readingOsmdRenderPromise = null;
let readingOsmdRenderToken = 0;
let readingPlaybackRunning = false;
let readingPlaybackPaused = false;
let readingRepeatEnabled = false;
let readingScoreZoom = 1;
let readingPlaybackSessionId = 0;
let readingActiveStartIndex = 0;
let readingActiveEndIndex = 0;
let readingTimelineStartIndex = 0;
let activeReferencePlaybackBus = null;
let studentTranscriptionOsmd = null;
let lastMicrophoneFrameAt = 0;
let microphoneWatchdogTimer = null;
let lastMicrophoneDiagnosticAt = 0;
let transcriptionActive = false;
let transcriptionCandidateNote = null;
let transcriptionCandidateFrames = 0;
let transcriptionPeakRms = 0;
let transcriptionAttackArmed = false;
let selectedTranscriptionNoteIndex = -1;
let detectedTranscriptionKey = '';

let MIN_NOTE_RMS = 0.003;
let SILENCE_RMS = 0.0015;
const MIN_PITCH_HZ = 45;
const MAX_PITCH_HZ = 1200;
const REFERENCE_TONE_GAIN = 0.45;
const TRANSCRIPTION_PLAYBACK_GAIN = 0.40;
const READING_SCORE_PAGE_SIZE = 24;
const referenceReverbBuses = new WeakMap();

const beginnerRoutine = [
  {
    title: '1. Respiracao',
    mode: 'timer',
    seconds: 8,
    target: 'G4',
    bpm: 60,
    help: 'Respire pela boca sem desfazer a embocadura. Comece com 8 tempos, depois tente 6, 4 e 2.'
  },
  {
    title: '2. Represa e liberacao',
    mode: 'timer',
    seconds: 8,
    target: 'G4',
    bpm: 60,
    help: 'Sopre com a lingua segurando a palheta, sinta a pressao do ar e depois libere sem empurrar.'
  },
  {
    title: '3. Nota longa - Sol medio',
    mode: 'hold',
    seconds: 5,
    target: 'G4',
    bpm: 60,
    help: 'Ouça a referencia e mantenha Sol afinado por 5 segundos.'
  },
  {
    title: '4. Nota longa articulada',
    mode: 'hold',
    seconds: 5,
    target: 'G4',
    bpm: 40,
    metronome: true,
    help: 'Use 40 bpm. Toque Sol com ataques limpos, sem perder o apoio do ar.'
  },
  {
    title: '5. Escala de 5 notas - Sol maior',
    mode: 'scale',
    seconds: 0.6,
    target: 'G4',
    bpm: 40,
    sequence: ['G4','A4','B4','C5','D5','C5','B4','A4','G4'],
    labels: ['Sol','La','Si','Do','Re','Do','Si','La','Sol'],
    help: 'Toque uma nota por vez. Quando acertar, o alvo avanca para a proxima nota.'
  }
];

const beginnerStandaloneExercises = {
  challenge_2_f: {
    title: 'Desafio 2 - Fa maior',
    mode: 'scale',
    seconds: 0.45,
    target: 'F4',
    bpm: 50,
    sequence: ['F4','G4','A4','A#4','C5','D5','E5','F5','G5','A5','A#5','A5','G5','F5','E5','D5','C5','A#4','A4','G4','F4','E4','D4','C4','D4','E4','F4'],
    labels: ['Fa','Sol','La','Sib','Do','Re','Mi','Fa','Sol','La','Sib','La','Sol','Fa','Mi','Re','Do','Sib','La','Sol','Fa','Mi','Re','Do','Re','Mi','Fa'],
    help: 'Articule sempre com "ri". Antes de tocar: respire, represe e libere a nota.'
  },
  challenge_2_g: {
    title: 'Desafio 2 - Sol maior',
    mode: 'scale',
    seconds: 0.45,
    target: 'G4',
    bpm: 50,
    sequence: ['G4','A4','B4','C5','D5','E5','F#5','G5','A5','B5','C6','B5','A5','G5','F#5','E5','D5','C5','B4','A4','G4','F#4','E4','D4','E4','F#4','G4'],
    labels: ['Sol','La','Si','Do','Re','Mi','Fa#','Sol','La','Si','Do','Si','La','Sol','Fa#','Mi','Re','Do','Si','La','Sol','Fa#','Mi','Re','Mi','Fa#','Sol'],
    help: 'Escala de Sol maior articulada com "ri". Prepare cada entrada: respire, represe e libere.'
  },
  perception_f: {
    title: 'Percepcao - Fa maior',
    mode: 'scale',
    seconds: 0.55,
    target: 'F4',
    bpm: 45,
    sequence: ['F4','G4','A4','A#4','C5','D5','E5','F5','C5','D5','E5','G5','A5','C6'],
    labels: ['Fa','Sol','La','Sib','Do','Re','Mi','Fa','Do','Re','Mi','Sol','La','Do'],
    help: 'Ouça a referencia e repita. O foco aqui e perceber a distancia entre as notas antes de tocar.'
  },
  perception_g: {
    title: 'Percepcao - Sol maior',
    mode: 'scale',
    seconds: 0.55,
    target: 'G4',
    bpm: 45,
    sequence: ['G4','A4','B4','C5','D5','E5','F#5','G5','D5','E5','F#5','A5','B5','D6'],
    labels: ['Sol','La','Si','Do','Re','Mi','Fa#','Sol','Re','Mi','Fa#','La','Si','Re'],
    help: 'Exercicio de percepcao em Sol maior. Primeiro ouca, depois reproduza uma nota por vez.'
  }
};

const perceptionPatterns = {
  up_down: ['1','2','3','5','6','5','3','2','1'],
  jump: ['1','3','2','5','6','3','2','6','1'],
  response: ['3','5','6','3','5','3','2','6','1'],
  blues_line: ['1','3b','3','5','6','5','3b','2','1'],
  music_lick_1: ['6','5','2','1','6','5','3'],
  music_lick_2: ['3','1','2','3','2','1'],
  music_lick_3: ['5','2','1','5','2','1','6','5','1'],
  worship_approach: ['5','6','5','3','2','1'],
  worship_response: ['1','2','3','5','3','2','1'],
  worship_closure: ['3','5','6','5','3','1'],
  worship_call: ['6','5','3','2','3','5','1']
};

const perceptionPatternNames = {
  up_down: 'Subida e volta',
  jump: 'Saltos da pentatonica',
  response: 'Pergunta e resposta',
  blues_line: 'Frase penta blues',
  music_lick_1: 'Lick tirado da musica 1',
  music_lick_2: 'Lick tirado da musica 2',
  music_lick_3: 'Lick tirado da musica 3',
  worship_approach: 'Lick para louvor - entrada suave',
  worship_response: 'Lick para louvor - resposta curta',
  worship_closure: 'Lick para louvor - finalizacao',
  worship_call: 'Lick para louvor - chamada'
};

const scaleDegreeIntervals = {
  major: {'1':0, '2':2, '3':4, '4':5, '5':7, '6':9, '7':11, '8':12},
  pentatonic: {'1':0, '2':2, '3':4, '5':7, '6':9, '8':12},
  blues: {'1':0, '2':2, '3b':3, '3':4, '5':7, '6':9, '8':12}
};

const scaleNames = {
  major: 'maior',
  pentatonic: 'pentatonica',
  blues: 'penta blues'
};

function evaluateEmbouchure(features){
  // features: {rms, centroid, flux, hnr, attack, pitch}
  const adv = [];
  if(features.rms < 0.02) adv.push('Som fraco — aproxime o instrumento e aumente apoio do ar.');
  if(features.rms > 0.35) adv.push('Som muito forte — controle o fluxo de ar para evitar distorção.');
  if(features.hnr !== '—' && parseFloat(features.hnr) < 6) adv.push('Harmonia fraca/ruído alto — revisar embocadura e posicionamento do bocal.');
  if(features.centroid && features.centroid > 1500) adv.push('Timbre muito brilhante — tente ajustar a embocadura para suavizar agudos.');
  if(features.flux && features.flux > 1200) adv.push('Muitas variações rápidas — trabalhar estabilidade e sustentação de ar.');
  if(features.attack) adv.push('Ataque forte detectado — trabalhar articulação e controle de língua.');
  if(adv.length===0) adv.push('Boa emissão — mantenha postura e fluxo de ar.');
  return adv;
}

function startExercise(){
  exerciseActive = true; sessionSnapshots = [];
  startExerciseBtn.disabled = true; stopExerciseBtn.disabled = false; saveSessionBtn.disabled = true;
  feedbackList.innerHTML = '';
}
function stopExercise(){
  exerciseActive = false; startExerciseBtn.disabled = false; stopExerciseBtn.disabled = true; saveSessionBtn.disabled = sessionSnapshots.length===0;
}
function saveSession(){
  if(sessionSnapshots.length===0) { alert('Nenhuma amostra registrada.'); return; }
  const existing = JSON.parse(localStorage.getItem(sessionsStoreKey) || '[]');
  const entry = {id: Date.now(), client_id: `session_${Date.now()}`, date: new Date().toISOString(), exercise: exerciseSelect.value, snapshots: sessionSnapshots, synced: false};
  existing.push(entry); localStorage.setItem(sessionsStoreKey, JSON.stringify(existing));
  renderSessions(); saveSessionBtn.disabled = true; alert('Sessão salva.');
  syncLocalData();
}
function renderSessions(){
  const existing = JSON.parse(localStorage.getItem(sessionsStoreKey) || '[]');
  sessionList.innerHTML = '';
  existing.slice().reverse().forEach(s=>{
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href = '#'; a.textContent = `${new Date(s.date).toLocaleString()} — ${s.exercise}`;
    a.addEventListener('click', ()=>{ alert('Sessão: '+s.id+' — ' + s.snapshots.length + ' amostras.'); });
    li.appendChild(a);
    sessionList.appendChild(li);
  });
}
if(startExerciseBtn) startExerciseBtn.addEventListener('click', startExercise);
if(stopExerciseBtn) stopExerciseBtn.addEventListener('click', stopExercise);
if(saveSessionBtn) saveSessionBtn.addEventListener('click', saveSession);
renderSessions();

function setupBeginnerMode(){
  loadMicCalibration();
  if(beginnerTargetNote && targetNoteSelect){
    beginnerTargetNote.innerHTML = targetNoteSelect.innerHTML;
    beginnerTargetNote.value = targetNoteSelect.value || 'A4';
  }
  updatePerceptionControlsVisibility();
  applyRoutineStep();
  syncBeginnerControls();
  setBeginnerStatus('ready', 'Pronto', isRoutineMode() ? currentRoutineStep().help : 'Escolha uma nota, clique em Comecar e tente deixar o medidor verde.');
}

function currentRoutineStep(){
  return beginnerRoutine[beginnerRoutineIndex] || beginnerRoutine[0];
}

function isRoutineMode(){
  return beginnerExercise && beginnerExercise.value === 'routine_level_1';
}

function isPerceptionDegreeMode(){
  return beginnerExercise && (beginnerExercise.value === 'perception_degrees' || beginnerExercise.value === 'music_licks' || beginnerExercise.value === 'worship_licks');
}

function isMusicLicksMode(){
  return beginnerExercise && beginnerExercise.value === 'music_licks';
}

function isWorshipLicksMode(){
  return beginnerExercise && beginnerExercise.value === 'worship_licks';
}

function currentStandaloneExercise(){
  if(!beginnerExercise) return null;
  if(isPerceptionDegreeMode()) return buildPerceptionDegreeExercise();
  return beginnerStandaloneExercises[beginnerExercise.value] || null;
}

function currentGuidedStep(){
  return isRoutineMode() ? currentRoutineStep() : currentStandaloneExercise();
}

function buildPerceptionDegreeExercise(){
  const root = perceptionKey ? perceptionKey.value : 'F4';
  const scale = perceptionScale ? perceptionScale.value : 'pentatonic';
  const patternKey = perceptionPattern ? perceptionPattern.value : 'up_down';
  const pattern = perceptionPatterns[patternKey] || perceptionPatterns.up_down;
  const intervals = scaleDegreeIntervals[scale] || scaleDegreeIntervals.pentatonic;
  const rootMidi = noteNameToMidiNumber(root);
  const sequence = [];
  const labels = [];

  pattern.forEach((degree)=>{
    const interval = intervals[degree] !== undefined ? intervals[degree] : scaleDegreeIntervals.blues[degree];
    if(rootMidi === null || interval === undefined) return;
    const note = midiToNoteName(rootMidi + interval);
    sequence.push(note);
    labels.push(`${degree} - ${noteToSolfege(note)}`);
  });

  const rootLabel = noteToSolfege(root);
  const titlePrefix = isWorshipLicksMode() ? 'Licks para louvor' : (isMusicLicksMode() ? 'Licks tirados da musica' : 'Percepcao');
  const practicePrompt = isWorshipLicksMode()
    ? 'ouca como sax, cante os graus e aplique como frase curta de louvor'
    : (isMusicLicksMode()
    ? 'ouca o lick, cante os graus e depois toque com o mesmo desenho melodico'
    : 'cante os graus antes de tocar');
  return {
    title: `${titlePrefix} - ${rootLabel} ${scaleNames[scale] || 'pentatonica'}`,
    mode: 'scale',
    seconds: 0.55,
    target: sequence[0] || root,
    bpm: beginnerBpm ? clampBpm(beginnerBpm.value || 45) : 45,
    sequence,
    labels,
    degrees: pattern,
    help: `${perceptionPatternNames[patternKey] || 'Padrao'}: ${practicePrompt} (${pattern.join(' - ')}). Depois repita nota por nota.`
  };
}

function renderRoutineStep(){
  const step = currentRoutineStep();
  if(routineStepTitle) routineStepTitle.textContent = step.title;
  if(routineStepHelp) routineStepHelp.textContent = step.help;
  if(routinePrevBtn) routinePrevBtn.disabled = beginnerRoutineIndex === 0;
  if(routineNextBtn) routineNextBtn.disabled = beginnerRoutineIndex === beginnerRoutine.length - 1;
  renderRoutineSequence();
}

function renderRoutineSequence(){
  renderRoutineSequenceForStep(currentRoutineStep());
}

function applyRoutineStep(){
  if(!isRoutineMode()) return;
  const step = currentRoutineStep();
  beginnerScaleIndex = 0;
  beginnerGoalSeconds = step.seconds || 5;
  if(beginnerTargetNote) beginnerTargetNote.value = step.target || 'G4';
  if(beginnerBpm) beginnerBpm.value = step.bpm || 60;
  if(targetNoteSelect) targetNoteSelect.value = step.target || 'G4';
  if(metronomeBpm) metronomeBpm.value = step.bpm || 60;
  renderRoutineStep();
  resetBeginnerProgress();
  setBeginnerStatus('ready', 'Pronto', step.help);
}

function applyStandaloneExercise(){
  const step = currentStandaloneExercise();
  if(!step) return;
  beginnerScaleIndex = 0;
  beginnerGoalSeconds = step.seconds || 5;
  if(beginnerTargetNote) beginnerTargetNote.value = step.target || 'G4';
  if(beginnerBpm) beginnerBpm.value = step.bpm || 50;
  if(targetNoteSelect) targetNoteSelect.value = step.target || 'G4';
  if(metronomeBpm) metronomeBpm.value = step.bpm || 50;
  if(routineStepTitle) routineStepTitle.textContent = step.title;
  if(routineStepHelp) routineStepHelp.textContent = step.help;
  if(routinePrevBtn) routinePrevBtn.disabled = true;
  if(routineNextBtn) routineNextBtn.disabled = true;
  renderRoutineSequenceForStep(step);
  resetBeginnerProgress();
  setBeginnerStatus('ready', 'Pronto', step.help);
}

function updatePerceptionControlsVisibility(){
  if(perceptionControls) perceptionControls.classList.toggle('perception-hidden', !isPerceptionDegreeMode());
}

function refreshPerceptionExercise(){
  if(!isPerceptionDegreeMode()) return;
  applyStandaloneExercise();
  if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
}

function setPerceptionKeyFromTarget(noteName){
  if(!perceptionKey || !noteName) return false;
  const midi = noteNameToMidiNumber(noteName);
  if(midi === null) return false;
  const pitchClass = ((midi % 12) + 12) % 12;
  const keyByPitchClass = {
    0: 'C4',
    1: 'C#4',
    2: 'D4',
    3: 'Eb4',
    4: 'E4',
    5: 'F4',
    6: 'F#4',
    7: 'G4',
    8: 'Ab4',
    9: 'A4',
    10: 'Bb4',
    11: 'B4'
  };
  const key = keyByPitchClass[pitchClass];
  if(!key) return false;
  perceptionKey.value = key;
  return perceptionKey.value === key;
}

function renderRoutineSequenceForStep(step){
  if(!routineSequence || !step) return;
  routineSequence.innerHTML = '';
  if(!step.sequence){
    const chip = document.createElement('span');
    chip.className = 'active';
    chip.textContent = step.target || 'Sem nota';
    routineSequence.appendChild(chip);
    return;
  }
  step.sequence.forEach((note, index)=>{
    const chip = document.createElement('span');
    if(index === beginnerScaleIndex) chip.className = 'active';
    chip.textContent = step.labels ? `${step.labels[index]} (${note})` : note;
    routineSequence.appendChild(chip);
  });
}

function setManualBeginnerMode(){
  if(beginnerExercise && (beginnerExercise.value === 'routine_level_1' || isPerceptionDegreeMode() || currentStandaloneExercise())){
    beginnerExercise.value = 'hold_note';
  }
  updatePerceptionControlsVisibility();
  if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = 'none';
  if(toleranceCentsInput) toleranceCentsInput.value = 30;
  beginnerGoalSeconds = 5;
}

function setRoutineStep(index){
  beginnerRoutineIndex = Math.max(0, Math.min(beginnerRoutine.length - 1, index));
  applyRoutineStep();
}

function syncBeginnerControls(){
  if(beginnerTargetNote && targetNoteSelect) targetNoteSelect.value = beginnerTargetNote.value;
  if(beginnerBpm && metronomeBpm) metronomeBpm.value = clampBpm(beginnerBpm.value);
  if(toleranceCentsInput) toleranceCentsInput.value = beginnerExercise && beginnerExercise.value === 'steady_air' ? 25 : 30;
  if(!isRoutineMode()) beginnerGoalSeconds = beginnerExercise && beginnerExercise.value === 'steady_air' ? 8 : 5;
  if(beginnerProgressText) beginnerProgressText.textContent = `0 de ${beginnerGoalSeconds} segundos afinado`;
}

function setBeginnerStatus(kind, label, message){
  if(beginnerLight){
    beginnerLight.className = kind || 'ready';
    beginnerLight.innerHTML = '';
    if(label === 'Repita'){
      const repeatButton = document.createElement('button');
      repeatButton.type = 'button';
      repeatButton.className = 'repeat-action';
      repeatButton.textContent = 'Repita';
      repeatButton.addEventListener('click', repeatBeginnerPractice);
      beginnerLight.appendChild(repeatButton);
    } else {
      beginnerLight.textContent = label || 'Pronto';
    }
  }
  if(beginnerMessage && message){
    beginnerMessage.innerHTML = '';
    if(label === 'Repita' && message.startsWith('Repita')){
      const repeatButton = document.createElement('button');
      repeatButton.type = 'button';
      repeatButton.className = 'repeat-message-action';
      repeatButton.textContent = 'Repita';
      repeatButton.addEventListener('click', repeatBeginnerPractice);
      beginnerMessage.appendChild(repeatButton);
      beginnerMessage.appendChild(document.createTextNode(message.slice('Repita'.length)));
    } else {
      beginnerMessage.textContent = message;
    }
  }
}

function loadMicCalibration(){
  try {
    const saved = JSON.parse(localStorage.getItem('sax_mic_calibration_v1') || 'null');
    if(saved && saved.minNoteRms && saved.silenceRms){
      calibratedNoiseRms = saved.noiseRms || SILENCE_RMS;
      calibratedNoteRms = saved.noteRms || MIN_NOTE_RMS;
      applyMicCalibrationThresholds(calibratedNoiseRms, calibratedNoteRms);
      if(calibrationStatus) calibrationStatus.textContent = `Calibrado: ruído ${calibratedNoiseRms.toFixed(4)}, nota ${calibratedNoteRms.toFixed(4)}.`;
    }
  } catch(e) {
    console.warn('mic calibration load failed', e);
  }
}

function applyMicCalibrationThresholds(noiseRms, noteRms){
  const usefulRange = Math.max(0.0005, noteRms - noiseRms);
  SILENCE_RMS = Math.max(0.0005, noiseRms + usefulRange * 0.06);
  MIN_NOTE_RMS = Math.max(0.0012, noiseRms * 1.2, noiseRms + usefulRange * 0.25);
  if(MIN_NOTE_RMS >= noteRms * 0.8) MIN_NOTE_RMS = Math.max(0.0012, noteRms * 0.55);
}

function saveMicCalibration(noiseRms, noteRms){
  calibratedNoiseRms = noiseRms;
  calibratedNoteRms = noteRms;
  applyMicCalibrationThresholds(noiseRms, noteRms);
  localStorage.setItem('sax_mic_calibration_v1', JSON.stringify({
    noiseRms,
    noteRms,
    silenceRms: SILENCE_RMS,
    minNoteRms: MIN_NOTE_RMS,
    date: new Date().toISOString()
  }));
}

function collectCalibrationAverage(){
  if(!calibrationSamples.length) return latestRms || 0;
  const sorted = calibrationSamples.slice().sort((a,b)=>a-b);
  const start = Math.floor(sorted.length * 0.15);
  const end = Math.max(start + 1, Math.ceil(sorted.length * 0.85));
  const trimmed = sorted.slice(start, end);
  return trimmed.reduce((sum, value)=>sum + value, 0) / trimmed.length;
}

function startMicCalibration(){
  if(calibrationTimer) clearTimeout(calibrationTimer);
  if(calibrateMicBtn) calibrateMicBtn.disabled = true;
  calibrationSamples = [];
  calibrationMode = 'noise';
  if(calibrationStatus) calibrationStatus.textContent = 'Calibrando ruído: fique em silêncio por 2 segundos.';
  setBeginnerStatus('ready', 'Silêncio', 'Fique em silêncio. Vou medir o ruído do ambiente.');
  if(startBtn && !startBtn.disabled) start();
  calibrationTimer = setTimeout(()=>{
    const noiseRms = Math.max(collectCalibrationAverage(), 0.0004);
    calibrationSamples = [];
    calibrationMode = 'note';
    if(calibrationStatus) calibrationStatus.textContent = 'Agora toque uma nota sustentada por 3 segundos.';
    setBeginnerStatus('ready', 'Toque', 'Toque uma nota longa perto do microfone.');
    calibrationTimer = setTimeout(()=>{
      const noteRms = Math.max(collectCalibrationAverage(), noiseRms * 2);
      saveMicCalibration(noiseRms, noteRms);
      calibrationMode = null;
      calibrationSamples = [];
      if(calibrateMicBtn) calibrateMicBtn.disabled = false;
      if(calibrationStatus) calibrationStatus.textContent = `Calibrado: ruído ${noiseRms.toFixed(4)}, nota ${noteRms.toFixed(4)}.`;
      setBeginnerStatus('good', 'Calibrado', 'Microfone calibrado. Agora comece a rotina ou escolha uma nota.');
    }, 3000);
  }, 2000);
}

function captureCalibrationSample(rms){
  latestRms = rms;
  if(calibrationMode){
    calibrationSamples.push(rms);
    if(calibrationSamples.length > 240) calibrationSamples.shift();
  }
}

function updateMicrophoneDiagnostic(rms){
  const now = performance.now();
  if(now - lastMicrophoneDiagnosticAt < 300 || calibrationMode) return;
  lastMicrophoneDiagnosticAt = now;
  if(calibrationStatus){
    const state = rms >= MIN_NOTE_RMS ? 'sinal detectado' : rms >= SILENCE_RMS ? 'sinal baixo' : 'silencio';
    calibrationStatus.textContent = `Microfone: ${state} · nivel ${rms.toFixed(4)} · limite ${MIN_NOTE_RMS.toFixed(4)}.`;
  }
  if(transcriptionActive && transcriptionStatus){
    const pitchText = currentEstimatedPitch ? `${currentEstimatedPitch.toFixed(1)} Hz` : 'altura nao identificada';
    transcriptionStatus.textContent = `Microfone ativo · nivel ${rms.toFixed(4)} · ${pitchText} · ${scoreEvents.length} notas.`;
  }
}

function resetBeginnerProgress(){
  beginnerHoldStart = null;
  beginnerBestHold = 0;
  resetBeginnerPerformance();
  if(beginnerProgressFill) beginnerProgressFill.style.width = '0%';
  if(beginnerProgressText) beginnerProgressText.textContent = `0 de ${beginnerGoalSeconds} segundos afinado`;
  if(beginnerBestText) beginnerBestText.textContent = '0.0 s';
}

function resetBeginnerPerformance(){
  beginnerAttemptFrames = 0;
  beginnerCorrectFrames = 0;
  beginnerMistakeFrames = 0;
  beginnerCompletedNotes = 0;
  beginnerExerciseStartedAt = performance.now();
}

function recordBeginnerPerformance(isCorrect){
  beginnerAttemptFrames += 1;
  if(isCorrect) beginnerCorrectFrames += 1;
  else beginnerMistakeFrames += 1;
}

function evaluateBeginnerPerformance(step, reason){
  const isScale = step && step.mode === 'scale';
  const isTimer = step && step.mode === 'timer';
  const attemptRatio = beginnerAttemptFrames ? beginnerCorrectFrames / beginnerAttemptFrames : 0;
  const elapsed = beginnerExerciseStartedAt ? (performance.now() - beginnerExerciseStartedAt) / 1000 : 0;

  if(isTimer){
    const targetSeconds = step.seconds || beginnerGoalSeconds || 1;
    if(reason === 'completed' || elapsed >= targetSeconds * 0.95){
      return {kind: 'good', label: 'Concluido', message: 'Bom desempenho. Pode avancar para o proximo passo quando estiver pronto.'};
    }
    return {kind: 'close', label: 'Repita', message: 'Repita este exercicio antes de avancar: complete o tempo inteiro com respiracao calma.'};
  }

  if(isScale){
    const totalNotes = step.sequence ? step.sequence.length : 1;
    const completionRatio = totalNotes ? beginnerCompletedNotes / totalNotes : 0;
    if(completionRatio >= 1 && attemptRatio >= 0.55){
      return {kind: 'good', label: 'Bom desempenho', message: 'Muito bom. Voce completou a sequencia com boa estabilidade. Pode avancar.'};
    }
    if(completionRatio >= 1){
      return {kind: 'close', label: 'Repita', message: 'Sequencia concluida, mas com muitos ajustes. Repita para deixar as notas mais estaveis antes de avancar.'};
    }
    return {kind: 'close', label: 'Repita', message: 'Repita este exercicio antes de avancar: toque devagar e espere cada nota ficar verde.'};
  }

  if(beginnerBestHold >= beginnerGoalSeconds * 0.8 && attemptRatio >= 0.45){
    return {kind: 'good', label: 'Bom desempenho', message: `Boa estabilidade: melhor sequencia de ${beginnerBestHold.toFixed(1)} s. Pode avancar.`};
  }
  if(beginnerBestHold >= beginnerGoalSeconds * 0.5){
    return {kind: 'close', label: 'Repita', message: `Quase la: melhor sequencia de ${beginnerBestHold.toFixed(1)} s. Repita buscando ${beginnerGoalSeconds} s no verde.`};
  }
  if(beginnerAttemptFrames > 0){
    return {kind: 'bad', label: 'Repita', message: 'Repita este exercicio antes de avancar: ouca a referencia e procure manter a nota no verde por mais tempo.'};
  }
  return {kind: 'close', label: 'Repita', message: 'Ainda nao captei uma nota clara. Repita o exercicio, ouca a referencia e aproxime o microfone se necessario.'};
}

function showBeginnerPerformance(step, reason){
  const result = evaluateBeginnerPerformance(step, reason);
  setBeginnerStatus(result.kind, result.label, result.message);
}

function setBeginnerStartButtonListening(isListening){
  if(!beginnerStartBtn) return;
  beginnerStartBtn.classList.toggle('is-listening', isListening);
  beginnerStartBtn.textContent = isListening ? '\u25b6 Ouvindo' : '\u25b6 Executar';
  if(dashboardPage) dashboardPage.classList.toggle('practice-active', isListening);
}

function startBeginnerPractice(){
  transcriptionActive = false;
  syncBeginnerControls();
  resetBeginnerProgress();
  beginnerActive = true;
  if(beginnerStartBtn) beginnerStartBtn.disabled = true;
  setBeginnerStartButtonListening(true);
  if(beginnerStopBtn) beginnerStopBtn.disabled = false;
  const step = currentGuidedStep();
  if(!audioCtx || !analyser) start();
  if(step && step.mode === 'timer'){
    startBeginnerTimer(step);
  } else {
    if((step && step.metronome) || (beginnerExercise && beginnerExercise.value === 'with_metronome')){
      if(!metronomeIntervalId) startMetronome();
    }
    setBeginnerStatus('ready', 'Ouvindo', step && step.mode === 'scale' ? 'Toque a nota destacada. O alvo avanca quando ficar verde.' : 'Toque a nota alvo com calma. O verde conta como acerto.');
  }
}

function stopBeginnerPractice(){
  const step = currentGuidedStep();
  beginnerActive = false;
  beginnerHoldStart = null;
  stopBeginnerTimer();
  if(beginnerStartBtn) beginnerStartBtn.disabled = false;
  setBeginnerStartButtonListening(false);
  if(beginnerStopBtn) beginnerStopBtn.disabled = true;
  if(stopBtn && !stopBtn.disabled) stop();
  showBeginnerPerformance(step, 'stopped');
}

function repeatBeginnerPractice(){
  const step = currentGuidedStep();
  beginnerActive = false;
  beginnerHoldStart = null;
  stopBeginnerTimer();
  if(step && step.mode === 'scale'){
    beginnerScaleIndex = 0;
    if(beginnerTargetNote) beginnerTargetNote.value = step.sequence[0];
    if(targetNoteSelect) targetNoteSelect.value = step.sequence[0];
    renderRoutineSequenceForStep(step);
  }
  if(stopBtn && !stopBtn.disabled) stop();
  resetBeginnerProgress();
  setBeginnerStatus('ready', 'Repetir', step && step.mode === 'scale'
    ? 'Vamos repetir desde a primeira nota. Toque devagar e espere ficar verde.'
    : 'Vamos repetir o exercicio. Ouca a referencia se precisar e tente manter o verde.');
  startBeginnerPractice();
}

function startBeginnerTimer(step){
  stopBeginnerTimer();
  beginnerTimerStart = performance.now();
  setBeginnerStatus('ready', 'Guiando', step.help);
  beginnerTimerId = setInterval(()=>{
    const elapsed = (performance.now() - beginnerTimerStart) / 1000;
    const progress = Math.min(100, (elapsed / step.seconds) * 100);
    if(beginnerProgressFill) beginnerProgressFill.style.width = `${progress}%`;
    if(beginnerProgressText) beginnerProgressText.textContent = `${Math.min(step.seconds, elapsed).toFixed(1)} de ${step.seconds} segundos`;
    if(elapsed >= step.seconds){
      stopBeginnerTimer();
      if(beginnerStartBtn) beginnerStartBtn.disabled = false;
      setBeginnerStartButtonListening(false);
      if(beginnerStopBtn) beginnerStopBtn.disabled = true;
      beginnerActive = false;
      showBeginnerPerformance(step, 'completed');
    }
  }, 100);
}

function stopBeginnerTimer(){
  if(beginnerTimerId){
    clearInterval(beginnerTimerId);
    beginnerTimerId = null;
  }
}

function toggleBeginnerMetronome(){
  syncBeginnerControls();
  if(metronomeIntervalId) stopMetronome();
  else startMetronome();
  updateBeginnerMetronomeButton();
}

async function playBeginnerReference(){
  const step = currentGuidedStep();
  if(!step) syncBeginnerControls();
  else {
    if(beginnerBpm && metronomeBpm) metronomeBpm.value = clampBpm(beginnerBpm.value);
    if(targetNoteSelect) targetNoteSelect.value = step.sequence ? step.sequence[beginnerScaleIndex] : step.target;
  }
  if(step && step.sequence){
    try {
      await playReferenceSequence(step.sequence, step.bpm || 60, (index)=>{
        const chips = routineSequence ? Array.from(routineSequence.querySelectorAll('span')) : [];
        chips.forEach((chip, chipIndex)=>chip.classList.toggle('reference-playing', chipIndex === index));
      });
      renderRoutineSequenceForStep(step);
      setBeginnerStatus('ready', 'Refer\u00eancia', 'Ou\u00e7a a sequencia e depois toque uma nota por vez.');
    } catch(e) {
      console.error('reference sequence failed', e);
      setBeginnerStatus('bad', 'Sem som', 'Toque novamente em Ouvir refer\u00eancia para liberar o audio.');
    }
    return;
  }
  const noteName = beginnerTargetNote ? beginnerTargetNote.value : (targetNoteSelect ? targetNoteSelect.value : '');
  if(targetNoteSelect) targetNoteSelect.value = noteName;
  const frequency = writtenNoteToSoundingFrequency(noteName);
  if(!frequency){
    setBeginnerStatus('bad', 'Sem nota', 'Escolha uma nota alvo para ouvir a refer\u00eancia.');
    return;
  }
  try {
    const ctx = await ensureAudioContext();
    const now = ctx.currentTime + 0.03;
    playReferenceTone(frequency, now, 1.4);
    setBeginnerStatus('ready', 'Refer\u00eancia', `Ou\u00e7a ${noteName} em ${getInstrumentLabel()} e tente tocar igual.`);
  } catch(e) {
    console.error('reference tone failed', e);
    setBeginnerStatus('bad', 'Sem som', 'Toque novamente em Ouvir refer\u00eancia para liberar o audio.');
  }
}

async function ensureAudioContext(){
  if(!audioCtx || audioCtx.state === 'closed') audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') await audioCtx.resume();
  return audioCtx;
}

function getReferenceReverbBus(ctx){
  const existing = referenceReverbBuses.get(ctx);
  if(existing) return existing;

  const convolver = ctx.createConvolver();
  const wetGain = ctx.createGain();
  const seconds = 1.25;
  const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  for(let channel = 0; channel < impulse.numberOfChannels; channel += 1){
    const samples = impulse.getChannelData(channel);
    for(let index = 0; index < samples.length; index += 1){
      const decay = Math.pow(1 - index / samples.length, 2.8);
      samples[index] = (Math.random() * 2 - 1) * decay;
    }
  }
  convolver.buffer = impulse;
  wetGain.gain.value = 0.10;
  convolver.connect(wetGain);
  wetGain.connect(ctx.destination);
  const bus = {input: convolver};
  referenceReverbBuses.set(ctx, bus);
  return bus;
}

function playReferenceTone(frequency, startTime, duration, destinationBus = null, peakGain = REFERENCE_TONE_GAIN){
  const output = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const vibrato = audioCtx.createOscillator();
  const vibratoGain = audioCtx.createGain();
  const harmonics = [
    {ratio: 1, gain: 0.62, type: 'sawtooth'},
    {ratio: 2, gain: 0.20, type: 'triangle'},
    {ratio: 3, gain: 0.11, type: 'sine'},
    {ratio: 4, gain: 0.05, type: 'sine'}
  ];

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(3600, Math.max(1100, frequency * 9)), startTime);
  filter.Q.setValueAtTime(1.6, startTime);

  const safeDuration = Math.max(0.045, duration);
  const attackDuration = Math.min(0.055, safeDuration * 0.22);
  const releaseDuration = Math.min(0.09, safeDuration * 0.24);
  const sustainEnd = Math.max(startTime + attackDuration, startTime + safeDuration - releaseDuration);
  output.gain.setValueAtTime(0.0001, startTime);
  output.gain.exponentialRampToValueAtTime(peakGain, startTime + attackDuration);
  output.gain.setValueAtTime(peakGain, sustainEnd);
  output.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDuration);

  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(5.2, startTime);
  vibratoGain.gain.setValueAtTime(Math.max(1.5, frequency * 0.006), startTime);
  vibrato.connect(vibratoGain);

  harmonics.forEach((partial)=>{
    const osc = audioCtx.createOscillator();
    const partialGain = audioCtx.createGain();
    osc.type = partial.type;
    osc.frequency.setValueAtTime(frequency * partial.ratio, startTime);
    if(partial.ratio === 1) vibratoGain.connect(osc.frequency);
    partialGain.gain.setValueAtTime(partial.gain, startTime);
    osc.connect(partialGain);
    partialGain.connect(filter);
    osc.start(startTime);
    osc.stop(startTime + safeDuration + 0.025);
  });

  filter.connect(output);
  if(destinationBus){
    output.connect(destinationBus);
  } else {
    output.connect(audioCtx.destination);
    output.connect(getReferenceReverbBus(audioCtx).input);
  }
  const vibratoStart = startTime + Math.min(0.06, safeDuration * 0.25);
  vibrato.start(vibratoStart);
  vibrato.stop(startTime + safeDuration + 0.025);
}

async function playReferenceSequence(sequence, bpm, onNoteChange, beatDurations){
  const ctx = await ensureAudioContext();
  const beat = 60 / clampBpm(bpm || 60);
  const start = ctx.currentTime + 0.08;
  const playbackId = ++referencePlaybackId;
  if(activeReferencePlaybackBus){
    activeReferencePlaybackBus.gain.cancelScheduledValues(ctx.currentTime);
    activeReferencePlaybackBus.gain.setValueAtTime(0, ctx.currentTime);
    try{ activeReferencePlaybackBus.disconnect(); }catch(error){}
  }
  const playbackBus = ctx.createGain();
  playbackBus.gain.setValueAtTime(1, ctx.currentTime);
  playbackBus.connect(ctx.destination);
  playbackBus.connect(getReferenceReverbBus(ctx).input);
  activeReferencePlaybackBus = playbackBus;
  let elapsedBeats = 0;
  const scheduledNotes = sequence.map((note, index)=>{
    const noteBeats = Math.max(0.125, Number(beatDurations && beatDurations[index]) || 1);
    const noteStart = start + elapsedBeats * beat;
    const duration = window.SaxTiming
      ? window.SaxTiming.soundingDuration(noteBeats, bpm)
      : Math.max(0.08, Math.min(noteBeats * beat * 0.98, noteBeats * beat - 0.012));
    elapsedBeats += noteBeats;
    return {note, index, noteStart, duration};
  });
  if(!scheduledNotes.length) return;

  const finishTime = start + elapsedBeats * beat;
  const scheduleAheadSeconds = 2.5;
  const schedulerIntervalMs = 40;
  let nextNoteIndex = 0;
  let nextVisualIndex = 0;

  await new Promise((resolve)=>{
    const finish = ()=>{
      if(playbackId === referencePlaybackId && onNoteChange) onNoteChange(-1, null);
      resolve();
    };
    const scheduleWindow = ()=>{
      if(playbackId !== referencePlaybackId){
        resolve();
        return;
      }
      const horizon = ctx.currentTime + scheduleAheadSeconds;
      while(nextNoteIndex < scheduledNotes.length && scheduledNotes[nextNoteIndex].noteStart <= horizon){
        const scheduled = scheduledNotes[nextNoteIndex];
        const frequency = writtenNoteToSoundingFrequency(scheduled.note);
        if(frequency) playReferenceTone(frequency, scheduled.noteStart, scheduled.duration, playbackBus);
        nextNoteIndex += 1;
      }
      while(nextVisualIndex < scheduledNotes.length && scheduledNotes[nextVisualIndex].noteStart <= ctx.currentTime + 0.015){
        const visual = scheduledNotes[nextVisualIndex];
        if(onNoteChange) onNoteChange(visual.index, visual.note);
        nextVisualIndex += 1;
      }
      if(ctx.currentTime >= finishTime){
        finish();
        return;
      }
      window.setTimeout(scheduleWindow, schedulerIntervalMs);
    };
    scheduleWindow();
  });
  if(activeReferencePlaybackBus === playbackBus) activeReferencePlaybackBus = null;
  try{ playbackBus.disconnect(); }catch(error){}
}

function updateBeginnerMetronomeButton(){
  if(beginnerMetronomeBtn) beginnerMetronomeBtn.textContent = metronomeIntervalId ? '\u266a Metr\u00f4nomo ligado' : '\u2669 Metr\u00f4nomo';
}

function updateBeginnerPanel(pitch, rms){
  if(!beginnerActive) return;
  const step = currentGuidedStep();
  if(step && step.mode === 'scale'){
    updateBeginnerScalePanel(pitch, rms, step);
    return;
  }
  const targetFreq = writtenNoteToSoundingFrequency(targetNoteSelect ? targetNoteSelect.value : '');
  if(!targetFreq || !pitch || !hasUsableSignal(rms)){
    beginnerHoldStart = null;
    setBeginnerStatus('ready', 'Ouvindo', rms > SILENCE_RMS ? 'Sinal baixo. Toque um pouco mais perto do microfone.' : 'Toque a nota alvo com som claro e sustentado.');
    return;
  }

  const tolerance = Math.max(45, parseInt(toleranceCentsInput ? toleranceCentsInput.value || '45' : '45', 10) || 45);
  const comparedPitch = normalizePitchOctaveNearTarget(pitch, targetFreq);
  const diffCents = Math.round(1200 * Math.log2(comparedPitch / targetFreq));
  const absDiff = Math.abs(diffCents);
  const now = performance.now();

  if(absDiff <= tolerance){
    recordBeginnerPerformance(true);
    if(beginnerHoldStart === null) beginnerHoldStart = now;
    const heldSeconds = (now - beginnerHoldStart) / 1000;
    beginnerBestHold = Math.max(beginnerBestHold, heldSeconds);
    const progress = Math.min(100, (heldSeconds / beginnerGoalSeconds) * 100);
    if(beginnerProgressFill) beginnerProgressFill.style.width = `${progress}%`;
    if(beginnerProgressText) beginnerProgressText.textContent = `${Math.min(beginnerGoalSeconds, heldSeconds).toFixed(1)} de ${beginnerGoalSeconds} segundos afinado`;
    if(beginnerBestText) beginnerBestText.textContent = `${beginnerBestHold.toFixed(1)} s`;
    setBeginnerStatus('good', 'Afinado', heldSeconds >= beginnerGoalSeconds ? 'Muito bom. Voce manteve a nota afinada.' : 'Continue segurando assim.');
  } else {
    recordBeginnerPerformance(false);
    beginnerHoldStart = null;
    if(beginnerProgressFill) beginnerProgressFill.style.width = '0%';
    if(beginnerProgressText) beginnerProgressText.textContent = `0 de ${beginnerGoalSeconds} segundos afinado`;
    const direction = diffCents > 0 ? 'alto' : 'baixo';
    const kind = absDiff <= tolerance * 2 ? 'close' : 'bad';
    const label = absDiff <= tolerance * 2 ? 'Quase' : 'Ajuste';
    const advice = direction === 'alto'
      ? 'Voce esta um pouco alto. Relaxe a embocadura e confira o apoio do ar.'
      : 'Voce esta um pouco baixo. Apoie melhor o ar e firme a emissao.';
    setBeginnerStatus(kind, label, advice);
  }
}

function updateBeginnerScalePanel(pitch, rms, step){
  const currentNote = step.sequence[beginnerScaleIndex];
  const targetFreq = writtenNoteToSoundingFrequency(currentNote);
  if(beginnerTargetNote) beginnerTargetNote.value = currentNote;
  if(targetNoteSelect) targetNoteSelect.value = currentNote;
  if(!targetFreq || !pitch || !hasUsableSignal(rms)){
    beginnerHoldStart = null;
    setBeginnerStatus('ready', 'Ouvindo', rms > SILENCE_RMS ? 'Sinal baixo. Aproxime o celular ou toque mais sustentado.' : `Toque ${step.labels[beginnerScaleIndex]} (${currentNote}).`);
    renderRoutineSequenceForStep(step);
    return;
  }
  const tolerance = Math.max(45, parseInt(toleranceCentsInput ? toleranceCentsInput.value || '45' : '45', 10) || 45);
  const comparedPitch = normalizePitchOctaveNearTarget(pitch, targetFreq);
  const diffCents = Math.round(1200 * Math.log2(comparedPitch / targetFreq));
  const absDiff = Math.abs(diffCents);
  const now = performance.now();
  if(absDiff <= tolerance){
    recordBeginnerPerformance(true);
    if(beginnerHoldStart === null) beginnerHoldStart = now;
    const heldSeconds = (now - beginnerHoldStart) / 1000;
    const completed = beginnerScaleIndex + Math.min(1, heldSeconds / step.seconds);
    const progress = Math.min(100, (completed / step.sequence.length) * 100);
    if(beginnerProgressFill) beginnerProgressFill.style.width = `${progress}%`;
    if(beginnerProgressText) beginnerProgressText.textContent = `${beginnerScaleIndex + 1} de ${step.sequence.length}: ${step.labels[beginnerScaleIndex]}`;
    setBeginnerStatus('good', 'Afinado', `Boa. Segure ${step.labels[beginnerScaleIndex]} por um instante.`);
    if(heldSeconds >= step.seconds){
      beginnerScaleIndex += 1;
      beginnerCompletedNotes += 1;
      beginnerHoldStart = null;
      if(beginnerScaleIndex >= step.sequence.length){
        beginnerActive = false;
        if(beginnerStartBtn) beginnerStartBtn.disabled = false;
        if(beginnerStopBtn) beginnerStopBtn.disabled = true;
        if(stopBtn && !stopBtn.disabled) stop();
        if(beginnerProgressFill) beginnerProgressFill.style.width = '100%';
        if(beginnerProgressText) beginnerProgressText.textContent = 'Escala concluida';
        showBeginnerPerformance(step, 'completed');
      } else {
        if(beginnerTargetNote) beginnerTargetNote.value = step.sequence[beginnerScaleIndex];
        if(targetNoteSelect) targetNoteSelect.value = step.sequence[beginnerScaleIndex];
        setBeginnerStatus('ready', 'Proxima', `Agora toque ${step.labels[beginnerScaleIndex]} (${step.sequence[beginnerScaleIndex]}).`);
      }
      renderRoutineSequenceForStep(step);
    }
  } else {
    recordBeginnerPerformance(false);
    beginnerHoldStart = null;
    const direction = diffCents > 0 ? 'alto' : 'baixo';
    const kind = absDiff <= tolerance * 2 ? 'close' : 'bad';
    setBeginnerStatus(kind, kind === 'close' ? 'Quase' : 'Ajuste', direction === 'alto' ? 'Um pouco alto. Relaxe e tente de novo.' : 'Um pouco baixo. Apoie melhor o ar.');
  }
}

if(beginnerStartBtn) beginnerStartBtn.addEventListener('click', startBeginnerPractice);
if(beginnerStopBtn) beginnerStopBtn.addEventListener('click', stopBeginnerPractice);
if(beginnerRepeatBtn) beginnerRepeatBtn.addEventListener('click', repeatBeginnerPractice);
if(beginnerReferenceBtn) beginnerReferenceBtn.addEventListener('click', playBeginnerReference);
if(worshipSaxReferenceBtn) worshipSaxReferenceBtn.addEventListener('click', playBeginnerReference);
if(beginnerMetronomeBtn) beginnerMetronomeBtn.addEventListener('click', toggleBeginnerMetronome);
if(calibrateMicBtn) calibrateMicBtn.addEventListener('click', startMicCalibration);
if(beginnerInstrument) beginnerInstrument.addEventListener('change', ()=>{
  resetBeginnerProgress();
  if(currentArrangement && currentArrangement.chords && currentArrangement.chords.length){
    currentArrangement.writtenKey = currentArrangement.originalKey ? transposedWrittenKeyForInstrument(currentArrangement.originalKey) : '';
    renderArrangement(currentArrangement);
  }
  updateDashboardSummary('', currentEstimatedPitch, centsLabel ? centsLabel.textContent : '');
  setBeginnerStatus('ready', 'Instrumento', `${getInstrumentLabel()} selecionado. A referencia e a afinacao usam a transposicao correta.`);
  if(profileInstrumentLabel) profileInstrumentLabel.textContent = getInstrumentLabel();
});
if(profileInstrumentBtn) profileInstrumentBtn.addEventListener('click', ()=>{
  showAppStage('practice');
  if(beginnerInstrument){
    beginnerInstrument.focus();
    beginnerInstrument.scrollIntoView({behavior:'smooth', block:'center'});
  }
});
if(profileCalibrateBtn) profileCalibrateBtn.addEventListener('click', ()=>{
  showAppStage('practice');
  if(calibrateMicBtn) calibrateMicBtn.click();
});
if(profileAdvancedBtn) profileAdvancedBtn.addEventListener('click', ()=>showAppStage('advanced'));
if(beginnerTargetNote) beginnerTargetNote.addEventListener('change', ()=>{
  if(isPerceptionDegreeMode()){
    const changed = setPerceptionKeyFromTarget(beginnerTargetNote.value);
    refreshPerceptionExercise();
    setBeginnerStatus('ready', 'Tom', changed
      ? `Tom alterado para ${noteToSolfege(perceptionKey.value)}. Ouça a referencia e toque a sequencia.`
      : 'Nao consegui usar essa nota como tom. Escolha o tom no painel de percepcao.');
    return;
  }
  setManualBeginnerMode();
  syncBeginnerControls();
  resetBeginnerProgress();
  updateDashboardSummary('', currentEstimatedPitch, centsLabel ? centsLabel.textContent : '');
  setBeginnerStatus('ready', 'Manual', `Alvo definido para ${beginnerTargetNote.value}. Ou\u00e7a a refer\u00eancia e tente manter verde.`);
});
if(beginnerBpm) beginnerBpm.addEventListener('change', ()=>{
  syncBeginnerControls();
  if(metronomeIntervalId){ stopMetronome(); startMetronome(); }
});
if(beginnerExercise) beginnerExercise.addEventListener('change', ()=>{
  if(beginnerExercise.value === 'music_licks' && perceptionPattern && !perceptionPattern.value.startsWith('music_lick_')){
    perceptionPattern.value = 'music_lick_1';
  }
  if(beginnerExercise.value === 'worship_licks' && perceptionPattern && !perceptionPattern.value.startsWith('worship_')){
    perceptionPattern.value = 'worship_approach';
  }
  if(beginnerExercise.value === 'perception_degrees' && perceptionPattern && perceptionPattern.value.startsWith('music_lick_')){
    perceptionPattern.value = 'up_down';
  }
  if(beginnerExercise.value === 'perception_degrees' && perceptionPattern && perceptionPattern.value.startsWith('worship_')){
    perceptionPattern.value = 'up_down';
  }
  updatePerceptionControlsVisibility();
  syncBeginnerControls();
  resetBeginnerProgress();
  updateDashboardSummary('', currentEstimatedPitch, centsLabel ? centsLabel.textContent : '');
  if(isRoutineMode()){
    applyRoutineStep();
    if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
    return;
  }
  if(currentStandaloneExercise()){
    applyStandaloneExercise();
    if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
    return;
  }
  if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = 'none';
  const messages = {
    hold_note: 'Tente manter a nota verde por 5 segundos.',
    steady_air: 'Agora o objetivo e estabilidade: segure a nota por 8 segundos.',
    with_metronome: 'Use o metronomo para entrar junto e sustentar a nota.'
  };
  if(beginnerMessage) beginnerMessage.textContent = messages[beginnerExercise.value] || messages.hold_note;
});
if(perceptionKey) perceptionKey.addEventListener('change', refreshPerceptionExercise);
if(perceptionScale) perceptionScale.addEventListener('change', refreshPerceptionExercise);
if(perceptionPattern) perceptionPattern.addEventListener('change', refreshPerceptionExercise);
if(fetchChordSheetBtn) fetchChordSheetBtn.addEventListener('click', fetchChordSheetFromLink);
if(analyzeChordSheetBtn) analyzeChordSheetBtn.addEventListener('click', analyzeChordSheet);
if(arrangementStyle) arrangementStyle.addEventListener('change', ()=>{
  if(chordSheetInput && chordSheetInput.value.trim()) analyzeChordSheet();
});
if(playArrangementBtn) playArrangementBtn.addEventListener('click', playCurrentArrangement);
if(useArrangementPracticeBtn) useArrangementPracticeBtn.addEventListener('click', useArrangementAsBeginnerPractice);
if(renderLyricMelodyBtn) renderLyricMelodyBtn.addEventListener('click', renderLyricMelody);
if(playLyricMelodyBtn) playLyricMelodyBtn.addEventListener('click', playLyricMelody);
if(practiceLyricMelodyBtn) practiceLyricMelodyBtn.addEventListener('click', practiceLyricMelody);
if(generateReadingExerciseBtn) generateReadingExerciseBtn.addEventListener('click', generateReadingExercise);
if(playReadingExerciseBtn) playReadingExerciseBtn.addEventListener('click', ()=>playReadingExercise());
if(playReadingPageBtn) playReadingPageBtn.addEventListener('click', playCurrentReadingPage);
if(pauseReadingBtn) pauseReadingBtn.addEventListener('click', toggleReadingPlaybackPause);
if(stopReadingBtn) stopReadingBtn.addEventListener('click', stopReadingPlayback);
if(repeatReadingBtn) repeatReadingBtn.addEventListener('click', ()=>{
  readingRepeatEnabled = !readingRepeatEnabled;
  repeatReadingBtn.setAttribute('aria-pressed', String(readingRepeatEnabled));
  repeatReadingBtn.classList.toggle('active', readingRepeatEnabled);
});
if(readingBpmMinus) readingBpmMinus.addEventListener('click', ()=>adjustReadingBpm(-1));
if(readingBpmPlus) readingBpmPlus.addEventListener('click', ()=>adjustReadingBpm(1));
if(readingToolbarBpm) readingToolbarBpm.addEventListener('change', ()=>{
  if(readingBpm) readingBpm.value = readingToolbarBpm.value;
  syncReadingBpm();
});
if(readingFullscreen) readingFullscreen.addEventListener('click', ()=>{
  if(!document.fullscreenElement && scorePlayerShell) scorePlayerShell.requestFullscreen();
  else if(document.fullscreenElement) document.exitFullscreen();
});
if(readingStudyModeBtn) readingStudyModeBtn.addEventListener('click', ()=>setReadingViewMode('study'));
if(readingOriginalModeBtn) readingOriginalModeBtn.addEventListener('click', ()=>setReadingViewMode('original'));
if(toggleExecutionViewBtn) toggleExecutionViewBtn.addEventListener('click', toggleOriginalExecutionView);
if(readingProgress){
  let pendingSeekRatio = null;
  const ratioFromPointer = event=>{
    const bounds = readingProgress.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
  };
  const previewSeek = event=>{
    pendingSeekRatio = ratioFromPointer(event);
    if(readingProgressFill) readingProgressFill.style.width = `${pendingSeekRatio * 100}%`;
  };
  readingProgress.addEventListener('pointerdown', event=>{
    readingProgress.setPointerCapture(event.pointerId);
    previewSeek(event);
  });
  readingProgress.addEventListener('pointermove', event=>{
    if(readingProgress.hasPointerCapture(event.pointerId)) previewSeek(event);
  });
  readingProgress.addEventListener('pointerup', event=>{
    if(pendingSeekRatio !== null) seekReadingPlayback(pendingSeekRatio);
    pendingSeekRatio = null;
    if(readingProgress.hasPointerCapture(event.pointerId)) readingProgress.releasePointerCapture(event.pointerId);
  });
  readingProgress.addEventListener('keydown', event=>{
    if(event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const current = Number(readingProgress.getAttribute('aria-valuenow') || 0) / 100;
    seekReadingPlayback(current + (event.key === 'ArrowRight' ? 0.03 : -0.03));
  });
}
if(practiceReadingExerciseBtn) practiceReadingExerciseBtn.addEventListener('click', practiceReadingExercise);
if(importScoreBtn) importScoreBtn.addEventListener('click', importScoreFile);
if(captureScoreBtn && scoreCameraInput) captureScoreBtn.addEventListener('click', ()=>scoreCameraInput.click());
if(scoreCameraInput) scoreCameraInput.addEventListener('change', ()=>{
  const photo = scoreCameraInput.files ? scoreCameraInput.files[0] : null;
  if(photo) importScoreFile(photo);
});
if(saveScoreLibraryBtn) saveScoreLibraryBtn.addEventListener('click', saveCurrentReadingScore);
if(readingLevel) readingLevel.addEventListener('change', generateReadingExercise);
if(readingKey) readingKey.addEventListener('change', ()=>{
  if(!transposeImportedReadingScore()) generateReadingExercise();
});
if(readingMeter) readingMeter.addEventListener('change', generateReadingExercise);
if(readingBpm) readingBpm.addEventListener('change', syncReadingBpm);
if(readingPrevPageBtn) readingPrevPageBtn.addEventListener('click', ()=>setReadingScorePage(readingScorePage - 1));
if(readingNextPageBtn) readingNextPageBtn.addEventListener('click', ()=>setReadingScorePage(readingScorePage + 1));
if(savedScoresList) loadSavedScores();
if(routinePrevBtn) routinePrevBtn.addEventListener('click', ()=>setRoutineStep(beginnerRoutineIndex - 1));
if(routineNextBtn) routineNextBtn.addEventListener('click', ()=>setRoutineStep(beginnerRoutineIndex + 1));
if(advancedToggle && advancedTools) advancedToggle.addEventListener('click', ()=>{
  const hidden = advancedTools.classList.toggle('advanced-hidden');
  advancedToggle.textContent = hidden ? 'Mostrar ferramentas avan\u00e7adas' : 'Ocultar ferramentas avan\u00e7adas';
});
setupBeginnerMode();

// Metronome functions
