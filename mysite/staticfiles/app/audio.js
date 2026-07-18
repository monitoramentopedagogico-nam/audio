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
const startTranscriptionBtn = document.getElementById('startTranscriptionBtn');
const stopTranscriptionBtn = document.getElementById('stopTranscriptionBtn');
const playTranscriptionBtn = document.getElementById('playTranscriptionBtn');
const clearTranscriptionBtn = document.getElementById('clearTranscriptionBtn');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const studentScoreContainer = document.getElementById('studentScoreContainer');
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
    arrangementBuilder, lyricMelodyBuilder, readingExecutionBuilder,
    ...progressPanels, ...profilePanels,
  ].filter(Boolean);
  const advancedPanels = allAdvanced.filter(el => !dedicatedPanels.includes(el));
  return {
    allAdvanced,
    stages: {
      practice: [document.getElementById('beginnerPanel')],
      repertoire: [arrangementBuilder, lyricMelodyBuilder],
      reading: [readingExecutionBuilder],
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
    ['practice','repertoire','progress','profile','reading','advanced'].forEach(name=>{
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

let MIN_NOTE_RMS = 0.003;
let SILENCE_RMS = 0.0015;
const MIN_PITCH_HZ = 45;
const MAX_PITCH_HZ = 1200;
const REFERENCE_TONE_GAIN = 0.45;
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
      MIN_NOTE_RMS = saved.minNoteRms;
      SILENCE_RMS = saved.silenceRms;
      calibratedNoiseRms = saved.noiseRms || SILENCE_RMS;
      calibratedNoteRms = saved.noteRms || MIN_NOTE_RMS;
      if(calibrationStatus) calibrationStatus.textContent = `Calibrado: ruído ${calibratedNoiseRms.toFixed(4)}, nota ${calibratedNoteRms.toFixed(4)}.`;
    }
  } catch(e) {
    console.warn('mic calibration load failed', e);
  }
}

function saveMicCalibration(noiseRms, noteRms){
  calibratedNoiseRms = noiseRms;
  calibratedNoteRms = noteRms;
  SILENCE_RMS = Math.max(0.0005, noiseRms * 1.8);
  MIN_NOTE_RMS = Math.max(SILENCE_RMS * 1.6, noteRms * 0.35, 0.0012);
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
  wetGain.gain.value = 0.16;
  convolver.connect(wetGain);
  wetGain.connect(ctx.destination);
  const bus = {input: convolver};
  referenceReverbBuses.set(ctx, bus);
  return bus;
}

function playReferenceTone(frequency, startTime, duration, destinationBus = null){
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

  output.gain.setValueAtTime(0.0001, startTime);
  output.gain.exponentialRampToValueAtTime(REFERENCE_TONE_GAIN, startTime + 0.08);
  output.gain.setValueAtTime(REFERENCE_TONE_GAIN, startTime + Math.max(0.12, duration - 0.18));
  output.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

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
    osc.stop(startTime + duration + 0.03);
  });

  filter.connect(output);
  if(destinationBus){
    output.connect(destinationBus);
  } else {
    output.connect(audioCtx.destination);
    output.connect(getReferenceReverbBus(audioCtx).input);
  }
  vibrato.start(startTime + 0.12);
  vibrato.stop(startTime + duration + 0.03);
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
    const duration = Math.max(0.08, Math.min(noteBeats * beat * 0.88, noteBeats * beat - 0.03));
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

  const tolerance = parseInt(toleranceCentsInput ? toleranceCentsInput.value || '30' : '30', 10) || 30;
  const diffCents = Math.round(1200 * Math.log2(pitch / targetFreq));
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
  const tolerance = parseInt(toleranceCentsInput ? toleranceCentsInput.value || '30' : '30', 10) || 30;
  const diffCents = Math.round(1200 * Math.log2(pitch / targetFreq));
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
function playClick(time){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square'; o.frequency.value = 1000;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(audioCtx.destination);
  const now = time || audioCtx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.5, now + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  o.start(now); o.stop(now + 0.09);
}

function startMetronome(){
  if(metronomeIntervalId) return;
  const bpm = clampBpm(metronomeBpm ? metronomeBpm.value : 60);
  if (metronomeBpm) metronomeBpm.value = bpm;
  const intervalMs = Math.round(60000 / bpm);
  playClick();
  metronomeIntervalId = setInterval(()=>{ playClick(); }, intervalMs);
  if(startMetronomeBtn) startMetronomeBtn.disabled = true;
  if(stopMetronomeBtn) stopMetronomeBtn.disabled = false;
  updateBeginnerMetronomeButton();
}

function stopMetronome(){
  if(!metronomeIntervalId) return;
  clearInterval(metronomeIntervalId); metronomeIntervalId = null;
  if(startMetronomeBtn) startMetronomeBtn.disabled = false;
  if(stopMetronomeBtn) stopMetronomeBtn.disabled = true;
  updateBeginnerMetronomeButton();
}

function clampBpm(value){
  const parsed = parseInt(value || '60', 10);
  return Math.max(30, Math.min(240, Number.isFinite(parsed) ? parsed : 60));
}

function updateTargetMatch(pitch){
  if(!targetNoteSelect || !targetMatchEl) return;
  const targetFreq = beginnerInstrument ? writtenNoteToSoundingFrequency(targetNoteSelect.value) : noteNameToFrequency(targetNoteSelect.value);
  const tol = Math.max(1, parseInt(toleranceCentsInput ? toleranceCentsInput.value || '30' : '30', 10) || 30);

  if(!targetFreq || !pitch){
    targetMatchEl.textContent = '—';
    targetMatchEl.style.color = '';
    return;
  }

  const diffCents = Math.round(1200 * Math.log2(pitch / targetFreq));
  const absDiff = Math.abs(diffCents);
  targetMatchEl.textContent = absDiff <= tol ? `Dentro (${diffCents} cents)` : `Fora (${diffCents} cents)`;
  targetMatchEl.style.color = absDiff <= tol ? '#195c49' : '#b73a32';
}

if(startMetronomeBtn) startMetronomeBtn.addEventListener('click', startMetronome);
if(stopMetronomeBtn) stopMetronomeBtn.addEventListener('click', stopMetronome);
if(metronomeBpm) metronomeBpm.addEventListener('change', ()=>{
  metronomeBpm.value = clampBpm(metronomeBpm.value);
  if(metronomeIntervalId){
    stopMetronome();
    startMetronome();
  }
});

async function syncLocalData(){
  if(!navigator.onLine){
    if(syncStatusEl) syncStatusEl.textContent = 'Offline — aguardando conexão';
    return;
  }
  if(syncStatusEl) syncStatusEl.textContent = 'Sincronizando...';
  try {
    const localSessions = JSON.parse(localStorage.getItem(sessionsStoreKey) || '[]').filter(s => !s.synced);
    const samples = await listSamples();
    const pendingSamples = samples.filter(s => !s.synced);
    const payload = { sessions: localSessions, samples: [] };
    for (const s of pendingSamples) {
      const b64 = await blobToBase64(s.blob);
      payload.samples.push({ id: s.id, date: s.date, labels: s.labels, features: s.features || {}, exercise: s.exercise || '', audio_b64: b64 });
    }
    const res = await fetch('/api/sync_local_data/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('sync failed');
    const data = await res.json();
    if (data.status === 'ok') {
      const updatedSessions = JSON.parse(localStorage.getItem(sessionsStoreKey) || '[]').map(s => ({...s, synced: true}));
      localStorage.setItem(sessionsStoreKey, JSON.stringify(updatedSessions));
      renderSessions();
      // mark indexeddb samples synced
      for (const s of pendingSamples) {
        await markSampleSynced(s.id);
      }
      if(syncStatusEl) syncStatusEl.textContent = `Sincronizado (${data.synced_sessions} sessões, ${data.synced_samples} amostras)`;
    }
  } catch (e) {
    console.error('syncLocalData failed', e);
    if(syncStatusEl) syncStatusEl.textContent = 'Falha na sincronização';
  }
}

async function markSampleSynced(id){
  const db = await openDatasetDB();
  const tx = db.transaction('samples','readwrite');
  const store = tx.objectStore('samples');
  const req = store.get(id);
  return new Promise((resolve,reject)=>{
    req.onsuccess = ()=>{
      const rec = req.result;
      if (!rec) { db.close(); resolve(); return; }
      rec.synced = true;
      const putReq = store.put(rec);
      putReq.onsuccess = ()=>{ db.close(); resolve(); };
      putReq.onerror = e=>{ db.close(); reject(e); };
    };
    req.onerror = e=>{ db.close(); reject(e); };
  });
}

if(syncLocalDataBtn) syncLocalDataBtn.addEventListener('click', ()=>syncLocalData());
if(progressSyncBtn) progressSyncBtn.addEventListener('click', async ()=>{
  if(progressSyncStatus) progressSyncStatus.textContent = 'Sincronizando...';
  await syncLocalData();
  if(progressSyncStatus && syncStatusEl) progressSyncStatus.textContent = syncStatusEl.textContent;
});
window.addEventListener('online', ()=>syncLocalData());
window.addEventListener('load', ()=>syncLocalData());

// Labeled data collection elements
const startLabelRec = document.getElementById('startLabelRec');
const stopLabelRec = document.getElementById('stopLabelRec');
const saveLabeledSample = document.getElementById('saveLabeledSample');
const exportDatasetBtn = document.getElementById('exportDataset');
const labelEmb = document.getElementById('labelEmb');
const labelAir = document.getElementById('labelAir');
const labelEffect = document.getElementById('labelEffect');
const labeledList = document.getElementById('labeledList');

let labeledRecorder = null;
let lastLabeledBlob = null;

// IndexedDB helper
function openDatasetDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open('sax_dataset', 1);
    req.onupgradeneeded = e => { const db = e.target.result; if(!db.objectStoreNames.contains('samples')) db.createObjectStore('samples', {keyPath:'id', autoIncrement:true}); };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function saveSampleToDB(blob, labels, exercise = '', features = {}){
  return openDatasetDB().then(db=>{
    return new Promise((resolve,reject)=>{
      const tx = db.transaction('samples','readwrite');
      const store = tx.objectStore('samples');
      const rec = {blob, labels, date: new Date().toISOString(), synced: false, exercise, features};
      const r = store.add(rec);
      r.onsuccess = ()=>{ resolve(r.result); db.close(); };
      r.onerror = e=>{ reject(e); db.close(); };
    });
  });
}

function listSamples(){
  return openDatasetDB().then(db=>{
    return new Promise((resolve,reject)=>{
      const tx = db.transaction('samples','readonly'); const store = tx.objectStore('samples');
      const req = store.getAll();
      req.onsuccess = ()=>{ resolve(req.result); db.close(); };
      req.onerror = e=>{ reject(e); db.close(); };
    });
  });
}

function renderLabeledList(){
  listSamples().then(arr=>{
    labeledList.innerHTML = '';
    arr.slice().reverse().forEach(s=>{
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href='#'; a.textContent = `${new Date(s.date).toLocaleString()} — ${s.labels.emb} / ${s.labels.air} / ${s.labels.effect}`;
      a.addEventListener('click', ()=>{ const url = URL.createObjectURL(s.blob); window.open(url); setTimeout(()=>URL.revokeObjectURL(url),5000); });
      li.appendChild(a); labeledList.appendChild(li);
    });
  }).catch(e=>{ console.error('listSamples failed', e); });
}

function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader(); fr.onload = ()=>resolve(fr.result.split(',')[1]); fr.onerror = e=>reject(e); fr.readAsDataURL(blob);
  });
}

startLabelRec && startLabelRec.addEventListener('click', ()=>{
  if(!mediaDest || !mediaDest.stream){ alert('Inicie captura primeiro'); return; }
  labeledRecorder = new MediaRecorder(mediaDest.stream);
  const chunks = [];
  labeledRecorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
  labeledRecorder.onstop = async ()=>{
    const blob = new Blob(chunks,{type:chunks[0].type || 'audio/webm'});
    lastLabeledBlob = blob; saveLabeledSample.disabled = false; stopLabelRec.disabled = true; startLabelRec.disabled = false;
  };
  labeledRecorder.start(); startLabelRec.disabled = true; stopLabelRec.disabled = false; saveLabeledSample.disabled = true;
});

stopLabelRec && stopLabelRec.addEventListener('click', ()=>{ if(labeledRecorder && labeledRecorder.state==='recording') labeledRecorder.stop(); });

saveLabeledSample && saveLabeledSample.addEventListener('click', ()=>{
  if(!lastLabeledBlob){ alert('Nenhuma gravação disponível'); return; }
  const labels = {emb: labelEmb.value, air: labelAir.value, effect: labelEffect.value};
  saveSampleToDB(lastLabeledBlob, labels, exerciseSelect ? exerciseSelect.value : '', prevRms !== undefined ? {rms: prevRms} : {}).then(id=>{ renderLabeledList(); saveLabeledSample.disabled = true; lastLabeledBlob = null; alert('Amostra salva: id '+id); syncLocalData(); }).catch(e=>{ console.error(e); alert('Erro ao salvar amostra'); });
  // try upload to server
  try{
    const fd = new FormData(); fd.append('audio', lastLabeledBlob, 'labeled_'+Date.now()+'.webm'); fd.append('labels', JSON.stringify(labels)); fd.append('exercise', exerciseSelect ? exerciseSelect.value : '');
    // include features snapshot if available
    if(prevRms !== undefined){ const features = {rms: prevRms}; fd.append('features', JSON.stringify(features)); }
    fetch('/api/upload_sample/', {method:'POST', body: fd, headers: {'X-CSRFToken': getCSRF()}})
      .then(r=>{
        if(r.status===401) { console.log('Not authenticated to upload sample'); return; }
        return r.json();
      }).then(j=>{ if(j && j.status==='ok') console.log('Uploaded labeled sample', j); }).catch(e=>{ console.error('upload_sample failed', e); });
  }catch(e){ console.error('upload attempt failed', e); }
});

exportDatasetBtn && exportDatasetBtn.addEventListener('click', async ()=>{
  const samples = await listSamples();
  const out = [];
  for(const s of samples){
    const b64 = await blobToBase64(s.blob);
    out.push({id:s.id, date:s.date, labels:s.labels, audio_b64:b64});
  }
  const blob = new Blob([JSON.stringify(out)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sax_dataset.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

renderLabeledList();

function start(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    setBeginnerStatus('bad', 'Sem microfone', 'Abra pelo localhost ou HTTPS e permita o acesso ao microfone.');
    alert('Microfone indisponivel. Abra pelo localhost/HTTPS e permita o acesso ao microfone.');
    return;
  }
  pitchHistory = [];
  noteHistory = [];
  lastDetectedNote = null;
  currentEstimatedPitch = null;
  noteDisplay = null;
  startBtn.disabled = true; stopBtn.disabled = false;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  captureStartTime = performance.now();
  scoreEvents = [];
  currentScoreEvent = null;
  const audioConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1
  };
  navigator.mediaDevices.getUserMedia({audio: audioConstraints}).then(stream=>{
    if(transcriptionStatus) transcriptionStatus.textContent = 'Microfone ativo. Toque notas claras e sustente cada figura pelo tempo desejado.';
    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    gainNode = audioCtx.createGain();
    // high-pass filter. Keep it low enough for weak mobile microphones and lower sax notes.
    const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
    // media stream destination for recording processed audio
    mediaDest = audioCtx.createMediaStreamDestination();
    // attach to objects for debugging
    window.__hp = hp; window.__mediaDest = mediaDest;

    // hp -> analyser (for spectrum) and hp -> gainNode (for recording)
    source.connect(hp);
    hp.connect(analyser);
    hp.connect(gainNode);
    gainNode.connect(mediaDest);

    // use AudioWorklet for low-latency frame access
    silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
    let frameProcessorStarted = false;
    if(!audioCtx.audioWorklet || !audioCtx.audioWorklet.addModule){
      startScriptProcessorFallback(hp);
    } else {
    audioCtx.audioWorklet.addModule(window.SAX_AUDIO_WORKLET_URL || '/static/app/audio-worklet-processor.js').then(()=>{
      workletNode = new AudioWorkletNode(audioCtx, 'frame-processor', {processorOptions:{frameSize:2048}});
      frameProcessorStarted = true;

      // hp -> worklet -> silentGain -> destination (so worklet receives audio)
      hp.connect(workletNode);
      workletNode.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      // receive frames from worklet
      workletNode.port.onmessage = evt => {
        const floatBuf = evt.data; // Float32Array
        // compute RMS and pitch
        const buf = floatBuf;
        let sum=0; for(let i=0;i<buf.length;i++){ sum += buf[i]*buf[i]; }
        const rms = Math.sqrt(sum/buf.length);
        captureCalibrationSample(rms);
        // draw spectrum from analyser
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        drawSpectrum(freqData);
        // compute spectral centroid
        let centroid = 0; let magSum = 0;
        const nyquist = audioCtx.sampleRate/2;
        for(let i=0;i<freqData.length;i++){
          const mag = freqData[i];
          const freq = i * nyquist / freqData.length;
          centroid += freq * mag;
          magSum += mag;
        }
        const centroidHz = magSum>0 ? centroid / magSum : 0;
        if(centroidValEl) centroidValEl.textContent = centroidHz ? Math.round(centroidHz)+' Hz' : '—';
        // spectral flux
        let flux = 0;
        const mags = Float32Array.from(freqData);
        if(prevMagnitudes){
          for(let i=0;i<mags.length;i++){ const d = Math.max(0, mags[i] - prevMagnitudes[i]); flux += d; }
        }
        prevMagnitudes = mags;
        if(fluxValEl) fluxValEl.textContent = flux.toFixed(1);
        // HNR estimate from autocorrelation peak ratio
        let hnrDb = '—';
        try{
          const acMax = (()=>{
            const buf = floatBuf; const N = buf.length; let max=-Infinity; for(let lag=1;lag<Math.floor(N/2);lag++){ let s=0; for(let i=0;i<Math.floor(N/2);i++){ s += buf[i]*buf[i+lag]; } if(s>max) max=s; } return max;
          })();
          const energy = floatBuf.reduce((a,b)=>a+Math.abs(b),0)/floatBuf.length;
          if(acMax && energy){ const ratio = Math.max(1e-6, acMax / energy); hnrDb = (10*Math.log10(ratio)).toFixed(1)+' dB'; }
        }catch(e){ }
        if(hnrValEl) hnrValEl.textContent = hnrDb;
        // attack detection (fast increase in RMS)
        const currentRms = rms;
        let attack = false;
        if(currentRms - prevRms > 0.03) attack = true;
        prevRms = currentRms;
        if(attackValEl) attackValEl.textContent = attack ? 'sim' : '—';
        // update RMS meter
        if(rmsFillEl) rmsFillEl.style.width = Math.min(100, Math.round(Math.min(1, rms*12)*100)) + '%';
        // draw spectrogram column
        if(specCtx && specCanvas){
          const w = specCanvas.width = specCanvas.clientWidth;
          const h = specCanvas.height = specCanvas.clientHeight;
          // shift canvas left
          const img = specCtx.getImageData(1,0,w-1,h);
          specCtx.putImageData(img,0,0);
          // draw new column at right
          for(let y=0;y<h;y++){
            const bin = Math.floor((y / h) * freqData.length);
            const v = freqData[bin];
            specCtx.fillStyle = `rgb(${v},${v*0.6|0},${v*0.2|0})`;
            specCtx.fillRect(w-1, h-1-y, 1, 1);
          }
        }

        updatePitchEstimate(buf, rms, audioCtx.sampleRate);

        captureTranscriptionNote(detectNoteFromPitch(currentEstimatedPitch, rms), rms);

        analyzeAndSuggest(freqData, currentEstimatedPitch);
        updateLevel(freqData);
        pitchLabel.textContent = currentEstimatedPitch ? currentEstimatedPitch.toFixed(1) : '—';
        if(beginnerActive && !currentEstimatedPitch && rms >= SILENCE_RMS){
          setBeginnerStatus('close', 'Sinal baixo', 'Estou ouvindo som, mas ainda sem nota clara. Aproxime o celular e sustente a nota.');
        }
        // update tuning UI: cents offset and stability
        try {
          const centsInfo = centsFromPitch(currentEstimatedPitch);
          if(centsLabel) centsLabel.textContent = centsInfo ? (centsInfo.cents > 0 ? '+'+centsInfo.cents : centsInfo.cents)+' cents' : '—';
          if(tuningNeedle && tuningMeter){
            const c = centsInfo ? Math.max(-200, Math.min(200, centsInfo.cents)) : 0;
            const percent = 50 + (c / 200) * 50; // map -200..+200 cents to 0..100%
            tuningNeedle.style.left = percent + '%';
          }
          const stable = checkPitchStability();
          if(stabilityLabel) stabilityLabel.textContent = stable === null ? '—' : (stable ? 'estável' : 'instável');
          const currentNoteEl = document.getElementById('currentNote');
          if(currentNoteEl) currentNoteEl.textContent = centsInfo ? centsInfo.note : (detectNoteFromPitch(currentEstimatedPitch, rms) || '—');
          updateDashboardSummary(
            currentNoteEl ? currentNoteEl.textContent : '',
            currentEstimatedPitch,
            centsLabel ? centsLabel.textContent : ''
          );
        } catch(e){ console.error('tuning UI update failed', e); }

        // check target match
        try{
          if(targetNoteSelect && targetMatchEl){
            updateTargetMatch(currentEstimatedPitch);
          }
          updateBeginnerPanel(currentEstimatedPitch, rms);
        }catch(e){ console.error('target check error', e); }

        // AGC (affects monitor gain)
        const target = 0.08; // desired RMS
        let desiredGain = target / (rms + 1e-6);
        desiredGain = Math.max(0.25, Math.min(4, desiredGain));
        if (gainNode) gainNode.gain.value += (desiredGain - gainNode.gain.value) * 0.05;

        // if recording WAV, store copy
        if (recordingFlag) {
          recordedFrames.push(new Float32Array(buf));
        }
        // if exercise active, save snapshot and provide feedback
        const features = { rms: currentRms, centroid: centroidHz, flux: flux, hnr: hnrDb, attack: attack, pitch: currentEstimatedPitch };
        if(exerciseActive){
          sessionSnapshots.push({t: performance.now()-captureStartTime, features});
          const adv = evaluateEmbouchure(features);
          // show up to 3 advices
          feedbackList.innerHTML = '';
          adv.slice(0,3).forEach(a=>{ const li = document.createElement('li'); li.textContent = a; feedbackList.appendChild(li); });
        }
      };
    }).catch(err=>{
      console.error('AudioWorklet load failed', err);
      if(!frameProcessorStarted) startScriptProcessorFallback(hp);
    });
    }
    // route processed signal (hp -> gain) for monitoring/recording
    if(monitor.checked){ gainNode.connect(audioCtx.destination); }
  }).catch(err=>{
    const message = err && err.name === 'NotAllowedError'
      ? 'Permita o uso do microfone no navegador e toque em Comecar novamente.'
      : 'Nao consegui acessar o microfone. Use HTTPS/local seguro e verifique a permissao.';
    console.error('microphone access failed', err);
    setBeginnerStatus('bad', 'Microfone bloqueado', message);
    alert('Erro ao acessar microfone: '+(err && err.message ? err.message : 'permissao negada'));
    if(startBtn) startBtn.disabled=false;
    if(stopBtn) stopBtn.disabled=true;
    if(beginnerStartBtn) beginnerStartBtn.disabled=false;
    setBeginnerStartButtonListening(false);
    if(beginnerStopBtn) beginnerStopBtn.disabled=true;
    beginnerActive = false;
    calibrationMode = null;
    if(calibrateMicBtn) calibrateMicBtn.disabled = false;
    if(calibrationStatus) calibrationStatus.textContent = 'Falha ao acessar o microfone.';
    if(transcriptionStatus) transcriptionStatus.textContent = message;
    if(startTranscriptionBtn) startTranscriptionBtn.disabled = false;
    if(stopTranscriptionBtn) stopTranscriptionBtn.disabled = true;
  });
}

function captureTranscriptionNote(note, rms){
  const currentTime = performance.now() - captureStartTime;
  if(note && hasUsableSignal(rms)){
    if(note !== lastDetectedNote){
      if(currentScoreEvent) currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
      currentScoreEvent = {note, start:currentTime, duration:0};
      scoreEvents.push(currentScoreEvent);
      lastDetectedNote = note;
      noteHistory.push(note);
      if(noteHistory.length > 16) noteHistory.shift();
      updateNoteDisplay();
      if(transcriptionStatus) transcriptionStatus.textContent = `Captando: ${noteToWrittenSolfege(note)} (${note}) · ${scoreEvents.length} nota${scoreEvents.length === 1 ? '' : 's'}`;
    }
  } else if(lastDetectedNote && currentScoreEvent){
    currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
    currentScoreEvent = null;
    lastDetectedNote = null;
  }
}

function startScriptProcessorFallback(inputNode){
  if(!audioCtx || !inputNode) return;
  setBeginnerStatus('ready', 'Ouvindo', 'Microfone ativo. Toque a nota alvo com som claro.');
  processor = audioCtx.createScriptProcessor(2048, 1, 1);
  inputNode.connect(processor);
  if(!silentGain){
    silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
  }
  processor.connect(silentGain);
  silentGain.connect(audioCtx.destination);
  processor.onaudioprocess = event => {
    const buf = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for(let i=0;i<buf.length;i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    captureCalibrationSample(rms);
    updatePitchEstimate(buf, rms, audioCtx.sampleRate);
    captureTranscriptionNote(detectNoteFromPitch(currentEstimatedPitch, rms), rms);
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);
    drawSpectrum(freqData);
    updateLevel(freqData);
    if(rmsFillEl) rmsFillEl.style.width = Math.min(100, Math.round(Math.min(1, rms*12)*100)) + '%';
    if(pitchLabel) pitchLabel.textContent = currentEstimatedPitch ? currentEstimatedPitch.toFixed(1) : '—';
    if(beginnerActive && !currentEstimatedPitch && rms >= SILENCE_RMS){
      setBeginnerStatus('close', 'Sinal baixo', 'Estou ouvindo som, mas ainda sem nota clara. Aproxime o celular e sustente a nota.');
    }
    updateTargetMatch(currentEstimatedPitch);
    updateBeginnerPanel(currentEstimatedPitch, rms);
  };
}

function stop(){
  startBtn.disabled = false; stopBtn.disabled = true;
  const currentTime = performance.now() - captureStartTime;
  if (currentScoreEvent) {
    currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
    currentScoreEvent = null;
  }
  if(processor) processor.disconnect();
  if(analyser) analyser.disconnect();
  if(source && source.mediaStream) {
    source.mediaStream.getTracks().forEach(t=>t.stop());
  }
  if(processor) processor.disconnect();
  if(silentGain) silentGain.disconnect();
  if(gainNode) gainNode.disconnect();
  if(mediaDest && mediaDest.stream) {
    try{ mediaDest.stream.getTracks().forEach(t=>t.stop()); }catch(e){}
    mediaDest = null;
  }
  stopMetronome();
  if(audioCtx) audioCtx.close();
  audioCtx = null;
  cancelAnimationFrame(raf);
  updateNoteDisplay();
  renderStudentTranscription();
}

async function renderStudentTranscription(){
  if(!studentScoreContainer || !scoreEvents.length || !window.opensheetmusicdisplay) return;
  try{
    studentScoreContainer.innerHTML = '';
    studentTranscriptionOsmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(studentScoreContainer, {
      autoResize:true,
      backend:'svg',
      drawTitle:false,
      drawingParameters:'compacttight',
    });
    await studentTranscriptionOsmd.load(buildMusicXML(scoreEvents));
    studentTranscriptionOsmd.render();
  }catch(error){
    console.error('Nao foi possivel desenhar a transcricao completa.', error);
    renderScore();
  }
}

function drawSpectrum(data){
  const w = canvas.width, h = canvas.height; ctx.clearRect(0,0,w,h);
  const binWidth = w / data.length;
  ctx.fillStyle = '#0f0';
  for(let i=0;i<data.length;i+=2){
    const v = data[i]/255;
    const y = v*h;
    ctx.fillRect(i*binWidth, h-y, binWidth, y);
  }
  if (currentEstimatedPitch && audioCtx) {
    const x = Math.min(w - 1, (currentEstimatedPitch / (audioCtx.sampleRate / 2)) * w);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

function updateLevel(data){
  // approximate RMS from frequency bins
  let sum=0; for(let i=0;i<data.length;i++){ sum += (data[i]/255)*(data[i]/255); }
  const rms = Math.sqrt(sum/data.length);
  const percent = Math.min(1, rms*1.6);
  meterFill.style.width = (percent*100)+'%';
  if(percent>0.85) meterFill.style.background = '#b73a32'; else meterFill.style.background = '#2d7a62';
}

let lastAdvice = '';
function analyzeAndSuggest(data, pitch){
  const lowSlice = data.slice(0,50); const midSlice = data.slice(50,280); const highSlice = data.slice(280);
  const lowAvg = lowSlice.reduce((a,b)=>a+b,0)/lowSlice.length;
  const midAvg = midSlice.reduce((a,b)=>a+b,0)/midSlice.length;
  const highAvg = highSlice.reduce((a,b)=>a+b,0)/highSlice.length;
  const adv = [];
  if(lowAvg > 90) adv.push('Muita presença em graves — mova o microfone para longe ou mantenha 10-15cm de distância.');
  if(midAvg < 40) adv.push('Médio fraco — concentre-se em um sopro mais centrado e embocadura firme.');
  if(highAvg > 80) adv.push('Agudos fortes — controle a sibilância e evite soprões excessivos.');
  if(midAvg > 70 && highAvg < 70) adv.push('Boa presença média — esse é o timbre que se aproxima da referência.');
  const peak = Math.max(...data);
  if(peak < 60) adv.push('Nível baixo — aproxime o microfone ou aumente o apoio do ar.');
  if(peak > 240) adv.push('Nível muito alto — diminua o ganho ou afaste o microfone para evitar distorção.');
  if (!pitch) adv.push('Pitch não detectado com clareza — verifique ruído e posição do microfone.');
  else {
    if(pitch < 130) adv.push('Pitch abaixo da faixa típica do sax — sopre com mais apoio ou ajuste a embocadura.');
    if(pitch > 900) adv.push('Pitch acima da faixa típica do sax — mantenha a embocadura estável e não force agudos.');
    const stable = checkPitchStability();
    if(stable === false) adv.push('Pitch instável — trabalhe a embocadura e evite respirações bruscas.');
  }
  if (adv.length === 0) adv.push('Som bom — continue controlando postura e fluxo de ar.');
  const text = adv.join('\n');
  if(text !== lastAdvice){
    lastAdvice = text; suggestList.innerHTML = '';
    const lines = text.split('\n');
    for(const l of lines){ const li = document.createElement('li'); li.textContent = l; suggestList.appendChild(li); }
  }
}

function checkPitchStability(){
  const valid = pitchHistory.filter(v=>v && !isNaN(v));
  if(valid.length < 8) return null;
  let sumDiff = 0;
  for(let i=1;i<valid.length;i++){ sumDiff += Math.abs(valid[i]-valid[i-1]); }
  const avgDiff = sumDiff / (valid.length - 1);
  return avgDiff < 15;
}

async function analyzeRecording(blob){
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  let sumSquare = 0;
  let maxAmp = 0;
  for(let i=0;i<totalSamples;i++){ const v = channelData[i]; sumSquare += v*v; maxAmp = Math.max(maxAmp, Math.abs(v)); }
  const rms = Math.sqrt(sumSquare / totalSamples);
  const peakDb = 20 * Math.log10(maxAmp + 1e-8);
  const averageDb = 20 * Math.log10(rms + 1e-8);
  const pitches = [];
  const frameSize = 2048;
  for (let offset = 0; offset + frameSize < totalSamples; offset += 1024) {
    const frame = channelData.slice(offset, offset + frameSize);
    let pitch = yinPitch(frame, audioCtx.sampleRate);
    if (!pitch) pitch = autoCorrelate(frame, audioCtx.sampleRate);
    if(pitch) pitches.push(pitch);
  }
  const validPitches = pitches.filter(p=>p && !isNaN(p));
  const avgPitch = validPitches.length ? validPitches.reduce((a,b)=>a+b,0)/validPitches.length : null;
  const pitchStability = validPitches.length > 1 ? validPitches.reduce((sum,p,i)=> i ? sum + Math.abs(p - validPitches[i-1]) : sum, 0) / (validPitches.length-1) : null;
  const suggestions = [];
  if (maxAmp > 0.95) suggestions.push('A gravação está muito próxima do clipping; tente reduzir o ganho.');
  if (averageDb < -36) suggestions.push('A gravação está fraca; aproxime o microfone ou aumente o apoio do ar.');
  if (avgPitch && avgPitch < 130) suggestions.push('O pitch médio está abaixo da faixa típica de sax — verifique sua embocadura.');
  if (avgPitch && avgPitch > 900) suggestions.push('O pitch médio está elevado — evite soprar excessivamente forte nos agudos.');
  if (pitchStability !== null && pitchStability > 20) suggestions.push('O pitch ficou instável durante a gravação; pratique sustentação de ar e embocadura estável.');
  if (!suggestions.length) suggestions.push('A gravação tem boa estabilidade e nível; continue aperfeiçoando sua musicalidade.');
  recordingAnalysis.innerHTML = '';
  const summary = [
    `Duração: ${audioBuffer.duration.toFixed(2)} s`,
    `Nível médio: ${averageDb.toFixed(1)} dBFS`,
    `Pico máximo: ${peakDb.toFixed(1)} dBFS`,
    `Pitch médio: ${avgPitch ? avgPitch.toFixed(1) + ' Hz' : 'não detectado'}`,
    `Estabilidade de pitch: ${pitchStability !== null ? pitchStability.toFixed(1) + ' Hz/frame' : 'indefinida'}`
  ];
  summary.forEach(text=>{ const li = document.createElement('li'); li.textContent = text; recordingAnalysis.appendChild(li); });
  const title = document.createElement('li'); title.textContent = 'Sugestões de melhoria:'; title.style.fontWeight = 'bold'; recordingAnalysis.appendChild(title);
  suggestions.forEach(text=>{ const li = document.createElement('li'); li.textContent = text; recordingAnalysis.appendChild(li); });
}

function estimatePitchFromSpectrum(data){
  if (!audioCtx || !analyser) return null;
  const minBin = Math.floor(80 * analyser.fftSize / audioCtx.sampleRate);
  const maxBin = Math.min(data.length - 1, Math.floor(900 * analyser.fftSize / audioCtx.sampleRate));
  if (maxBin <= minBin) return null;
  let bestIndex = -1;
  let bestValue = -Infinity;
  for (let i = minBin; i <= maxBin; i++) {
    if (data[i] > bestValue) {
      bestValue = data[i];
      bestIndex = i;
    }
  }
  if (bestIndex < 0) return null;
  return (bestIndex * audioCtx.sampleRate) / analyser.fftSize;
}

function centsFromPitch(pitch){
  if(!pitch) return null;
  const a4 = 440;
  const midi = 12 * Math.log2(pitch / a4) + 69;
  const midiRounded = Math.round(midi);
  const targetFreq = 440 * Math.pow(2, (midiRounded - 69) / 12);
  const cents = Math.round(1200 * Math.log2(pitch / targetFreq));
  const noteNames = ['Dó','Dó#','Ré','Ré#','Mi','Fá','Fá#','Sol','Sol#','Lá','Lá#','Si'];
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const octave = Math.floor(midiRounded / 12) - 1;
  return {note: `${noteNames[noteIndex]}${octave}`, cents, targetFreq, midi: midiRounded};
}

function hasUsableSignal(rms){
  return rms >= MIN_NOTE_RMS;
}

function updatePitchEstimate(buf, rms, sampleRate){
  if(rms < SILENCE_RMS){
    missedPitchFrames += 1;
    if(missedPitchFrames > 3) currentEstimatedPitch = null;
    return null;
  }

  let pitch = null;
  if(hasUsableSignal(rms)){
    pitch = yinPitch(buf, sampleRate) || autoCorrelate(buf, sampleRate);
  }

  if(pitch){
    missedPitchFrames = 0;
    currentEstimatedPitch = currentEstimatedPitch ? currentEstimatedPitch * 0.55 + pitch * 0.45 : pitch;
    pitchHistory.push(currentEstimatedPitch);
    if(pitchHistory.length > 80) pitchHistory.shift();
  } else {
    missedPitchFrames += 1;
    if(missedPitchFrames > 10) currentEstimatedPitch = null;
  }
  return currentEstimatedPitch;
}

function detectNoteFromPitch(pitch, rms){
  if (!pitch || !hasUsableSignal(rms)) return null;
  const a4 = 440;
  const midi = 12 * Math.log2(pitch / a4) + 69;
  const midiRounded = Math.round(midi);
  return midiToNoteName(midiRounded);
}

function getNoteY(noteName){
  if(/^[A-G](?:#|b)?-?\d+$/.test(String(noteName || ''))) return noteYFromScientificName(noteName);
  const noteMap = {
    'do': 0, 'do#': 1, 're': 2, 're#': 3, 'mi': 4,
    'fa': 5, 'fa#': 6, 'sol': 7, 'sol#': 8, 'la': 9, 'la#': 10, 'si': 11
  };
  const match = noteName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/^([a-z#]+)(-?\d+)$/);
  if (!match) return 78;
  const base = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = noteMap[base];
  if (semitone === undefined) return 78;
  const midiNote = (octave + 1) * 12 + semitone;
  const y = 110 - (midiNote - 60) * 3;
  return Math.max(20, Math.min(118, y));
}

function renderScore(){
  if (!scoreContainer) return;
  const visibleNotes = scoreEvents.slice(-12);
  if (!visibleNotes.length) {
    scoreContainer.innerHTML = '<p style="margin:0;color:#666;">Aguardando notas...</p>';
    if(studentScoreContainer) studentScoreContainer.innerHTML = '<p style="margin:0;color:#666;">Aguardando notas...</p>';
    return;
  }
  const width = 560;
  const height = 140;
  const staffTop = 34;
  const lineGap = 10;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Partitura com notas detectadas');

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', `${width}`);
  bg.setAttribute('height', `${height}`);
  bg.setAttribute('fill', '#fff');
  svg.appendChild(bg);

  for (let i = 0; i < 5; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '20');
    line.setAttribute('x2', `${width - 20}`);
    line.setAttribute('y1', `${staffTop + i * lineGap}`);
    line.setAttribute('y2', `${staffTop + i * lineGap}`);
    line.setAttribute('stroke', '#222');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  const timeSignature = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  timeSignature.setAttribute('x', '26');
  timeSignature.setAttribute('y', `${staffTop + lineGap * 1.5}`);
  timeSignature.setAttribute('font-size', '18');
  timeSignature.setAttribute('fill', '#111');
  timeSignature.textContent = transcriptionMeter ? transcriptionMeter.value : '4/4';
  svg.appendChild(timeSignature);

  const measureWidth = 160;
  for (let bar = 0; bar <= 3; bar++) {
    const xBar = 40 + bar * measureWidth;
    const barLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    barLine.setAttribute('x1', `${xBar}`);
    barLine.setAttribute('x2', `${xBar}`);
    barLine.setAttribute('y1', `${staffTop - 10}`);
    barLine.setAttribute('y2', `${staffTop + lineGap * 4 + 10}`);
    barLine.setAttribute('stroke', '#444');
    barLine.setAttribute('stroke-width', bar === 0 ? '2' : '1');
    svg.appendChild(barLine);
  }

  const visibleDurations = visibleNotes.map(event => event.duration > 0 ? event.duration : Math.max(120, performance.now() - captureStartTime - event.start));
  const totalDuration = visibleDurations.reduce((sum, d) => sum + Math.max(120, d), 0);
  let currentX = 40;
  const totalWidth = width - 80;

  visibleNotes.forEach((event, index) => {
    const liveDuration = event.duration > 0 ? event.duration : Math.max(120, performance.now() - captureStartTime - event.start);
    const dur = Math.max(120, liveDuration);
    const quant = quantizeDuration(dur);
    const noteWidth = Math.max(36, (quant.ms / totalDuration) * totalWidth * 2);
    const x = currentX;
    const y = getNoteY(event.note);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', `${x}`);
    rect.setAttribute('y', `${y - 8}`);
    rect.setAttribute('width', `${noteWidth}`);
    rect.setAttribute('height', '16');
    rect.setAttribute('fill', 'rgba(30,58,138,0.12)');
    rect.setAttribute('stroke', 'rgba(30,58,138,0.4)');
    rect.setAttribute('stroke-width', '1');
    svg.appendChild(rect);

    const head = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    head.setAttribute('cx', `${x + noteWidth / 2}`);
    head.setAttribute('cy', `${y}`);
    head.setAttribute('rx', '8');
    head.setAttribute('ry', '6');
    head.setAttribute('fill', quant.label === 'mínima' || quant.label === 'semibreve' ? '#fff' : '#1e3a8a');
    head.setAttribute('stroke', '#111');
    head.setAttribute('stroke-width', '1');
    svg.appendChild(head);

    if (quant.label !== 'semibreve') {
      const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      stem.setAttribute('x1', `${x + noteWidth / 2 + 8}`);
      stem.setAttribute('x2', `${x + noteWidth / 2 + 8}`);
      stem.setAttribute('y1', `${y}`);
      stem.setAttribute('y2', `${y - 24}`);
      stem.setAttribute('stroke', '#111');
      stem.setAttribute('stroke-width', '1.2');
      svg.appendChild(stem);

      if (quant.label === 'colcheia' || quant.label === 'semicolcheia') {
        const flagCount = quant.label === 'semicolcheia' ? 2 : 1;
        for (let f = 0; f < flagCount; f++) {
          const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const yFlag = y - 24 + f * 6;
          const path = `M ${x + noteWidth / 2 + 8} ${yFlag} q 8 4 0 8`;
          flag.setAttribute('d', path);
          flag.setAttribute('fill', 'none');
          flag.setAttribute('stroke', '#111');
          flag.setAttribute('stroke-width', '1.2');
          svg.appendChild(flag);
        }
      }
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', `${x + noteWidth / 2 - 8}`);
    label.setAttribute('y', `${y + 20}`);
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#333');
    label.textContent = event.note;
    svg.appendChild(label);

    const durationLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    durationLabel.setAttribute('x', `${x + noteWidth / 2 - 12}`);
    durationLabel.setAttribute('y', `${y + 34}`);
    durationLabel.setAttribute('font-size', '8');
    durationLabel.setAttribute('fill', '#444');
    durationLabel.textContent = getNoteDurationLabel(dur);
    svg.appendChild(durationLabel);

    currentX += noteWidth + 8;
  });

  scoreContainer.innerHTML = '';
  scoreContainer.appendChild(svg);
  if(studentScoreContainer){
    studentScoreContainer.innerHTML = '';
    studentScoreContainer.appendChild(svg.cloneNode(true));
  }
}

function normalizeNoteName(noteName){
  return noteName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function frequencyFromNoteName(noteName){
  const map = {
    'do': 0, 'do#': 1, 're': 2, 're#': 3, 'mi': 4,
    'fa': 5, 'fa#': 6, 'sol': 7, 'sol#': 8, 'la': 9, 'la#': 10, 'si': 11
  };
  const match = normalizeNoteName(noteName).match(/^([a-z#]+)(-?\d+)$/);
  if (!match) return null;
  const semitone = map[match[1]];
  if (semitone === undefined) return null;
  const octave = parseInt(match[2], 10);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function noteNameToFrequency(noteName){
  const midi = noteNameToMidiNumber(noteName);
  return midi === null ? null : midiToFrequency(midi);
}

function noteNameToMidiNumber(noteName){
  if(!noteName) return null;

  const portugueseFrequency = frequencyFromNoteName(noteName);
  if(portugueseFrequency) return Math.round(69 + 12 * Math.log2(portugueseFrequency / 440));

  const normalized = noteName.trim().toUpperCase().replace('\u266f', '#').replace('\u266d', 'B');
  const match = normalized.match(/^([A-G])([#B]?)(-?\d+)$/);
  if(!match) return null;

  const semitones = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
  let semitone = semitones[match[1]];
  if(match[2] === '#') semitone += 1;
  if(match[2] === 'B') semitone -= 1;

  const octave = parseInt(match[3], 10);
  return (octave + 1) * 12 + semitone;
}

function midiToFrequency(midi){
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToNoteName(midi){
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const rounded = Math.round(midi);
  const note = names[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${note}${octave}`;
}

const READING_MAJOR_KEYS = {
  '-5':{root:'Db4', name:'Reb maior'}, '-4':{root:'Ab4', name:'Lab maior'},
  '-3':{root:'Eb4', name:'Mib maior'}, '-2':{root:'Bb4', name:'Sib maior'},
  '-1':{root:'F4', name:'Fa maior'}, '0':{root:'C4', name:'Do maior'},
  '1':{root:'G4', name:'Sol maior'}, '2':{root:'D4', name:'Re maior'},
  '3':{root:'A4', name:'La maior'}, '4':{root:'E4', name:'Mi maior'},
  '5':{root:'B4', name:'Si maior'}, '6':{root:'F#4', name:'Fa# maior'}
};

function readingKeyFifthsForRoot(root){
  const match = Object.entries(READING_MAJOR_KEYS).find(([, value])=>value.root === root);
  return match ? Number(match[0]) : 0;
}

function syncReadingKeyControl(keyFifths, root){
  if(!readingKey) return;
  const key = READING_MAJOR_KEYS[String(keyFifths)] || null;
  const value = root || (key ? key.root : 'C4');
  if(Array.from(readingKey.options).some(option=>option.value === value)) readingKey.value = value;
}

function transposeReadingNote(note, semitones, preferFlats = false){
  const midi = noteNameToMidiNumber(note);
  if(midi === null) return note;
  const names = preferFlats
    ? ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
    : ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const transposedMidi = Math.round(midi + semitones);
  return `${names[((transposedMidi % 12) + 12) % 12]}${Math.floor(transposedMidi / 12) - 1}`;
}

function transposeImportedReadingScore(){
  if(!currentReadingExercise || !readingKey || !currentReadingExercise.baseNotes) return false;
  const baseRoot = currentReadingExercise.baseKeyRoot || 'C4';
  const baseMidi = noteNameToMidiNumber(baseRoot);
  const targetMidi = noteNameToMidiNumber(readingKey.value);
  if(baseMidi === null || targetMidi === null) return false;
  let semitones = targetMidi - baseMidi;
  while(semitones > 6) semitones -= 12;
  while(semitones < -6) semitones += 12;
  currentReadingExercise.transposeSemitones = semitones;
  const targetFifths = readingKeyFifthsForRoot(readingKey.value);
  currentReadingExercise.notes = currentReadingExercise.baseNotes.map(note=>transposeReadingNote(note, semitones, targetFifths < 0));
  currentReadingExercise.key = readingKey.value;
  currentReadingExercise.keyFifths = targetFifths;
  readingScorePage = 0;
  renderReadingScore(currentReadingExercise);
  renderReadingNotes(currentReadingExercise);
  if(readingSummary) readingSummary.textContent = `${currentReadingExercise.title}: tom ${noteToSolfege(readingKey.value)} maior, ${currentReadingExercise.meter}, ${currentReadingExercise.bpm} BPM.`;
  return true;
}

function noteToSolfege(noteName){
  const midi = noteNameToMidiNumber(noteName);
  if(midi === null) return noteName || '';
  const names = ['Do','Do#','Re','Mib','Mi','Fa','Fa#','Sol','Lab','La','Sib','Si'];
  return names[((midi % 12) + 12) % 12];
}

function noteToWrittenSolfege(noteName){
  const match = String(noteName || '').match(/^([A-G])([#b]*)(?:-?\d+)?$/);
  if(!match) return noteToSolfege(noteName);
  const names = {C:'Do', D:'Re', E:'Mi', F:'Fa', G:'Sol', A:'La', B:'Si'};
  return `${names[match[1]]}${match[2]}`;
}

function noteNameWithoutOctave(noteName){
  return (noteName || '').replace(/-?\d+$/, '');
}

function extractOriginalKey(text, progression){
  const keyMatch = (text || '').match(/\b(?:tom|key)\s*[:\-]\s*([A-G](?:#|b)?m?)/i);
  if(keyMatch) return keyMatch[1].replace(/m$/, 'm');
  const firstChord = progression && progression.length ? progression[0].chord : '';
  const root = chordRootToNote(firstChord);
  return root ? noteNameWithoutOctave(root) : '';
}

function transposedWrittenKeyForInstrument(originalKey){
  const midi = noteNameToMidiNumber(`${originalKey.replace(/m$/, '')}4`);
  if(midi === null) return '';
  const writtenMidi = midi - getInstrumentTransposeSemitones();
  const suffix = /m$/.test(originalKey) ? 'm' : '';
  return `${noteNameWithoutOctave(midiToNoteName(writtenMidi))}${suffix}`;
}

function extractChordSymbols(text){
  return extractChordProgression(text).map(item => item.chord);
}

function parseChordLine(line){
  const chordTokenRegex = /^([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:\d{0,2})?(?:\/[A-G](?:#|b)?)?)$/;
  const tokens = (line || '').split(/\s+/).map(token => token.replace(/[|()[\]{}.,:;]+/g, '')).filter(Boolean);
  if(!tokens.length) return [];
  const chordTokens = tokens.filter(token => chordTokenRegex.test(token));
  if(chordTokens.length && chordTokens.length >= Math.max(1, Math.ceil(tokens.length * 0.5))){
    return chordTokens.map(token => token.replace(/maj/i, 'maj').replace(/min/i, 'm'));
  }
  return [];
}

function nextLyricLine(lines, startIndex){
  for(let i = startIndex + 1; i < Math.min(lines.length, startIndex + 4); i += 1){
    const line = (lines[i] || '').trim();
    if(!line || /^\[[^\]]+\]$/.test(line)) continue;
    if(parseChordLine(line).length) continue;
    return line;
  }
  return '';
}

function collectLyricLines(lines){
  return (lines || [])
    .map(line => (line || '').trim())
    .filter(line => line && !/^\[[^\]]+\]$/.test(line) && !parseChordLine(line).length);
}

function extractChordProgression(text){
  const chordScanRegex = /\b([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:\d{0,2})?(?:\/[A-G](?:#|b)?)?)\b/g;
  const progression = [];
  const lines = (text || '').split(/\r?\n/);
  const lyricLines = collectLyricLines(lines);
  let lyricCursor = 0;
  lines.forEach((line, index)=>{
    const chords = parseChordLine(line);
    if(chords.length){
      let lyric = nextLyricLine(lines, index);
      if(!lyric && lyricLines.length){
        lyric = lyricLines[Math.min(lyricCursor, lyricLines.length - 1)];
        lyricCursor += 1;
      }
      chords.forEach((chord)=>{
        progression.push({chord, lyric});
      });
    }
  });

  if(!progression.length){
    let match;
    while((match = chordScanRegex.exec(text || ''))){
      progression.push({chord: match[1].replace(/maj/i, 'maj').replace(/min/i, 'm'), lyric: ''});
      if(progression.length >= 48) break;
    }
  }
  return progression.slice(0, 48);
}

function chordRootToNote(chord){
  const match = (chord || '').match(/^([A-G])([#b]?)/);
  if(!match) return null;
  const accidental = match[2] === 'b' ? 'b' : (match[2] === '#' ? '#' : '');
  return `${match[1]}${accidental}4`;
}

function chordQuality(chord){
  if(/dim/i.test(chord)) return 'dim';
  if(/aug/i.test(chord)) return 'aug';
  if(/m(?!aj)/.test(chord)) return 'minor';
  return 'major';
}

function chordToneIntervals(chord){
  const quality = chordQuality(chord);
  if(quality === 'minor') return [0, 3, 7, 10];
  if(quality === 'dim') return [0, 3, 6, 9];
  if(quality === 'aug') return [0, 4, 8, 10];
  return [0, 4, 7, 9];
}

function normalizeArrangementMidi(midi){
  let note = midi;
  while(note < 62) note += 12;
  while(note > 84) note -= 12;
  return note;
}

function nearestChordToneMidi(targetMidi, chord){
  const rootMidi = noteNameToMidiNumber(chordRootToNote(chord));
  if(rootMidi === null) return targetMidi;
  let best = rootMidi;
  let bestDistance = Infinity;
  chordToneIntervals(chord).forEach((interval)=>{
    for(let octave = -2; octave <= 2; octave += 1){
      const candidate = rootMidi + interval + octave * 12;
      const distance = Math.abs(candidate - targetMidi);
      if(distance < bestDistance){
        best = candidate;
        bestDistance = distance;
      }
    }
  });
  return normalizeArrangementMidi(best);
}

function approachMidi(fromMidi, targetMidi){
  const direction = targetMidi >= fromMidi ? 1 : -1;
  return normalizeArrangementMidi(targetMidi - direction);
}

function degreeLabelForMidi(midi, chord){
  const rootMidi = noteNameToMidiNumber(chordRootToNote(chord));
  if(rootMidi === null) return '?';
  const diff = ((midi - rootMidi) % 12 + 12) % 12;
  const quality = chordQuality(chord);
  const minorMap = {0:'1', 2:'2', 3:'b3', 5:'4', 6:'#4', 7:'5', 9:'6', 10:'b7'};
  const majorMap = {0:'1', 2:'2', 4:'3', 5:'4', 6:'#4', 7:'5', 9:'6', 10:'b7', 11:'7'};
  if(quality === 'minor' || quality === 'dim') return minorMap[diff] || `${diff}`;
  return majorMap[diff] || `${diff}`;
}

function arrangementPhraseIntervals(chord, style, index){
  const tones = chordToneIntervals(chord);
  const quality = chordQuality(chord);
  if(style === 'simple') return [tones[0], tones[1], tones[2], tones[1]];
  if(style === 'response') return index % 2 === 0 ? [tones[0], 2, tones[1], tones[2]] : [tones[2], tones[1], 2, tones[0]];
  if(style === 'ending') return quality === 'minor' ? [tones[2], 10, tones[1], tones[0]] : [tones[2], 9, tones[1], tones[0]];
  return quality === 'minor' ? [tones[0], tones[1], tones[2], 2] : [tones[0], tones[1], tones[3], 2];
}

function buildArrangementNotes(chords, style){
  const notes = [];
  const labels = [];
  const measures = [];
  const progression = chords.map(item => typeof item === 'string' ? {chord: item, lyric: ''} : item);
  progression.slice(0, 24).forEach((entry, index)=>{
    const chord = entry.chord;
    const root = chordRootToNote(chord);
    const rootMidi = noteNameToMidiNumber(root);
    if(rootMidi === null) return;
    const nextEntry = progression[index + 1] || progression[0] || entry;
    const nextChord = nextEntry.chord || chord;
    const nextRootMidi = noteNameToMidiNumber(chordRootToNote(nextChord));
    const resolutionTarget = nextRootMidi === null ? rootMidi : nearestChordToneMidi(nextRootMidi, nextChord);
    const intervalPhrase = arrangementPhraseIntervals(chord, style || 'worship', index);
    const anchor = notes.length ? nearestChordToneMidi(noteNameToMidiNumber(notes[notes.length - 1]) + 2, chord) : normalizeArrangementMidi(rootMidi + intervalPhrase[0]);
    const phrase = intervalPhrase.map((interval, noteIndex)=>{
      if(noteIndex === 0) return nearestChordToneMidi(anchor, chord);
      if(noteIndex === 3 && style !== 'ending') return approachMidi(rootMidi + interval, resolutionTarget);
      return normalizeArrangementMidi(rootMidi + interval);
    });
    const measureLabels = [];
    const degrees = [];
    const functions = [];
    phrase.forEach((midi, noteIndex)=>{
      const note = midiToNoteName(midi);
      notes.push(note);
      const role = noteIndex === 0 ? 'forte' : (noteIndex === 3 ? (style === 'ending' ? 'resolucao' : 'aproxima') : 'passagem');
      const degree = degreeLabelForMidi(midi, chord);
      const label = `${chord}: ${noteToSolfege(note)} (${role})`;
      labels.push(label);
      measureLabels.push(label);
      degrees.push(degree);
      functions.push(role);
    });
    measures.push({chord, lyric: entry.lyric || '', notes: phrase.map(midiToNoteName), degrees, functions, labels: measureLabels});
  });
  return {notes, labels, measures};
}

function soundingNotesForWrittenNotes(notes){
  return notes.map((note)=>{
    const midi = noteNameToMidiNumber(note);
    return midi === null ? note : midiToNoteName(midi + getInstrumentTransposeSemitones());
  });
}

function parseLyricMelodyText(text){
  const lines = (text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sections = [];
  for(let i = 0; i < lines.length; i += 2){
    const noteLine = lines[i] || '';
    const lyricLine = lines[i + 1] || '';
    if(!noteLine || !lyricLine) continue;
    const notes = noteLine
      .replace(/[;,]/g, ' ')
      .split(/\s+/)
      .map(token => token.trim())
      .filter(Boolean);
    sections.push({noteLine, lyricLine, notes});
  }
  return sections;
}

function buildLyricMelodyTextFromArrangement(analysis){
  if(!analysis || !analysis.measures) return '';
  const blocks = [];
  let lastLyric = null;
  analysis.measures.forEach((measure)=>{
    if(!measure.lyric) return;
    const noteLine = measure.notes.map(noteToSolfege).join(' ');
    const lyricLine = measure.lyric === lastLyric ? '...' : measure.lyric;
    blocks.push(noteLine, lyricLine, '');
    lastLyric = measure.lyric;
  });
  return blocks.join('\n').trim();
}

function syncLyricMelodyFromArrangement(){
  if(!lyricMelodyInput || !currentArrangement) return;
  const generated = buildLyricMelodyTextFromArrangement(currentArrangement);
  if(!generated) return;
  lyricMelodyInput.value = generated;
  renderLyricMelody();
}

function solfegeTokenToNoteName(token){
  const cleaned = (token || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const octave = /^[A-Z]/.test(token) ? 5 : 4;
  const map = {
    do: 'C', 'do#': 'C#',
    re: 'D', 're#': 'D#',
    mi: 'E',
    fa: 'F', 'fa#': 'F#',
    sol: 'G', 'sol#': 'G#',
    la: 'A', 'la#': 'A#',
    si: 'B'
  };
  const base = map[cleaned];
  return base ? `${base}${octave}` : null;
}

function majorScaleNotes(rootNote, count){
  const rootMidi = noteNameToMidiNumber(rootNote) || 67;
  const intervals = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21];
  return intervals.slice(0, count).map(interval => midiToNoteName(rootMidi + interval));
}

function buildReadingExercise(){
  const level = readingLevel ? readingLevel.value : 'absolute';
  const key = readingKey ? readingKey.value : 'G4';
  const meter = readingMeter ? readingMeter.value : '4/4';
  const bpm = readingBpm ? clampBpm(readingBpm.value || 60) : 60;
  const scale = majorScaleNotes(key, 8);
  const fifth = scale[4] || scale[0];
  const third = scale[2] || scale[0];
  const second = scale[1] || scale[0];
  const sixth = scale[5] || scale[0];
  let notes = scale.slice(0, 5);
  let beats = [1, 1, 1, 1, 2];
  let degrees = ['1', '2', '3', '4', '5'];
  let functions = ['repouso', 'movimento', 'cor', 'preparacao', 'apoio'];
  let title = 'Notas na pauta';
  let pitchTheory = 'Identifique cada nota na clave de sol antes de tocar.';
  let rhythmTheory = 'Toque uma nota por pulso e sustente a ultima por dois tempos.';
  let functionTheory = 'Comece no repouso, caminhe pela escala e apoie no quinto grau.';

  if(level === 'scale_degrees'){
    notes = [scale[0], third, fifth, sixth, fifth, third, second, scale[0]];
    beats = [1, 1, 1, 1, 1, 1, 1, 2];
    degrees = ['1', '3', '5', '6', '5', '3', '2', '1'];
    functions = ['tonica', 'cor', 'dominante', 'tensao suave', 'dominante', 'cor', 'passagem', 'resolucao'];
    title = 'Graus da escala';
    pitchTheory = 'Leia pensando em graus: 1 e repouso, 3 colore, 5 estabiliza, 6 cria leve tensao.';
    rhythmTheory = 'Mantenha todas as entradas no pulso, sem correr entre os saltos.';
    functionTheory = 'A frase sai da tonica, abre no sexto grau e resolve novamente no primeiro.';
  } else if(level === 'rhythm'){
    notes = [scale[0], scale[0], second, third, fifth, fifth, third, scale[0]];
    beats = meter === '6/8' ? [0.75, 0.75, 1.5, 0.75, 0.75, 1.5, 1.5, 3] : [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 2];
    degrees = ['1', '1', '2', '3', '5', '5', '3', '1'];
    functions = ['pulso curto', 'pulso curto', 'passagem', 'cor', 'apoio', 'apoio', 'retorno', 'resolucao'];
    title = 'Ritmo e duracao';
    pitchTheory = 'As notas sao simples para a atencao ficar no tempo.';
    rhythmTheory = 'Conte subdivisoes: notas curtas precisam de ataque limpo e notas longas precisam de ar firme.';
    functionTheory = 'As notas fortes devem soar mais seguras, principalmente o primeiro e o ultimo grau.';
  } else if(level === 'resolution'){
    notes = [fifth, sixth, fifth, third, second, third, second, scale[0]];
    beats = [1, 1, 0.5, 0.5, 1, 1, 1, 2];
    degrees = ['5', '6', '5', '3', '2', '3', '2', '1'];
    functions = ['chamada', 'tensao', 'retorno', 'cor', 'passagem', 'resposta', 'preparacao', 'resolucao'];
    title = 'Frase com resolucao';
    pitchTheory = 'Observe os saltos pequenos e toque mirando a nota de chegada.';
    rhythmTheory = 'Use as notas curtas como movimento, sem perder a sustentacao.';
    functionTheory = 'A frase cria tensao no sexto grau e repousa no primeiro grau na nota forte.';
  }

  return {
    title,
    key,
    meter,
    bpm,
    notes,
    beats,
    degrees,
    functions,
    pitchTheory,
    rhythmTheory,
    functionTheory
  };
}

function noteYFromScientificName(noteName){
  const match = (noteName || '').trim().match(/^([A-Ga-g])(?:#|b)?(-?\d+)$/);
  if(!match) return 84;
  const letterStep = {C:0, D:1, E:2, F:3, G:4, A:5, B:6}[match[1].toUpperCase()];
  const octave = Number(match[2]);
  const diatonicStep = octave * 7 + letterStep;
  const e4Step = 4 * 7 + 2;
  // Na clave de sol, E4 fica na primeira linha inferior. Cada passo
  // diatonico (linha ou espaco) equivale a metade do espacamento da pauta.
  return Math.max(19, Math.min(139, 84 - (diatonicStep - e4Step) * 5));
}

function appendReadingLedgerLines(svg, x, y){
  const ledgerYs = [];
  if(y >= 94){
    for(let ledgerY = 94; ledgerY <= y; ledgerY += 10) ledgerYs.push(ledgerY);
  } else if(y <= 34){
    for(let ledgerY = 34; ledgerY >= y; ledgerY -= 10) ledgerYs.push(ledgerY);
  }
  ledgerYs.forEach((ledgerY)=>{
    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ledger.setAttribute('x1', `${x - 13}`);
    ledger.setAttribute('x2', `${x + 13}`);
    ledger.setAttribute('y1', `${ledgerY}`);
    ledger.setAttribute('y2', `${ledgerY}`);
    ledger.setAttribute('stroke', '#24313a');
    ledger.setAttribute('stroke-width', '1.2');
    svg.appendChild(ledger);
  });
}

function readingMeasureCapacity(meter){
  const match = String(meter || '4/4').match(/^(\d+)\/(\d+)$/);
  if(!match) return 4;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  return numerator > 0 && denominator > 0 ? numerator * (4 / denominator) : 4;
}

function appendReadingBarLine(svg, x, staffTop, lineGap, measureNumber, finalBar = false){
  const addLine = (lineX, width)=>{
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    bar.classList.add('reading-bar-line');
    bar.setAttribute('x1', `${lineX}`);
    bar.setAttribute('x2', `${lineX}`);
    bar.setAttribute('y1', `${staffTop}`);
    bar.setAttribute('y2', `${staffTop + lineGap * 4}`);
    bar.setAttribute('stroke', '#121c24');
    bar.setAttribute('stroke-width', `${width}`);
    svg.appendChild(bar);
  };
  if(finalBar) addLine(x - 5, 1.2);
  addLine(x, finalBar ? 3 : 1.4);
  if(measureNumber){
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', `${x + 5}`);
    label.setAttribute('y', `${staffTop - 9}`);
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#66727a');
    label.textContent = String(measureNumber);
    svg.appendChild(label);
  }
}

function readingScorePageCount(exercise = currentReadingExercise){
  return readingScorePageRanges(exercise).length;
}

function readingScorePageRanges(exercise = currentReadingExercise){
  const total = exercise && exercise.notes ? exercise.notes.length : 0;
  if(!total) return [{start:0, end:0}];
  const starts = [0, ...(exercise.measureStarts || [])]
    .filter((value, index, values)=>value > 0 && value < total && values.indexOf(value) === index)
    .sort((a, b)=>a - b);
  if(starts[0] !== 0) starts.unshift(0);
  const measures = starts.map((start, index)=>({start, end:starts[index + 1] || total}));
  const pages = [];
  let pageStart = measures[0].start;
  let pageEnd = pageStart;
  measures.forEach((measure)=>{
    const proposedCount = measure.end - pageStart;
    if(pageEnd > pageStart && proposedCount > READING_SCORE_PAGE_SIZE){
      pages.push({start:pageStart, end:pageEnd});
      pageStart = measure.start;
    }
    pageEnd = measure.end;
  });
  pages.push({start:pageStart, end:pageEnd});
  return pages;
}

function updateReadingPageNavigation(exercise = currentReadingExercise){
  const pageCount = readingScorePageCount(exercise);
  readingScorePage = Math.max(0, Math.min(pageCount - 1, readingScorePage));
  if(readingPageNav) readingPageNav.hidden = pageCount <= 1;
  if(readingPageStatus){
    const totalNotes = exercise && exercise.notes ? exercise.notes.length : 0;
    const range = readingScorePageRanges(exercise)[readingScorePage];
    const firstNote = totalNotes ? range.start + 1 : 0;
    const lastNote = range.end;
    readingPageStatus.textContent = `Pagina ${readingScorePage + 1} de ${pageCount} · notas ${firstNote}-${lastNote} de ${totalNotes}`;
  }
  if(readingPrevPageBtn) readingPrevPageBtn.disabled = readingScorePage === 0;
  if(readingNextPageBtn) readingNextPageBtn.disabled = readingScorePage >= pageCount - 1;
}

function setReadingScorePage(page){
  if(!currentReadingExercise) return;
  const pageCount = readingScorePageCount(currentReadingExercise);
  readingScorePage = Math.max(0, Math.min(pageCount - 1, page));
  renderReadingScore(currentReadingExercise);
  renderReadingNotes(currentReadingExercise);
  if(readingScoreSvg) readingScoreSvg.scrollLeft = 0;
}

function escapeMusicXmlText(value){
  return String(value || '').replace(/[&<>"']/g, character=>({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'
  }[character]));
}

function musicXmlRhythmNotation(beats){
  const candidates = [
    {beats:4, type:'whole'}, {beats:3, type:'half', dot:true},
    {beats:2, type:'half'}, {beats:1.5, type:'quarter', dot:true},
    {beats:1, type:'quarter'}, {beats:0.75, type:'eighth', dot:true},
    {beats:0.5, type:'eighth'}, {beats:0.375, type:'16th', dot:true},
    {beats:0.25, type:'16th'}, {beats:0.125, type:'32nd'},
    {beats:2 / 3, type:'quarter', triplet:true},
    {beats:1 / 3, type:'eighth', triplet:true},
    {beats:1 / 6, type:'16th', triplet:true},
  ];
  return candidates.reduce((closest, candidate)=>
    Math.abs(candidate.beats - beats) < Math.abs(closest.beats - beats) ? candidate : closest
  , candidates[0]);
}

function readingDurationLabel(beats){
  const notation = musicXmlRhythmNotation(Math.max(0.125, Number(beats) || 1));
  const names = {
    whole:'semibreve', half:'minima', quarter:'seminima',
    eighth:'colcheia', '16th':'semicolcheia', '32nd':'fusa'
  };
  let label = names[notation.type] || `${Number(beats).toFixed(2)} tempos`;
  if(notation.dot) label += ' pontuada';
  if(notation.triplet) label += ' em tercina';
  return `${label} (${Number(beats).toLocaleString('pt-BR')} tempo${Number(beats) === 1 ? '' : 's'})`;
}

function sourceMusicXmlForReadingPage(exercise, pageStart, pageEnd){
  if(!exercise.sourceMusicXml || typeof DOMParser === 'undefined') return '';
  const documentNode = new DOMParser().parseFromString(exercise.sourceMusicXml, 'application/xml');
  if(documentNode.querySelector('parsererror')) return '';
  const transposeSemitones = Number(exercise.transposeSemitones) || 0;
  if(transposeSemitones){
    Array.from(documentNode.querySelectorAll('note > pitch')).forEach(pitch=>{
      const stepNode = Array.from(pitch.children).find(child=>child.localName === 'step');
      const alterNode = Array.from(pitch.children).find(child=>child.localName === 'alter');
      const octaveNode = Array.from(pitch.children).find(child=>child.localName === 'octave');
      if(!stepNode || !octaveNode) return;
      const accidental = Number(alterNode ? alterNode.textContent : 0);
      const sourceNote = `${stepNode.textContent}${accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(Math.abs(accidental))}${octaveNode.textContent}`;
      const transposed = transposeReadingNote(sourceNote, transposeSemitones, Number(exercise.keyFifths) < 0);
      const match = transposed.match(/^([A-G])([#b]?)(-?\d+)$/);
      if(!match) return;
      stepNode.textContent = match[1];
      octaveNode.textContent = match[3];
      if(match[2]){
        const node = alterNode || documentNode.createElement('alter');
        node.textContent = match[2] === '#' ? '1' : '-1';
        if(!alterNode) pitch.insertBefore(node, octaveNode);
      } else if(alterNode) alterNode.remove();
    });
    Array.from(documentNode.querySelectorAll('attributes key fifths')).forEach(node=>{
      node.textContent = String(Number(exercise.keyFifths) || 0);
    });
  }
  const parts = Array.from(documentNode.querySelectorAll('score-partwise > part'));
  const part = parts[0];
  if(!part) return '';
  const measures = Array.from(part.children).filter(element=>element.localName === 'measure');
  const measureNoteStarts = exercise.sourceMeasureNoteStarts && exercise.sourceMeasureNoteStarts.length
    ? exercise.sourceMeasureNoteStarts
    : [0, ...(exercise.measureStarts || [])];
  const startMeasure = Math.max(0, measureNoteStarts.indexOf(pageStart));
  const exactEndMeasure = measureNoteStarts.indexOf(pageEnd);
  const endMeasure = exactEndMeasure >= 0 ? exactEndMeasure : measures.length;
  let carriedAttributes = null;
  for(let index = 0; index <= startMeasure; index += 1){
    const attributes = measures[index] ? Array.from(measures[index].children).find(child=>child.localName === 'attributes') : null;
    if(attributes) carriedAttributes = attributes.cloneNode(true);
  }
  measures.forEach((measure, index)=>{
    if(index < startMeasure || index >= endMeasure) measure.remove();
  });
  const firstMeasure = Array.from(part.children).find(element=>element.localName === 'measure');
  if(firstMeasure && carriedAttributes && !Array.from(firstMeasure.children).some(child=>child.localName === 'attributes')){
    firstMeasure.insertBefore(carriedAttributes, firstMeasure.firstChild);
  }
  const selectedPartId = part.getAttribute('id');
  parts.slice(1).forEach(otherPart=>otherPart.remove());
  Array.from(documentNode.querySelectorAll('part-list > score-part')).forEach(scorePart=>{
    if(scorePart.getAttribute('id') !== selectedPartId) scorePart.remove();
  });
  return new XMLSerializer().serializeToString(documentNode);
}

function readingPageMusicXml(exercise){
  const pageRange = readingScorePageRanges(exercise)[readingScorePage];
  const pageStart = pageRange.start;
  const pageEnd = pageRange.end;
  const originalPageXml = sourceMusicXmlForReadingPage(exercise, pageStart, pageEnd);
  if(originalPageXml) return originalPageXml;
  const notes = exercise.notes.slice(pageStart, pageEnd);
  const beats = exercise.beats.slice(pageStart, pageEnd);
  const localMeasureStarts = new Set((exercise.measureStarts || [])
    .filter(index=>index > pageStart && index < pageEnd)
    .map(index=>index - pageStart));
  const meterMatch = String(exercise.meter || '4/4').match(/^(\d+)\/(\d+)$/);
  const meterBeats = meterMatch ? Number(meterMatch[1]) : 4;
  const meterType = meterMatch ? Number(meterMatch[2]) : 4;
  const measureCapacity = meterBeats * 4 / meterType;
  const displayBeats = beats.map(beat=>Math.max(0.125, Number(beat) || 1));
  const divisions = 96;
  let measureNumber = 1 + (exercise.measureStarts || []).filter(index=>index <= pageStart).length;
  let measureBeats = 0;
  let xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0">`;
  xml += `<work><work-title>${escapeMusicXmlText(exercise.title)}</work-title></work>`;
  xml += '<part-list><score-part id="P1"><part-name>Sax</part-name></score-part></part-list><part id="P1">';
  const openMeasure = (includeAttributes)=>{
    xml += `<measure number="${measureNumber}">`;
    if(includeAttributes){
      const keyFifths = Math.max(-7, Math.min(7, Number(exercise.keyFifths) || 0));
      xml += `<attributes><divisions>${divisions}</divisions><key><fifths>${keyFifths}</fifths></key>`;
      xml += `<time><beats>${meterBeats}</beats><beat-type>${meterType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
      xml += `<direction placement="above"><sound tempo="${clampBpm(exercise.bpm || 60)}"/></direction>`;
    }
  };
  openMeasure(true);
  notes.forEach((note, index)=>{
    const durationBeats = displayBeats[index];
    const calculatedBoundary = index > 0 && !localMeasureStarts.size && measureBeats >= measureCapacity - 0.001;
    if(index > 0 && (localMeasureStarts.has(index) || calculatedBoundary)){
      xml += '</measure>';
      measureNumber += 1;
      measureBeats = 0;
      openMeasure(false);
    }
    const match = String(note).match(/^([A-G])([#b]*)(-?\d+)$/);
    if(!match) return;
    const alter = (match[2].match(/#/g) || []).length - (match[2].match(/b/g) || []).length;
    const notation = musicXmlRhythmNotation(durationBeats);
    xml += `<note><pitch><step>${match[1]}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${match[3]}</octave></pitch>`;
    xml += `<duration>${Math.max(1, Math.round(durationBeats * divisions))}</duration><voice>1</voice><type>${notation.type}</type>`;
    if(notation.dot) xml += '<dot/>';
    if(notation.triplet) xml += '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>';
    xml += '</note>';
    measureBeats += durationBeats;
  });
  return `${xml}</measure></part></score-partwise>`;
}

function positionReadingOsmdCursor(localIndex){
  if(!readingOsmd || !readingOsmd.cursor) return;
  readingOsmd.cursor.reset();
  readingOsmd.cursor.show();
  for(let index = 0; index < localIndex; index += 1) readingOsmd.cursor.next();
}

function renderReadingScoreWithOsmd(exercise){
  const token = ++readingOsmdRenderToken;
  updateReadingPageNavigation(exercise);
  readingScoreSvg.classList.add('osmd-rendering');
  readingScoreSvg.innerHTML = '';
  if(!readingOsmd){
    readingOsmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(readingScoreSvg, {
      autoResize: true,
      backend: 'svg',
      drawTitle: false,
      drawingParameters: 'compacttight',
      followCursor: false,
      cursorsOptions: [{type:3, color:'#e7a3a0', alpha:0.45, follow:false}],
    });
  }
  readingOsmd.Zoom = readingScoreZoom;
  readingOsmdRenderPromise = readingOsmd.load(readingPageMusicXml(exercise)).then(()=>{
    if(token !== readingOsmdRenderToken) return;
    readingOsmd.render();
    positionReadingOsmdCursor(0);
    readingOsmd.cursor.hide();
  }).catch(error=>{
    console.error('OSMD render failed, using simple score renderer', error);
    readingOsmd = null;
    readingScoreSvg.classList.remove('osmd-rendering');
    renderReadingScore(exercise, true);
  });
}

function renderReadingScore(exercise, forceManual = false){
  if(!readingScoreSvg || !exercise) return;
  if(!forceManual && window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay){
    renderReadingScoreWithOsmd(exercise);
    return;
  }
  readingScoreSvg.classList.remove('osmd-rendering');
  const sourceExercise = exercise;
  const pageRange = readingScorePageRanges(sourceExercise)[readingScorePage];
  const pageStart = pageRange.start;
  const pageEnd = pageRange.end;
  const sourceMeasureStarts = sourceExercise.measureStarts || [];
  exercise = {
    ...sourceExercise,
    notes: sourceExercise.notes.slice(pageStart, pageEnd),
    beats: sourceExercise.beats.slice(pageStart, pageEnd),
    degrees: sourceExercise.degrees.slice(pageStart, pageEnd),
    functions: sourceExercise.functions.slice(pageStart, pageEnd),
    measureStarts: sourceMeasureStarts
      .filter(index=>index > pageStart && index < pageEnd)
      .map(index=>index - pageStart),
    initialMeasureNumber: 1 + sourceMeasureStarts.filter(index=>index <= pageStart).length,
  };
  updateReadingPageNavigation(sourceExercise);
  const normalizedBeats = exercise.notes.map((_, index)=>Math.max(0.125, Number(exercise.beats[index]) || 1));
  const rawSlots = normalizedBeats.map(beat=>Math.max(42, Math.min(150, beat * 54)));
  const rawSlotsWidth = rawSlots.reduce((sum, slot)=>sum + slot, 0);
  const maximumSlotsWidth = 11820;
  const slotScale = rawSlotsWidth > maximumSlotsWidth ? maximumSlotsWidth / rawSlotsWidth : 1;
  const noteSlots = rawSlots.map(slot=>slot * slotScale);
  const slotsWidth = noteSlots.reduce((sum, slot)=>sum + slot, 0);
  const width = Math.max(680, Math.ceil(slotsWidth + 170));
  const height = 168;
  const staffTop = 44;
  const lineGap = 10;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  if(width > 680){
    svg.style.width = `${width}px`;
    svg.style.maxWidth = 'none';
  }
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Partitura de leitura: ${exercise.title}`);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', `${width}`);
  bg.setAttribute('height', `${height}`);
  bg.setAttribute('fill', '#fffdf8');
  svg.appendChild(bg);

  for(let i = 0; i < 5; i += 1){
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '24');
    line.setAttribute('x2', `${width - 22}`);
    line.setAttribute('y1', `${staffTop + i * lineGap}`);
    line.setAttribute('y2', `${staffTop + i * lineGap}`);
    line.setAttribute('stroke', '#24313a');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  const clef = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  clef.setAttribute('x', '30');
  clef.setAttribute('y', `${staffTop + 39}`);
  clef.setAttribute('font-size', '48');
  clef.setAttribute('fill', '#123b47');
  clef.setAttribute('font-family', 'Times New Roman, serif');
  clef.textContent = '\uD834\uDD1E';
  svg.appendChild(clef);

  const time = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  time.setAttribute('x', '82');
  time.setAttribute('y', `${staffTop + 26}`);
  time.setAttribute('font-size', '18');
  time.setAttribute('font-weight', '700');
  time.setAttribute('fill', '#121c24');
  time.textContent = exercise.meter;
  svg.appendChild(time);

  let cursor = 122;
  const explicitMeasureStarts = new Set(exercise.measureStarts || []);
  const measureCapacity = readingMeasureCapacity(exercise.meter);
  let elapsedMeasureBeats = 0;
  let measureNumber = exercise.initialMeasureNumber || 1;
  appendReadingBarLine(svg, 112, staffTop, lineGap, measureNumber);
  exercise.notes.forEach((note, index)=>{
    const startsExplicitMeasure = index > 0 && explicitMeasureStarts.has(index);
    const startsCalculatedMeasure = index > 0 && !explicitMeasureStarts.size && elapsedMeasureBeats >= measureCapacity - 0.001;
    if(startsExplicitMeasure || startsCalculatedMeasure){
      appendReadingBarLine(svg, cursor, staffTop, lineGap, ++measureNumber);
      elapsedMeasureBeats = 0;
    }
    const beat = normalizedBeats[index];
    const notation = musicXmlRhythmNotation(beat);
    const slot = noteSlots[index];
    const x = cursor + slot / 2;
    const y = noteYFromScientificName(note);
    appendReadingLedgerLines(svg, x, y);
    const accidentalMatch = (note || '').match(/([#b])/);
    if(accidentalMatch){
      const accidental = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      accidental.setAttribute('x', `${x - 22}`);
      accidental.setAttribute('y', `${y + 5}`);
      accidental.setAttribute('font-size', '18');
      accidental.setAttribute('font-family', 'Times New Roman, serif');
      accidental.setAttribute('fill', '#121c24');
      accidental.textContent = accidentalMatch[1] === '#' ? '♯' : '♭';
      svg.appendChild(accidental);
    }
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    head.classList.add('reading-note-head');
    head.dataset.readingNoteIndex = String(index);
    head.dataset.scoreNoteIndex = String(pageStart + index);
    head.setAttribute('cx', `${x}`);
    head.setAttribute('cy', `${y}`);
    head.setAttribute('rx', '8');
    head.setAttribute('ry', '6');
    head.setAttribute('fill', beat >= 2 ? '#fffdf8' : '#2d7a62');
    head.setAttribute('stroke', '#121c24');
    head.setAttribute('stroke-width', '1.2');
    svg.appendChild(head);

    if(beat < 4){
      const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const stemDown = y <= staffTop + lineGap * 2;
      const stemX = stemDown ? x - 8 : x + 8;
      stem.setAttribute('x1', `${stemX}`);
      stem.setAttribute('x2', `${stemX}`);
      stem.setAttribute('y1', `${y}`);
      stem.setAttribute('y2', `${stemDown ? y + 28 : y - 28}`);
      stem.setAttribute('stroke', '#121c24');
      stem.setAttribute('stroke-width', '1.2');
      svg.appendChild(stem);

      const flagCount = notation.type === '32nd' ? 3 : notation.type === '16th' ? 2 : notation.type === 'eighth' ? 1 : 0;
      for(let flagIndex = 0; flagIndex < flagCount; flagIndex += 1){
        const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const stemEndY = stemDown ? y + 28 : y - 28;
        const offsetY = flagIndex * (stemDown ? -6 : 6);
        const direction = stemDown ? -1 : 1;
        flag.setAttribute('d', `M ${stemX} ${stemEndY + offsetY} q ${12 * direction} ${7 * direction} ${7 * direction} ${16 * direction}`);
        flag.setAttribute('fill', 'none');
        flag.setAttribute('stroke', '#121c24');
        flag.setAttribute('stroke-width', '2');
        svg.appendChild(flag);
      }
    }

    if(notation.dot){
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', `${x + 13}`);
      dot.setAttribute('cy', `${y - 2}`);
      dot.setAttribute('r', '2');
      dot.setAttribute('fill', '#121c24');
      svg.appendChild(dot);
    }

    if(notation.triplet){
      const tuplet = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tuplet.setAttribute('x', `${x - 3}`);
      tuplet.setAttribute('y', `${staffTop - 12}`);
      tuplet.setAttribute('font-size', '10');
      tuplet.setAttribute('font-weight', '700');
      tuplet.setAttribute('fill', '#121c24');
      tuplet.textContent = '3';
      svg.appendChild(tuplet);
    }

    const degree = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    degree.setAttribute('x', `${x - 5}`);
    degree.setAttribute('y', `${staffTop + 76}`);
    degree.setAttribute('font-size', '11');
    degree.setAttribute('font-weight', '700');
    degree.setAttribute('fill', '#c46d10');
    degree.textContent = exercise.degrees[index] || '';
    svg.appendChild(degree);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', `${x - 12}`);
    label.setAttribute('y', `${staffTop + 93}`);
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#24313a');
    label.textContent = note;
    svg.appendChild(label);

    cursor += slot;
    elapsedMeasureBeats += beat;
  });
  appendReadingBarLine(svg, Math.min(width - 24, cursor + 3), staffTop, lineGap, null, true);

  readingScoreSvg.innerHTML = '';
  readingScoreSvg.appendChild(svg);
}

function renderReadingNotes(exercise){
  if(!readingNotes || !exercise) return;
  readingNotes.innerHTML = '';
  const pageRange = readingScorePageRanges(exercise)[readingScorePage];
  const pageStart = pageRange.start;
  const pageEnd = pageRange.end;
  exercise.notes.slice(pageStart, pageEnd).forEach((note, localIndex)=>{
    const index = pageStart + localIndex;
    const chip = document.createElement('span');
    const durationLabel = readingDurationLabel(exercise.beats[index]);
    chip.textContent = `${exercise.degrees[index]}: ${noteToWrittenSolfege(note)} (${note}) · ${durationLabel}`;
    chip.title = [exercise.functions[index] || '', `Duracao: ${durationLabel}`].filter(Boolean).join(' — ');
    chip.dataset.scoreNoteIndex = String(index);
    readingNotes.appendChild(chip);
  });
}

function generateReadingExercise(){
  currentReadingExercise = buildReadingExercise();
  readingScorePage = 0;
  if(readingPitchTheory) readingPitchTheory.textContent = currentReadingExercise.pitchTheory;
  if(readingRhythmTheory) readingRhythmTheory.textContent = currentReadingExercise.rhythmTheory;
  if(readingFunctionTheory) readingFunctionTheory.textContent = currentReadingExercise.functionTheory;
  if(readingSummary){
    readingSummary.textContent = `${currentReadingExercise.title} em ${noteToSolfege(currentReadingExercise.key)} maior, ${currentReadingExercise.meter}, ${currentReadingExercise.bpm} BPM. Leia, ouca e depois execute.`;
  }
  renderReadingScore(currentReadingExercise);
  renderReadingNotes(currentReadingExercise);
}

function syncReadingBpm(){
  const bpm = clampBpm(readingBpm ? readingBpm.value || 60 : 60);
  if(readingBpm) readingBpm.value = bpm;
  if(readingToolbarBpm) readingToolbarBpm.value = bpm;
  if(currentReadingExercise){
    currentReadingExercise.bpm = bpm;
    if(readingSummary){
      readingSummary.textContent = `${currentReadingExercise.title}, ${currentReadingExercise.meter}, ${bpm} BPM. Leia, ouca e depois execute.`;
    }
  }
  return bpm;
}

function adjustReadingBpm(change){
  const current = Number(readingToolbarBpm ? readingToolbarBpm.value : (readingBpm ? readingBpm.value : 60)) || 60;
  if(readingBpm) readingBpm.value = clampBpm(current + change);
  syncReadingBpm();
}

function adjustReadingZoom(change){
  readingScoreZoom = Math.max(0.6, Math.min(1.8, Math.round((readingScoreZoom + change) * 10) / 10));
  if(readingOsmd){
    readingOsmd.Zoom = readingScoreZoom;
    readingOsmd.render();
  } else if(readingScoreSvg){
    const svg = readingScoreSvg.querySelector('svg');
    if(svg) svg.style.transform = `scale(${readingScoreZoom})`;
  }
}

function formatReadingTime(seconds){
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function updateReadingPlaybackProgress(elapsedSeconds, totalSeconds){
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(100, elapsedSeconds / totalSeconds * 100)) : 0;
  if(readingProgressFill) readingProgressFill.style.width = `${progress}%`;
  if(readingProgress) readingProgress.setAttribute('aria-valuenow', String(Math.round(progress)));
  if(readingPlaybackTime) readingPlaybackTime.textContent = `${formatReadingTime(elapsedSeconds)} / ${formatReadingTime(totalSeconds)}`;
}

function syncReadingMeterControl(meter){
  if(!readingMeter || !meter) return;
  let option = Array.from(readingMeter.options).find(item=>item.value === meter);
  if(!option){
    option = document.createElement('option');
    option.value = meter;
    option.textContent = meter;
    readingMeter.appendChild(option);
  }
  readingMeter.value = meter;
}

function syncOriginalScoreView(exercise = currentReadingExercise){
  const available = Boolean(exercise && exercise.originalSourceUrl);
  if(readingOriginalModeBtn) readingOriginalModeBtn.disabled = !available;
  if(!available) setReadingViewMode('study');
}

function setReadingViewMode(mode){
  const showOriginal = mode === 'original' && currentReadingExercise && currentReadingExercise.originalSourceUrl;
  const scoreSurface = readingScoreSvg ? readingScoreSvg.closest('.score-page-surface') : null;
  if(scoreSurface) scoreSurface.hidden = false;
  if(scorePlayerShell) scorePlayerShell.classList.toggle('original-comparison', showOriginal);
  if(readingOriginalView){
    readingOriginalView.hidden = !showOriginal;
    if(showOriginal){
      readingOriginalView.innerHTML = '';
      const guide = document.createElement('div');
      guide.className = 'original-playback-guide';
      guide.innerHTML = '<strong id="originalGuideNote">Pronto para executar</strong><div class="original-guide-track"><div id="originalGuideFill" class="original-guide-fill"></div></div><span id="originalGuidePosition" class="original-guide-position">0 / 0</span>';
      const isImage = String(currentReadingExercise.originalSourceType || '').startsWith('image/');
      const viewer = document.createElement(isImage ? 'img' : 'iframe');
      viewer.src = currentReadingExercise.originalSourceUrl;
      viewer.title = `Partitura original: ${currentReadingExercise.title}`;
      const caption = document.createElement('strong');
      caption.className = 'score-view-caption';
      caption.textContent = 'PDF original';
      readingOriginalView.append(caption, guide, viewer);
    }
  }
  if(readingStudyModeBtn) readingStudyModeBtn.classList.toggle('active', !showOriginal);
  if(readingOriginalModeBtn) readingOriginalModeBtn.classList.toggle('active', showOriginal);
  if(toggleExecutionViewBtn) toggleExecutionViewBtn.hidden = !showOriginal;
  if(!showOriginal && scorePlayerShell){
    scorePlayerShell.classList.remove('execution-hidden');
  }
  syncExecutionViewButton();
  if(readingOsmd){
    window.requestAnimationFrame(()=>{
      try{ readingOsmd.render(); }catch(error){}
    });
  }
}

function syncExecutionViewButton(){
  if(!toggleExecutionViewBtn || !scorePlayerShell) return;
  const hidden = scorePlayerShell.classList.contains('execution-hidden');
  toggleExecutionViewBtn.textContent = hidden ? 'Mostrar execucao' : 'Ocultar execucao';
  toggleExecutionViewBtn.setAttribute('aria-pressed', String(hidden));
}

function toggleOriginalExecutionView(){
  if(!scorePlayerShell || !scorePlayerShell.classList.contains('original-comparison')) return;
  scorePlayerShell.classList.toggle('execution-hidden');
  syncExecutionViewButton();
  if(readingOsmd && !scorePlayerShell.classList.contains('execution-hidden')){
    window.requestAnimationFrame(()=>{
      try{ readingOsmd.render(); }catch(error){}
    });
  }
}

function updateOriginalPlaybackGuide(noteIndex = -1, elapsedSeconds = 0, totalSeconds = 0){
  if(!readingOriginalView || !currentReadingExercise) return;
  const noteElement = readingOriginalView.querySelector('#originalGuideNote');
  const fillElement = readingOriginalView.querySelector('#originalGuideFill');
  const positionElement = readingOriginalView.querySelector('#originalGuidePosition');
  const totalNotes = currentReadingExercise.notes.length;
  const active = noteIndex >= 0 && noteIndex < totalNotes;
  const completed = totalSeconds > 0 && elapsedSeconds >= totalSeconds - 0.05;
  if(noteElement){
    const note = active ? currentReadingExercise.notes[noteIndex] : '';
    noteElement.textContent = active
      ? `Nota ${noteIndex + 1}: ${noteToWrittenSolfege(note)} (${note})`
      : (completed ? 'Execucao concluida' : 'Pronto para executar');
  }
  const ratio = totalSeconds > 0 ? Math.max(0, Math.min(1, elapsedSeconds / totalSeconds)) : 0;
  if(fillElement) fillElement.style.width = `${ratio * 100}%`;
  if(positionElement) positionElement.textContent = `${active ? noteIndex + 1 : (completed ? totalNotes : 0)} / ${totalNotes} · ${formatReadingTime(elapsedSeconds)}`;
}

async function importScoreFile(selectedFile){
  const file = selectedFile instanceof File
    ? selectedFile
    : (scoreFileInput && scoreFileInput.files ? scoreFileInput.files[0] : null);
  if(!file){
    if(scoreImportStatus) scoreImportStatus.textContent = 'Escolha um arquivo ou fotografe a partitura.';
    return;
  }
  if(importScoreBtn) importScoreBtn.disabled = true;
  if(captureScoreBtn) captureScoreBtn.disabled = true;
  const imageFile = (file.type || '').startsWith('image/');
  if(scoreImportStatus) scoreImportStatus.textContent = imageFile
    ? 'Analisando a foto da partitura. Isso pode levar alguns minutos...'
    : file.name.toLowerCase().endsWith('.pdf')
    ? 'Reconhecendo a partitura. PDFs podem levar alguns minutos...'
    : 'Lendo a partitura...';
  try {
    const formData = new FormData();
    formData.append('score', file, file.name);
    const response = await fetch('/api/import_score/', {
      method: 'POST',
      body: formData,
      headers: {'X-CSRFToken': getCSRF() || ''},
    });
    const data = await response.json();
    if(!response.ok || data.status !== 'ok') throw new Error(data.message || 'Nao foi possivel ler a partitura.');
    const degrees = data.notes.map((_, index)=>String(index + 1));
    currentReadingExercise = {
      title: data.title || file.name,
      key: (READING_MAJOR_KEYS[String(Number(data.key_fifths) || 0)] || READING_MAJOR_KEYS['0']).root,
      meter: data.meter || '4/4',
      bpm: clampBpm(data.bpm || 60),
      notes: data.notes,
      beats: data.beats,
      measureStarts: data.measure_starts || [],
      sourceMeasureNoteStarts: data.source_measure_note_starts || [],
      sourceMusicXml: data.source_musicxml || '',
      keyFifths: Number(data.key_fifths) || 0,
      baseKeyFifths: Number(data.key_fifths) || 0,
      baseKeyRoot: (READING_MAJOR_KEYS[String(Number(data.key_fifths) || 0)] || READING_MAJOR_KEYS['0']).root,
      baseNotes: data.notes.slice(),
      transposeSemitones: 0,
      originalSourceUrl: data.original_source_url || '',
      originalSourceType: data.original_source_type || '',
      degrees,
      functions: data.notes.map(()=> 'nota reconhecida da partitura'),
      pitchTheory: 'Confira as notas reconhecidas antes de tocar.',
      rhythmTheory: 'As duracoes foram importadas da partitura.',
      functionTheory: 'A primeira linha melodica reconhecida foi selecionada para o sax.',
    };
    readingScorePage = 0;
    if(readingBpm) readingBpm.value = currentReadingExercise.bpm;
    if(readingToolbarBpm) readingToolbarBpm.value = currentReadingExercise.bpm;
    syncReadingMeterControl(currentReadingExercise.meter);
    syncReadingKeyControl(currentReadingExercise.keyFifths, currentReadingExercise.baseKeyRoot);
    syncOriginalScoreView(currentReadingExercise);
    setReadingViewMode('study');
    if(readingSummary) readingSummary.textContent = `${currentReadingExercise.title}: ${data.notes.length} notas reconhecidas, ${currentReadingExercise.meter}, ${currentReadingExercise.bpm} BPM.`;
    if(readingPitchTheory) readingPitchTheory.textContent = currentReadingExercise.pitchTheory;
    if(readingRhythmTheory) readingRhythmTheory.textContent = currentReadingExercise.rhythmTheory;
    if(readingFunctionTheory) readingFunctionTheory.textContent = currentReadingExercise.functionTheory;
    renderReadingScore(currentReadingExercise);
    renderReadingNotes(currentReadingExercise);
    if(scoreImportStatus) scoreImportStatus.textContent = `${data.notes.length} notas reconhecidas. Revise a pauta e clique em Ouvir como sax.`;
  } catch(error) {
    if(scoreImportStatus) scoreImportStatus.textContent = error.message || 'Falha ao reconhecer a partitura.';
  } finally {
    if(importScoreBtn) importScoreBtn.disabled = false;
    if(captureScoreBtn) captureScoreBtn.disabled = false;
    if(scoreCameraInput) scoreCameraInput.value = '';
  }
}

function readingExerciseForStorage(exercise){
  return {
    title: exercise.title,
    key: exercise.key,
    meter: exercise.meter,
    bpm: exercise.bpm,
    notes: exercise.notes,
    beats: exercise.beats,
    measureStarts: exercise.measureStarts || [],
    sourceMeasureNoteStarts: exercise.sourceMeasureNoteStarts || [],
    sourceMusicXml: exercise.sourceMusicXml || '',
    keyFifths: Number(exercise.keyFifths) || 0,
    baseKeyFifths: Number(exercise.baseKeyFifths ?? exercise.keyFifths) || 0,
    baseKeyRoot: exercise.baseKeyRoot || exercise.key || 'C4',
    baseNotes: exercise.baseNotes || exercise.notes,
    transposeSemitones: Number(exercise.transposeSemitones) || 0,
    originalSourceUrl: exercise.originalSourceUrl || '',
    originalSourceType: exercise.originalSourceType || '',
    degrees: exercise.degrees || exercise.notes.map((_, index)=>String(index + 1)),
    functions: exercise.functions || exercise.notes.map(()=>''),
    pitchTheory: exercise.pitchTheory || 'Partitura salva para estudo.',
    rhythmTheory: exercise.rhythmTheory || 'Respeite as duracoes e os compassos.',
    functionTheory: exercise.functionTheory || 'Observe o movimento da frase.',
  };
}

function loadReadingExercise(scoreData, title){
  currentReadingExercise = readingExerciseForStorage({...scoreData, title: title || scoreData.title});
  readingScorePage = 0;
  if(readingBpm) readingBpm.value = clampBpm(currentReadingExercise.bpm || 60);
  syncReadingMeterControl(currentReadingExercise.meter);
  syncReadingKeyControl(currentReadingExercise.keyFifths, currentReadingExercise.key);
  syncOriginalScoreView(currentReadingExercise);
  setReadingViewMode('study');
  if(savedScoreTitle) savedScoreTitle.value = currentReadingExercise.title || '';
  if(readingPitchTheory) readingPitchTheory.textContent = currentReadingExercise.pitchTheory;
  if(readingRhythmTheory) readingRhythmTheory.textContent = currentReadingExercise.rhythmTheory;
  if(readingFunctionTheory) readingFunctionTheory.textContent = currentReadingExercise.functionTheory;
  renderReadingScore(currentReadingExercise);
  renderReadingNotes(currentReadingExercise);
  syncReadingBpm();
}

async function saveCurrentReadingScore(){
  if(!currentReadingExercise || !currentReadingExercise.notes.length){
    if(savedScoreStatus) savedScoreStatus.textContent = 'Gere ou importe uma partitura antes de salvar.';
    return;
  }
  const title = (savedScoreTitle ? savedScoreTitle.value : '').trim() || currentReadingExercise.title || 'Partitura sem nome';
  currentReadingExercise.bpm = syncReadingBpm();
  if(saveScoreLibraryBtn) saveScoreLibraryBtn.disabled = true;
  if(savedScoreStatus) savedScoreStatus.textContent = 'Salvando...';
  try {
    const response = await fetch('/api/saved_scores/', {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'X-CSRFToken': getCSRF() || ''},
      body: JSON.stringify({title, score_data: readingExerciseForStorage(currentReadingExercise)}),
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.message || 'Nao foi possivel salvar.');
    if(savedScoreTitle) savedScoreTitle.value = title;
    if(savedScoreStatus) savedScoreStatus.textContent = `Partitura "${title}" salva.`;
    await loadSavedScores();
  } catch(error) {
    if(savedScoreStatus) savedScoreStatus.textContent = error.message || 'Falha ao salvar a partitura.';
  } finally {
    if(saveScoreLibraryBtn) saveScoreLibraryBtn.disabled = false;
  }
}

async function deleteSavedScore(id, title){
  if(!window.confirm(`Excluir a partitura "${title}"?`)) return;
  const response = await fetch('/api/saved_scores/', {
    method: 'DELETE',
    headers: {'Content-Type':'application/json', 'X-CSRFToken': getCSRF() || ''},
    body: JSON.stringify({id}),
  });
  const data = await response.json();
  if(!response.ok){
    if(savedScoreStatus) savedScoreStatus.textContent = data.message || 'Nao foi possivel excluir.';
    return;
  }
  if(savedScoreStatus) savedScoreStatus.textContent = 'Partitura excluida.';
  await loadSavedScores();
}

async function loadSavedScores(){
  if(!savedScoresList) return;
  try {
    const response = await fetch('/api/saved_scores/');
    const data = await response.json();
    if(!response.ok) throw new Error(data.message || 'Nao foi possivel consultar as partituras.');
    savedScoresList.innerHTML = '';
    if(!data.scores.length){
      const empty = document.createElement('span');
      empty.textContent = 'Nenhuma partitura salva.';
      savedScoresList.appendChild(empty);
      return;
    }
    data.scores.forEach((score)=>{
      const item = document.createElement('div');
      item.className = 'saved-score-item';
      const label = document.createElement('span');
      const noteCount = Array.isArray(score.score_data.notes) ? score.score_data.notes.length : 0;
      label.textContent = `${score.title} - ${noteCount} notas, ${score.score_data.meter || '4/4'}, ${score.score_data.bpm || 60} BPM`;
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = 'Abrir';
      open.addEventListener('click', ()=>{
        loadReadingExercise(score.score_data, score.title);
        if(savedScoreStatus) savedScoreStatus.textContent = `Partitura "${score.title}" carregada.`;
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Excluir';
      remove.addEventListener('click', ()=>deleteSavedScore(score.id, score.title));
      item.append(label, open, remove);
      savedScoresList.appendChild(item);
    });
  } catch(error) {
    if(savedScoreStatus) savedScoreStatus.textContent = error.message || 'Falha ao consultar partituras.';
  }
}

async function playReadingExercise(startIndex = 0, endIndex = null, timelineStartIndex = startIndex){
  if(readingPlaybackRunning) return;
  if(!currentReadingExercise) generateReadingExercise();
  if(!currentReadingExercise) return;
  const finalIndex = endIndex === null ? currentReadingExercise.notes.length : Math.min(endIndex, currentReadingExercise.notes.length);
  const sequence = currentReadingExercise.notes.slice(startIndex, finalIndex);
  const durations = currentReadingExercise.beats.slice(startIndex, finalIndex);
  const timelineDurations = currentReadingExercise.beats.slice(timelineStartIndex, finalIndex);
  if(!sequence.length) return;
  const sessionId = ++readingPlaybackSessionId;
  readingActiveStartIndex = startIndex;
  readingActiveEndIndex = finalIndex;
  readingTimelineStartIndex = timelineStartIndex;
  currentReadingExercise.bpm = syncReadingBpm();
  const secondsPerBeat = 60 / currentReadingExercise.bpm;
  const cumulativeBeats = [0];
  durations.forEach(duration=>cumulativeBeats.push(cumulativeBeats[cumulativeBeats.length - 1] + (Number(duration) || 1)));
  const precedingBeats = currentReadingExercise.beats.slice(timelineStartIndex, startIndex)
    .reduce((sum, duration)=>sum + (Number(duration) || 1), 0);
  const totalTimelineBeats = timelineDurations.reduce((sum, duration)=>sum + (Number(duration) || 1), 0);
  const totalSeconds = totalTimelineBeats * secondsPerBeat;
  updateReadingPlaybackProgress(precedingBeats * secondsPerBeat, totalSeconds);
  const longScore = currentReadingExercise.notes.length > 80;
  let previousIndex = -1;
  readingPlaybackRunning = true;
  readingPlaybackPaused = false;
  if(pauseReadingBtn){ pauseReadingBtn.disabled = false; pauseReadingBtn.textContent = '❚❚ Pausar'; }
  if(stopReadingBtn) stopReadingBtn.disabled = false;
  if(playReadingExerciseBtn) playReadingExerciseBtn.disabled = true;
  if(playReadingPageBtn) playReadingPageBtn.disabled = true;
  await playReferenceSequence(sequence, currentReadingExercise.bpm, (sequenceIndex)=>{
    const index = sequenceIndex >= 0 ? startIndex + sequenceIndex : -1;
    const elapsedSeconds = sequenceIndex >= 0
      ? (precedingBeats + cumulativeBeats[sequenceIndex]) * secondsPerBeat
      : totalSeconds;
    updateReadingPlaybackProgress(elapsedSeconds, totalSeconds);
    updateOriginalPlaybackGuide(index, elapsedSeconds, totalSeconds);
    if(previousIndex >= 0){
      const previousChip = readingNotes ? readingNotes.querySelector(`[data-score-note-index="${previousIndex}"]`) : null;
      const previousNote = readingScoreSvg ? readingScoreSvg.querySelector(`[data-score-note-index="${previousIndex}"]`) : null;
      if(previousChip) previousChip.classList.remove('reference-playing');
      if(previousNote) previousNote.classList.remove('reference-playing');
    }
    if(index >= 0){
      const pageRanges = readingScorePageRanges(currentReadingExercise);
      const targetPage = Math.max(0, pageRanges.findIndex(range=>index >= range.start && index < range.end));
      if(targetPage !== readingScorePage){
        readingScorePage = targetPage;
        renderReadingScore(currentReadingExercise);
        renderReadingNotes(currentReadingExercise);
        if(readingScoreSvg) readingScoreSvg.scrollLeft = 0;
      }
      if(readingOsmd && readingOsmdRenderPromise){
        const cursorPage = targetPage;
        const localIndex = index - pageRanges[targetPage].start;
        readingOsmdRenderPromise.then(()=>{
          if(readingScorePage === cursorPage) positionReadingOsmdCursor(localIndex);
        });
      }
      const activeChip = readingNotes ? readingNotes.querySelector(`[data-score-note-index="${index}"]`) : null;
      const activeNote = readingScoreSvg ? readingScoreSvg.querySelector(`[data-score-note-index="${index}"]`) : null;
      if(activeChip) activeChip.classList.add('reference-playing');
      if(activeNote) activeNote.classList.add('reference-playing');
      if(activeNote && readingScoreSvg){
        const noteX = Number(activeNote.getAttribute('cx')) || 0;
        const viewportWidth = readingScoreSvg.clientWidth;
        const maxScroll = Math.max(0, readingScoreSvg.scrollWidth - viewportWidth);
        const targetScroll = Math.max(0, Math.min(maxScroll, noteX - viewportWidth * 0.42));
        readingScoreSvg.scrollTo({left: targetScroll, behavior: longScore ? 'auto' : 'smooth'});
      }
    } else if(readingOsmd && readingOsmd.cursor){
      readingOsmd.cursor.hide();
    }
    previousIndex = index;
  }, durations);
  if(sessionId !== readingPlaybackSessionId) return;
  readingPlaybackRunning = false;
  readingPlaybackPaused = false;
  if(pauseReadingBtn){ pauseReadingBtn.disabled = true; pauseReadingBtn.textContent = '❚❚ Pausar'; }
  if(stopReadingBtn) stopReadingBtn.disabled = true;
  if(playReadingExerciseBtn) playReadingExerciseBtn.disabled = false;
  if(playReadingPageBtn) playReadingPageBtn.disabled = false;
  if(readingRepeatEnabled) window.setTimeout(()=>playReadingExercise(timelineStartIndex, finalIndex, timelineStartIndex), 120);
}

async function seekReadingPlayback(rawRatio){
  if(!currentReadingExercise) generateReadingExercise();
  if(!currentReadingExercise || !currentReadingExercise.notes.length) return;
  const ratio = Math.max(0, Math.min(0.9999, Number(rawRatio) || 0));
  const timelineStart = readingPlaybackRunning ? readingTimelineStartIndex : 0;
  const timelineEnd = readingPlaybackRunning ? readingActiveEndIndex : currentReadingExercise.notes.length;
  const timelineDurations = currentReadingExercise.beats.slice(timelineStart, timelineEnd);
  const totalBeats = timelineDurations.reduce((sum, duration)=>sum + (Number(duration) || 1), 0);
  const targetBeat = totalBeats * ratio;
  let accumulated = 0;
  let targetIndex = timelineStart;
  for(let index = 0; index < timelineDurations.length; index += 1){
    const duration = Number(timelineDurations[index]) || 1;
    if(accumulated + duration > targetBeat){ targetIndex = timelineStart + index; break; }
    accumulated += duration;
    targetIndex = Math.min(timelineEnd - 1, timelineStart + index + 1);
  }
  readingPlaybackSessionId += 1;
  referencePlaybackId += 1;
  if(activeReferencePlaybackBus && audioCtx){
    activeReferencePlaybackBus.gain.cancelScheduledValues(audioCtx.currentTime);
    activeReferencePlaybackBus.gain.setValueAtTime(0, audioCtx.currentTime);
    try{ activeReferencePlaybackBus.disconnect(); }catch(error){}
    activeReferencePlaybackBus = null;
  }
  if(readingPlaybackPaused && audioCtx) await audioCtx.resume();
  readingPlaybackRunning = false;
  readingPlaybackPaused = false;
  const targetPage = readingScorePageRanges(currentReadingExercise)
    .findIndex(range=>targetIndex >= range.start && targetIndex < range.end);
  if(targetPage >= 0 && targetPage !== readingScorePage) setReadingScorePage(targetPage);
  playReadingExercise(targetIndex, timelineEnd, timelineStart);
}

function playCurrentReadingPage(){
  if(!currentReadingExercise) generateReadingExercise();
  if(!currentReadingExercise) return;
  const pageRange = readingScorePageRanges(currentReadingExercise)[readingScorePage];
  const startIndex = pageRange.start;
  const endIndex = pageRange.end;
  playReadingExercise(startIndex, endIndex);
}

async function toggleReadingPlaybackPause(){
  if(!readingPlaybackRunning || !audioCtx) return;
  if(!readingPlaybackPaused){
    await audioCtx.suspend();
    readingPlaybackPaused = true;
    if(pauseReadingBtn) pauseReadingBtn.textContent = '▶ Retomar';
  } else {
    await audioCtx.resume();
    readingPlaybackPaused = false;
    if(pauseReadingBtn) pauseReadingBtn.textContent = '❚❚ Pausar';
  }
}

async function stopReadingPlayback(){
  readingPlaybackSessionId += 1;
  referencePlaybackId += 1;
  if(activeReferencePlaybackBus && audioCtx){
    activeReferencePlaybackBus.gain.cancelScheduledValues(audioCtx.currentTime);
    activeReferencePlaybackBus.gain.setValueAtTime(0, audioCtx.currentTime);
    try{ activeReferencePlaybackBus.disconnect(); }catch(error){}
    activeReferencePlaybackBus = null;
  }
  if(audioCtx && audioCtx.state === 'suspended'){
    try{ await audioCtx.resume(); }catch(error){}
  }
  readingPlaybackRunning = false;
  readingPlaybackPaused = false;
  readingRepeatEnabled = false;
  document.querySelectorAll('.reference-playing').forEach(element=>element.classList.remove('reference-playing'));
  if(readingOsmd && readingOsmd.cursor) readingOsmd.cursor.hide();
  if(pauseReadingBtn){ pauseReadingBtn.disabled = true; pauseReadingBtn.textContent = '❚❚ Pausar'; }
  if(stopReadingBtn) stopReadingBtn.disabled = true;
  if(playReadingExerciseBtn) playReadingExerciseBtn.disabled = false;
  if(playReadingPageBtn) playReadingPageBtn.disabled = false;
  if(repeatReadingBtn){
    repeatReadingBtn.setAttribute('aria-pressed', 'false');
    repeatReadingBtn.classList.remove('active');
  }
  updateReadingPlaybackProgress(0, 0);
  updateOriginalPlaybackGuide(-1, 0, 0);
}

function practiceReadingExercise(){
  if(!currentReadingExercise) generateReadingExercise();
  if(!currentReadingExercise || !currentReadingExercise.notes.length) return;
  currentReadingExercise.bpm = syncReadingBpm();
  beginnerStandaloneExercises.sheet_reading = {
    title: `Leitura - ${currentReadingExercise.title}`,
    mode: 'scale',
    seconds: 0.5,
    target: currentReadingExercise.notes[0],
    bpm: currentReadingExercise.bpm,
    sequence: currentReadingExercise.notes,
    labels: currentReadingExercise.notes.map((note, index)=>`${currentReadingExercise.degrees[index]} - ${noteToWrittenSolfege(note)}`),
    help: 'Leia a pauta, ouca a referencia e toque a sequencia respeitando pulso, altura e resolucao.'
  };
  const optionExists = beginnerExercise && Array.from(beginnerExercise.options).some(opt => opt.value === 'sheet_reading');
  if(beginnerExercise && !optionExists){
    const option = document.createElement('option');
    option.value = 'sheet_reading';
    option.textContent = 'Leitura com partitura';
    beginnerExercise.appendChild(option);
  }
  if(beginnerExercise){
    beginnerExercise.value = 'sheet_reading';
    applyStandaloneExercise();
    if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
    setBeginnerStatus('ready', 'Leitura', 'Partitura carregada. Clique em Tocar para praticar nota por nota.');
    showAppStage('practice');
  }
}

function renderLyricMelody(){
  if(!lyricMelodyInput || !lyricMelodyOutput) return;
  const sections = parseLyricMelodyText(lyricMelodyInput.value);
  currentLyricMelody = {
    sections,
    notes: sections.flatMap(section => section.notes.map(solfegeTokenToNoteName).filter(Boolean))
  };
  lyricMelodyOutput.innerHTML = '';
  if(!sections.length){
    lyricMelodyOutput.textContent = 'Digite uma linha de notas e abaixo a linha da letra.';
    if(playLyricMelodyBtn) playLyricMelodyBtn.disabled = true;
    if(practiceLyricMelodyBtn) practiceLyricMelodyBtn.disabled = true;
    return;
  }
  sections.forEach((section)=>{
    const block = document.createElement('div');
    block.className = 'lyric-melody-line';
    const notes = document.createElement('div');
    notes.className = 'lyric-melody-notes';
    section.notes.forEach((note, index)=>{
      const span = document.createElement('span');
      span.textContent = `${note}${index < section.notes.length - 1 ? ' ' : ''}`;
      if(/[A-Z]/.test(note) || /#$/.test(note)) span.className = 'strong';
      notes.appendChild(span);
    });
    const lyric = document.createElement('div');
    lyric.className = 'lyric-melody-text';
    lyric.textContent = section.lyricLine;
    block.appendChild(notes);
    block.appendChild(lyric);
    lyricMelodyOutput.appendChild(block);
  });
  if(playLyricMelodyBtn) playLyricMelodyBtn.disabled = currentLyricMelody.notes.length === 0;
  if(practiceLyricMelodyBtn) practiceLyricMelodyBtn.disabled = currentLyricMelody.notes.length === 0;
}

async function playLyricMelody(){
  if(!currentLyricMelody || !currentLyricMelody.notes.length) renderLyricMelody();
  if(!currentLyricMelody || !currentLyricMelody.notes.length) return;
  const melodyChips = lyricMelodyOutput ? Array.from(lyricMelodyOutput.querySelectorAll('.lyric-melody-notes span')) : [];
  await playReferenceSequence(currentLyricMelody.notes, arrangementBpm ? clampBpm(arrangementBpm.value || 70) : 70, (index)=>{
    melodyChips.forEach((chip, chipIndex)=>chip.classList.toggle('reference-playing', chipIndex === index));
  });
}

function practiceLyricMelody(){
  if(!currentLyricMelody || !currentLyricMelody.notes.length) renderLyricMelody();
  if(!currentLyricMelody || !currentLyricMelody.notes.length) return;
  beginnerStandaloneExercises.lyric_melody = {
    title: 'Cifra melodica',
    mode: 'scale',
    seconds: 0.45,
    target: currentLyricMelody.notes[0],
    bpm: arrangementBpm ? clampBpm(arrangementBpm.value || 70) : 70,
    sequence: currentLyricMelody.notes,
    labels: currentLyricMelody.notes.map(noteToSolfege),
    help: 'Pratique a melodia da letra. Ouça como sax e toque nota por nota.'
  };
  const optionExists = beginnerExercise && Array.from(beginnerExercise.options).some(opt => opt.value === 'lyric_melody');
  if(beginnerExercise && !optionExists){
    const option = document.createElement('option');
    option.value = 'lyric_melody';
    option.textContent = 'Cifra melodica';
    beginnerExercise.appendChild(option);
  }
  if(beginnerExercise){
    beginnerExercise.value = 'lyric_melody';
    applyStandaloneExercise();
    if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
    setBeginnerStatus('ready', 'Cifra melodica', 'Melodia carregada. Clique em Comecar para praticar.');
    showAppStage('practice');
  }
}

function renderArrangement(analysis){
  if(!arrangementSummary || !arrangementChords || !arrangementNotes) return;
  arrangementChords.innerHTML = '';
  arrangementNotes.innerHTML = '';
  if(melodicCipher) melodicCipher.innerHTML = '';
  const keyInfo = analysis.originalKey
    ? ` Tom original: ${analysis.originalKey} (${noteToSolfege(`${analysis.originalKey.replace(/m$/, '')}4`)}${/m$/.test(analysis.originalKey) ? ' menor' : ''}). Para ${getInstrumentLabel()}: escrever ${analysis.writtenKey || '-'}.`
    : '';
  arrangementSummary.textContent = analysis.chords.length
    ? `${analysis.chords.length} acordes na progressao. ${analysis.measures.length} compassos gerados: nota forte, notas de passagem e aproximacao para o proximo acorde.${keyInfo}`
    : 'Nao encontrei acordes. Cole a cifra com acordes como C, G, Am, F.';
  analysis.chords.slice(0, 32).forEach((chord)=>{
    const chip = document.createElement('span');
    chip.textContent = chord;
    arrangementChords.appendChild(chip);
  });
  analysis.measures.slice(0, 16).forEach((measure, index)=>{
    const chip = document.createElement('span');
    chip.textContent = `${index + 1}. ${measure.chord}: ${measure.notes.map(noteToSolfege).join(' - ')}`;
    arrangementNotes.appendChild(chip);
  });
  if(melodicCipher && analysis.measures.length){
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Compasso</th><th>Letra</th><th>Acorde</th><th>Graus</th><th>Escrever no sax</th><th>Soa</th><th>Funcao</th></tr></thead>';
    const body = document.createElement('tbody');
    analysis.measures.slice(0, 24).forEach((measure, index)=>{
      const sounding = soundingNotesForWrittenNotes(measure.notes);
      const row = document.createElement('tr');
      [
        index + 1,
        measure.lyric || '',
        measure.chord,
        measure.degrees.join(' - '),
        measure.notes.map(noteToSolfege).join(' - '),
        sounding.map(noteToSolfege).join(' - '),
        measure.functions.join(' - '),
      ].forEach((value)=>{
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    melodicCipher.appendChild(table);
  }
}

function analyzeChordSheet(){
  const progression = extractChordProgression(chordSheetInput ? chordSheetInput.value : '');
  const style = arrangementStyle ? arrangementStyle.value : 'worship';
  const built = buildArrangementNotes(progression, style);
  const originalKey = extractOriginalKey(chordSheetInput ? chordSheetInput.value : '', progression);
  const writtenKey = originalKey ? transposedWrittenKeyForInstrument(originalKey) : '';
  currentArrangement = {
    chords: progression.map(item => item.chord),
    progression,
    notes: built.notes,
    labels: built.labels,
    measures: built.measures,
    style,
    originalKey,
    writtenKey,
    bpm: arrangementBpm ? clampBpm(arrangementBpm.value || 70) : 70
  };
  renderArrangement(currentArrangement);
  syncLyricMelodyFromArrangement();
  if(playArrangementBtn) playArrangementBtn.disabled = currentArrangement.notes.length === 0;
  if(useArrangementPracticeBtn) useArrangementPracticeBtn.disabled = currentArrangement.notes.length === 0;
}

async function fetchChordSheetFromLink(){
  if(!chordSheetUrl || !chordSheetInput) return;
  const url = chordSheetUrl.value.trim();
  if(!url){
    if(arrangementSummary) arrangementSummary.textContent = 'Cole o link da cifra primeiro.';
    return;
  }
  if(fetchChordSheetBtn) fetchChordSheetBtn.disabled = true;
  if(arrangementSummary) arrangementSummary.textContent = 'Buscando cifra pelo link...';
  try {
    const response = await fetch('/api/fetch_chord_sheet/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() || ''},
      body: JSON.stringify({url})
    });
    const data = await response.json();
    if(data.status === 'locked'){
      if(arrangementSummary) arrangementSummary.textContent = `${data.title || 'Cifra Melodica'}: ${data.message}`;
      if(lyricMelodyInput) lyricMelodyInput.value = '';
      if(lyricMelodyOutput) lyricMelodyOutput.textContent = 'Cole aqui as notas e a letra copiadas da Cifra Melodica depois de entrar no site.';
      return;
    }
    if(!response.ok || data.status !== 'ok'){
      throw new Error(data.message || 'Nao consegui buscar essa cifra.');
    }
    chordSheetInput.value = data.content;
    if(data.source === 'cifra_melodica'){
      if(lyricMelodyInput) lyricMelodyInput.value = data.content;
      renderLyricMelody();
      if(arrangementSummary) arrangementSummary.textContent = `${data.title}: cifra melodica importada. Use "Ouvir melodia como sax" ou "Praticar melodia".`;
    } else {
      analyzeChordSheet();
      if(arrangementSummary && currentArrangement){
        arrangementSummary.textContent = `${data.title}: ${currentArrangement.chords.length} acordes na progressao. ${currentArrangement.measures.length} compassos com resolucao nas notas fortes. Tom original: ${currentArrangement.originalKey || '-'}. Para ${getInstrumentLabel()}: escrever ${currentArrangement.writtenKey || '-'}.`;
      }
    }
  } catch(e) {
    console.error('fetch chord sheet failed', e);
    if(arrangementSummary) arrangementSummary.textContent = e.message || 'Nao consegui buscar essa cifra. Cole o texto manualmente.';
  } finally {
    if(fetchChordSheetBtn) fetchChordSheetBtn.disabled = false;
  }
}

async function playCurrentArrangement(){
  if(!currentArrangement || !currentArrangement.notes.length) analyzeChordSheet();
  if(!currentArrangement || !currentArrangement.notes.length) return;
  await playReferenceSequence(currentArrangement.notes, currentArrangement.bpm || 70);
}

function useArrangementAsBeginnerPractice(){
  if(!currentArrangement || !currentArrangement.notes.length) analyzeChordSheet();
  if(!currentArrangement || !currentArrangement.notes.length) return;
  beginnerStandaloneExercises.arrangement_from_chords = {
    title: 'Arranjo por cifra',
    mode: 'scale',
    seconds: 0.45,
    target: currentArrangement.notes[0],
    bpm: currentArrangement.bpm || 70,
    sequence: currentArrangement.notes,
    labels: currentArrangement.labels,
    help: 'Pratique o arranjo por compasso. As primeiras notas resolvem forte no acorde; as ultimas aproximam o proximo acorde.'
  };
  const optionExists = beginnerExercise && Array.from(beginnerExercise.options).some(opt => opt.value === 'arrangement_from_chords');
  if(beginnerExercise && !optionExists){
    const option = document.createElement('option');
    option.value = 'arrangement_from_chords';
    option.textContent = 'Arranjo por cifra';
    beginnerExercise.appendChild(option);
  }
  if(beginnerExercise){
    beginnerExercise.value = 'arrangement_from_chords';
    applyStandaloneExercise();
    if(document.getElementById('beginnerRoutine')) document.getElementById('beginnerRoutine').style.display = '';
    setBeginnerStatus('ready', 'Arranjo', 'Linha da cifra carregada. Clique em Comecar para praticar.');
    showAppStage('practice');
  }
}

function getInstrumentTransposeSemitones(){
  const instrument = beginnerInstrument ? beginnerInstrument.value : 'alto';
  if(instrument === 'alto') return -9; // written C sounds Eb below: major sixth down
  if(instrument === 'tenor' || instrument === 'soprano') return -2; // written C sounds Bb below
  return 0;
}

function writtenNoteToSoundingFrequency(noteName){
  const midi = noteNameToMidiNumber(noteName);
  if(midi === null) return null;
  return midiToFrequency(midi + getInstrumentTransposeSemitones());
}

function getInstrumentLabel(){
  if(!beginnerInstrument) return 'Sax alto';
  return beginnerInstrument.options[beginnerInstrument.selectedIndex].textContent;
}

function quantizeDuration(durationMs){
  const bpm = clampBpm(transcriptionBpm ? transcriptionBpm.value || 60 : 60);
  const quarter = 60000 / bpm;
  const candidates = [
    {label:'semicolcheia', factor:0.25},
    {label:'colcheia', factor:0.5},
    {label:'semínima', factor:1},
    {label:'mínima', factor:2},
    {label:'semibreve', factor:4}
  ];
  let best = candidates[2];
  let bestDiff = Infinity;
  for (const cand of candidates) {
    const diff = Math.abs(durationMs - quarter * cand.factor);
    if (diff < bestDiff) { bestDiff = diff; best = cand; }
  }
  return {label: best.label, ms: Math.round(quarter * best.factor), factor: best.factor};
}

function getNoteDurationLabel(durationMs){
  const quant = quantizeDuration(durationMs);
  if (quant.label === 'semínima') return 'semínima';
  if (quant.label === 'colcheia') return 'colcheia';
  if (quant.label === 'semicolcheia') return 'semicolcheia';
  if (quant.label === 'mínima') return 'mínima';
  return 'semibreve';
}

function playScoreSequence(){
  if (!scoreEvents.length) { alert('Nenhuma nota na partitura para executar.'); return; }
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const startTime = audioCtx.currentTime + 0.2;
  scoreEvents.forEach((event, index) => {
    const nextTime = index < scoreEvents.length - 1 ? scoreEvents[index + 1].start : event.start + 700;
    const durationMs = event.duration > 0 ? event.duration : Math.max(120, nextTime - event.start);
    const quant = quantizeDuration(durationMs);
    const duration = Math.max(0.25, Math.min(1.2, quant.ms / 1000));
    const frequency = noteNameToFrequency(event.note);
    if (!frequency) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const noteStart = startTime + event.start / 1000;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
    gain.gain.setValueAtTime(0.25, noteStart + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, noteStart + duration);
    osc.start(noteStart);
    osc.stop(noteStart + duration);
  });
}

function buildMusicXML(events){
  // events: [{note, start, duration}]
  const divisions = 480; // quarter = 480
  const quarterLen = divisions;
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  let out = '';
  out += xmlHeader;
  out += `<score-partwise version="3.1">\n`;
  out += `<work><work-title>Exported score</work-title></work>\n`;
  out += `<identification><creator type="composer">Captured</creator></identification>\n`;
  out += `<part-list><score-part id="P1"><part-name>Voice</part-name></score-part></part-list>\n`;
  out += `<part id="P1">\n`;

  // sort events by start
  events = events.slice().sort((a,b)=>a.start - b.start);

  // helpers
  function noteToPitch(note){
    const scientific = String(note || '').match(/^([A-G])([#b]?)(-?\d+)$/);
    if(scientific){
      return {step:scientific[1], alter:scientific[2] === '#' ? 1 : scientific[2] === 'b' ? -1 : 0, octave:Number(scientific[3])};
    }
    const n = normalizeNoteName(note);
    const m = n.match(/^([a-z#]+)(-?\d+)$/);
    if(!m) return null;
    const name = m[1]; const octave = parseInt(m[2],10);
    const stepMap = {do:'C','do#':'C',re:'D','re#':'D',mi:'E',fa:'F','fa#':'F',sol:'G','sol#':'G',la:'A','la#':'A',si:'B'};
    const alterMap = {'do#':1,'re#':1,'fa#':1,'sol#':1,'la#':1};
    return {step: stepMap[name] || 'C', alter: alterMap[name]||0, octave};
  }
  function typeFromFactor(f){ if(f===0.25) return '16th'; if(f===0.5) return 'eighth'; if(f===1) return 'quarter'; if(f===2) return 'half'; return 'whole'; }

  const meterMatch = String(transcriptionMeter ? transcriptionMeter.value : '4/4').match(/^(\d+)\/(\d+)$/);
  const meterBeats = meterMatch ? Number(meterMatch[1]) : 4;
  const meterBeatType = meterMatch ? Number(meterMatch[2]) : 4;
  const measureDivs = Math.round(quarterLen * meterBeats * 4 / meterBeatType);
  let measureIndex = 1;
  let measurePos = 0; // in divisions

  function openMeasure(){
    out += `<measure number="${measureIndex}">\n`;
    if(measurePos===0){
      out += `<attributes>\n<divisions>${divisions}</divisions>\n<key><fifths>0</fifths></key>\n<time><beats>${meterBeats}</beats><beat-type>${meterBeatType}</beat-type></time>\n<clef><sign>G</sign><line>2</line></clef>\n</attributes>\n`;
    }
  }

  openMeasure();

  // previous end time for rests
  let prevEnd = 0;

  for(let i=0;i<events.length;i++){
    const ev = events[i];
    const startMs = Math.round(ev.start);
    const durMs = Math.max(80, Math.round(ev.duration || 0));
    // if there's a gap from prevEnd to ev.start -> insert rest
    if(i===0 && startMs>0){
      // initial rest
      const restMs = startMs;
      insertTimedRest(restMs);
    } else if(startMs > prevEnd){
      insertTimedRest(startMs - prevEnd);
    }

    // quantize duration
    const quant = quantizeDuration(durMs);
    const durDivs = Math.round(divisions * quant.factor);

    // measure boundary handling
    if(measurePos + durDivs > measureDivs){
      // split note across measures by closing/opening measure (simple approach: move note to next measure)
      out += `</measure>\n`;
      measureIndex++; measurePos=0; openMeasure();
    }

    const p = noteToPitch(ev.note);
    if(p){
      out += `<note>\n<pitch>\n<step>${p.step}</step>\n` + (p.alter? `<alter>${p.alter}</alter>\n` : '') + `<octave>${p.octave}</octave>\n</pitch>\n`;
    } else {
      out += `<note>\n`;
    }
    out += `<duration>${durDivs}</duration>\n`;
    out += `<type>${typeFromFactor(quant.factor)}</type>\n`;

    // tie handling: if next event same pitch and immediately adjacent, add tie start/stop
    const next = events[i+1];
    const sameNext = next && normalizeNoteName(next.note)===normalizeNoteName(ev.note) && Math.abs((ev.start+durMs)-next.start) < 120;
    if(sameNext){ out += `<tie type="start"/>\n`; }
    if(i>0){
      const prev = events[i-1];
      const samePrev = prev && normalizeNoteName(prev.note)===normalizeNoteName(ev.note) && Math.abs(prev.start+prev.duration - ev.start) < 120;
      if(samePrev){ out += `<tie type="stop"/>\n`; }
    }

    out += `</note>\n`;
    measurePos += durDivs;
    prevEnd = startMs + durMs;
  }

  // close final measure
  out += `</measure>\n`;
  out += `</part>\n</score-partwise>`;
  return out;

  // helper to insert rest with quantization
  function insertTimedRest(ms){
    let remaining = Math.max(80, ms);
    while(remaining > 0){
      const q = quantizeDuration(remaining);
      const durDivs = Math.round(divisions * q.factor);
      if(measurePos + durDivs > measureDivs){
        out += `</measure>\n`;
        measureIndex++; measurePos=0; openMeasure();
      }
      out += `<note>\n<rest/>\n<duration>${durDivs}</duration>\n<type>${typeFromFactor(q.factor)}</type>\n</note>\n`;
      measurePos += durDivs;
      remaining -= q.ms;
    }
  }
}

function exportMusicXML(){
  if(!scoreEvents || scoreEvents.length===0){ alert('Nenhuma nota para exportar'); return; }
  const xml = buildMusicXML(scoreEvents);
  const blob = new Blob([xml], {type:'application/xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'partitura.musicxml'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

if (exportMusicXMLBtn) exportMusicXMLBtn.addEventListener('click', exportMusicXML);
// MIDI export (simple format 0)
function writeVarLen(value){
  const buffer = [];
  let val = value & 0x0FFFFFFF;
  buffer.push(val & 0x7F);
  val >>= 7;
  while(val > 0){
    buffer.unshift((val & 0x7F) | 0x80);
    val >>= 7;
  }
  return buffer;
}

function noteNameToMidi(note){
  const map = {'do':0,'do#':1,'re':2,'re#':3,'mi':4,'fa':5,'fa#':6,'sol':7,'sol#':8,'la':9,'la#':10,'si':11};
  const m = normalizeNoteName(note).match(/^([a-z#]+)(-?\d+)$/);
  if(!m) return null;
  const base = m[1]; const oct = parseInt(m[2],10);
  const sem = map[base]; if(sem===undefined) return null;
  return (oct + 1) * 12 + sem;
}

function buildMidiFile(events, bpm=90){
  // ticks per quarter
  const tpq = 480;
  const ticksPerSecond = tpq * bpm / 60;
  // build note on/off events
  const evs = [];
  events.forEach(ev=>{
    const startTick = Math.round((ev.start / 1000) * ticksPerSecond);
    const durMs = Math.max(80, ev.duration || 0);
    const durTicks = Math.max(1, Math.round((durMs/1000) * ticksPerSecond));
    const midi = noteNameToMidi(ev.note);
    if(midi===null) return;
    evs.push({tick:startTick, type:'on', note:midi, vel:80});
    evs.push({tick:startTick+durTicks, type:'off', note:midi, vel:0});
  });
  // sort by tick, on before off at same tick
  evs.sort((a,b)=> a.tick - b.tick || (a.type==='on' ? -1 : 1));

  const trackData = [];
  let lastTick = 0;
  // set tempo
  const microPerQuarter = Math.round(60000000 / bpm);
  trackData.push(...writeVarLen(0)); trackData.push(0xFF,0x51,0x03,
    (microPerQuarter>>16)&0xFF,(microPerQuarter>>8)&0xFF,microPerQuarter&0xFF);
  // time signature 4/4
  trackData.push(...writeVarLen(0)); trackData.push(0xFF,0x58,0x04,0x04,0x02,0x18,0x08);

  evs.forEach(e=>{
    const delta = e.tick - lastTick;
    trackData.push(...writeVarLen(delta));
    if(e.type==='on'){
      trackData.push(0x90, e.note & 0x7F, e.vel & 0x7F);
    } else {
      trackData.push(0x80, e.note & 0x7F, e.vel & 0x7F);
    }
    lastTick = e.tick;
  });
  // end of track
  trackData.push(...writeVarLen(0)); trackData.push(0xFF,0x2F,0x00);

  // build chunks
  function chunk(id, dataBytes){
    const header = [];
    for(let i=0;i<4;i++) header.push(id.charCodeAt(i));
    const len = dataBytes.length;
    header.push((len>>24)&0xFF,(len>>16)&0xFF,(len>>8)&0xFF,len&0xFF);
    return Uint8Array.from(header.concat(dataBytes));
  }

  const header = [0x00,0x00,0x00,0x06, // header length
    0x00,0x00, // format 0
    0x00,0x01, // one track
    (tpq>>8)&0xFF, tpq&0xFF];

  const headerChunk = chunk('MThd', header);
  const trackChunk = chunk('MTrk', trackData);
  // concat
  const out = new Uint8Array(headerChunk.length + trackChunk.length);
  out.set(headerChunk,0); out.set(trackChunk, headerChunk.length);
  return new Blob([out], {type:'audio/midi'});
}

function exportMIDI(){
  if(!scoreEvents || scoreEvents.length===0){ alert('Nenhuma nota para exportar'); return; }
  const blob = buildMidiFile(scoreEvents, 90);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'partitura.mid'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

if (exportMidiBtn) exportMidiBtn.addEventListener('click', exportMIDI);

function updateNoteDisplay(){
  const currentNote = document.getElementById('currentNote');
  const noteTimeline = document.getElementById('noteTimeline');
  if (currentNote) {
    currentNote.textContent = lastDetectedNote || '—';
  }
  renderScore();
  if (playScoreBtn) playScoreBtn.disabled = scoreEvents.length === 0;
  if (clearScoreBtn) clearScoreBtn.disabled = scoreEvents.length === 0;
  if (playTranscriptionBtn) playTranscriptionBtn.disabled = scoreEvents.length === 0;
  if (clearTranscriptionBtn) clearTranscriptionBtn.disabled = scoreEvents.length === 0;
  if (noteTimeline) {
    noteTimeline.innerHTML = '';
    if (noteHistory.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aguardando notas...';
      noteTimeline.appendChild(li);
      return;
    }
    noteHistory.slice(-8).forEach(note => {
      const li = document.createElement('li');
      li.textContent = note;
      noteTimeline.appendChild(li);
    });
  }
}

function clearScore(){
  noteHistory = [];
  scoreEvents = [];
  lastDetectedNote = null;
  updateNoteDisplay();
}

// simple autocorrelation pitch detection
function autoCorrelate(buf, sampleRate){
  const size = buf.length;
  let rms = 0;
  for(let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if(!hasUsableSignal(rms)) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_PITCH_HZ));
  const maxLag = Math.min(size - 2, Math.ceil(sampleRate / MIN_PITCH_HZ));
  let bestLag = -1;
  let bestCorrelation = 0;

  for(let lag = minLag; lag <= maxLag; lag++){
    let sum = 0;
    let sumA = 0;
    let sumB = 0;
    const limit = size - lag;
    for(let i = 0; i < limit; i++){
      const a = buf[i];
      const b = buf[i + lag];
      sum += a * b;
      sumA += a * a;
      sumB += b * b;
    }
    const denom = Math.sqrt(sumA * sumB);
    if(denom === 0) continue;
    const correlation = sum / denom;
    if(correlation > bestCorrelation){
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if(bestLag < 0 || bestCorrelation < 0.45) return null;
  const frequency = sampleRate / bestLag;
  if(frequency > MAX_PITCH_HZ || frequency < MIN_PITCH_HZ) return null;
  return frequency;
}

if(startTranscriptionBtn) startTranscriptionBtn.addEventListener('click', ()=>{
  if(transcriptionStatus) transcriptionStatus.textContent = 'Ouvindo o estudante. Toque uma nota por vez e mantenha o pulso.';
  start();
  startTranscriptionBtn.disabled = true;
  if(stopTranscriptionBtn) stopTranscriptionBtn.disabled = false;
});
if(stopTranscriptionBtn) stopTranscriptionBtn.addEventListener('click', ()=>{
  stop();
  stopTranscriptionBtn.disabled = true;
  if(startTranscriptionBtn) startTranscriptionBtn.disabled = false;
  if(transcriptionStatus) transcriptionStatus.textContent = scoreEvents.length
    ? `${scoreEvents.length} notas escritas conforme ${transcriptionBpm ? transcriptionBpm.value : 60} BPM.`
    : 'Nenhuma nota foi reconhecida. Calibre o microfone e tente novamente.';
});
if(playTranscriptionBtn) playTranscriptionBtn.addEventListener('click', playScoreSequence);
if(clearTranscriptionBtn) clearTranscriptionBtn.addEventListener('click', ()=>{
  clearScore();
  if(studentScoreContainer) studentScoreContainer.innerHTML = '<p>A pauta aparecera aqui.</p>';
  if(transcriptionStatus) transcriptionStatus.textContent = 'Transcricao limpa.';
});

// YIN pitch detection algorithm
function yinPitch(buffer, sampleRate){
  const threshold = 0.22;
  const maxTau = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / MIN_PITCH_HZ));
  const minTau = Math.max(2, Math.floor(sampleRate / MAX_PITCH_HZ));
  const yinBuffer = new Float32Array(maxTau + 1);
  let tau, i;
  for (tau = minTau; tau <= maxTau; tau++){
    let sum = 0;
    const limit = buffer.length - tau;
    for (i = 0; i < limit; i++){
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (tau = 1; tau <= maxTau; tau++){
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = runningSum ? yinBuffer[tau] * tau / runningSum : 1;
  }

  let tauEstimate = -1;
  for (tau = minTau; tau <= maxTau; tau++){
    if (yinBuffer[tau] < threshold){
      while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) return null;
  const betterTau = (tauEstimate > 0 && tauEstimate + 1 <= maxTau) ? (
    tauEstimate + (yinBuffer[tauEstimate - 1] - yinBuffer[tauEstimate + 1]) / (2 * (2 * yinBuffer[tauEstimate] - yinBuffer[tauEstimate - 1] - yinBuffer[tauEstimate + 1]))
  ) : tauEstimate;
  const frequency = sampleRate / betterTau;
  if (frequency > MAX_PITCH_HZ || frequency < MIN_PITCH_HZ) return null;
  return frequency;
}

// Recording
let mediaRecorder, recordedChunks=[];
recStart.addEventListener('click', ()=>{
  if(!mediaDest || !mediaDest.stream) { alert('Inicie captura primeiro'); return; }
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaDest.stream);
  mediaRecorder.ondataavailable = e => { if(e.data.size>0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = ()=>{
    const blob = new Blob(recordedChunks,{type:'audio/webm'});
    const url = URL.createObjectURL(blob);
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href = url; a.download='sax_recording.webm'; a.textContent = 'download';
    li.appendChild(a);
    dlList.appendChild(li);
    analyzeRecording(blob);
    // upload to server
    uploadBlob(blob, 'sax_recording.webm');
    // also build WAV from frames collected by AudioWorklet (if available)
    recordingFlag = false;
    if(recordedFrames && recordedFrames.length>0){
      // 24-bit PCM
      const wav24 = framesToWav(recordedFrames, audioCtx.sampleRate, 24);
      const url24 = URL.createObjectURL(wav24);
      const li24 = document.createElement('li');
      const a24 = document.createElement('a'); a24.href = url24; a24.download='sax_recording_24bit.wav'; a24.textContent = 'download WAV 24-bit';
      li24.appendChild(a24); dlList.appendChild(li24);
      // 32-bit float
      const wav32 = framesToWav(recordedFrames, audioCtx.sampleRate, 32);
      const url32 = URL.createObjectURL(wav32);
      const li32 = document.createElement('li');
      const a32 = document.createElement('a'); a32.href = url32; a32.download='sax_recording_32bit.wav'; a32.textContent = 'download WAV 32-bit float';
      li32.appendChild(a32); dlList.appendChild(li32);
      // clear frames after export
      recordedFrames = [];
    }
  };
  mediaRecorder.start(); recStart.disabled=true; recStop.disabled=false;
  // start high-quality frame collection
  recordedFrames = [];
  recordingFlag = true;
});
recStop.addEventListener('click', ()=>{ if(mediaRecorder && mediaRecorder.state==='recording') mediaRecorder.stop(); recStart.disabled=false; recStop.disabled=true; });

if (playScoreBtn) playScoreBtn.addEventListener('click', playScoreSequence);
if (clearScoreBtn) clearScoreBtn.addEventListener('click', clearScore);

function getCSRF(){
  const m = document.cookie.match(/csrftoken=([^;]+)/); return m ? m[1] : null;
}

function uploadBlob(blob, filename){
  const fd = new FormData(); fd.append('audio', blob, filename);
  fetch('/api/upload_audio/', {method:'POST', body:fd, headers: {'X-CSRFToken': getCSRF()}})
    .then(r=>r.json()).then(j=>{
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = j.path; a.textContent = 'uploaded: '+filename;
      li.appendChild(a); dlList.appendChild(li);
    }).catch(e=>{ console.error('upload failed', e); });
}

function framesToWav(frames, sampleRate, bitDepth=16){
  // frames: array of Float32Array mono frames
  const totalSamples = frames.reduce((sum,f)=>sum+f.length,0);
  const interleaved = new Float32Array(totalSamples);
  let offset = 0;
  for(const f of frames){ interleaved.set(f, offset); offset += f.length; }

  function writeString(view, offset, string){ for(let i=0;i<string.length;i++){ view.setUint8(offset+i, string.charCodeAt(i)); } }

  if(bitDepth === 32){
    // 32-bit float WAV
    const bytesPerSample = 4;
    const buffer = new ArrayBuffer(44 + interleaved.length * bytesPerSample);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 3, true); // format 3 = IEEE float
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, interleaved.length * bytesPerSample, true);
    let idx = 44;
    for(let i=0;i<interleaved.length;i++){
      view.setFloat32(idx, interleaved[i], true); idx += 4;
    }
    return new Blob([view], {type:'audio/wav'});
  }

  // default: PCM (16 or 24)
  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const buffer = new ArrayBuffer(44 + interleaved.length * bytesPerSample);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + interleaved.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, interleaved.length * bytesPerSample, true);
  let idx = 44;
  if(bitDepth === 24){
    for(let i=0;i<interleaved.length;i++){
      let s = Math.max(-1, Math.min(1, interleaved[i]));
      const intVal = Math.floor(s * 0x7FFFFF);
      view.setUint8(idx, intVal & 0xFF);
      view.setUint8(idx+1, (intVal>>8) & 0xFF);
      view.setUint8(idx+2, (intVal>>16) & 0xFF);
      idx += 3;
    }
  } else {
    for(let i=0;i<interleaved.length;i++){
      let s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      idx += 2;
    }
  }
  return new Blob([view], {type:'audio/wav'});
}

startBtn.addEventListener('click', ()=>start());
stopBtn.addEventListener('click', ()=>stop());
monitor.addEventListener('change', ()=>{
  if(gainNode){ if(monitor.checked) gainNode.connect(audioCtx.destination); else try{gainNode.disconnect(audioCtx.destination);}catch(e){}
  }
});
if (listenRef) {
  listenRef.addEventListener('click', ()=>{
    window.open('https://www.youtube.com/watch?v=ONOvKWES7f8&list=RDMM&start_radio=1&rv=tWAW7ZLkKh0', '_blank', 'noopener');
  });
}
updateDashboardSummary('', null, '');
generateReadingExercise();
if(profileInstrumentLabel) profileInstrumentLabel.textContent = getInstrumentLabel();
showAppStage('practice');
