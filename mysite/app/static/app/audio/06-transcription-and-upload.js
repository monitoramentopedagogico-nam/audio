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

function transcriptionSoundingRange(){
  const instrument = transcriptionInstrument ? transcriptionInstrument.value : (beginnerInstrument ? beginnerInstrument.value : 'alto');
  if(instrument === 'tenor') return {min:90, max:900};
  if(instrument === 'soprano') return {min:150, max:1400};
  return {min:120, max:1100};
}

function transcriptionWrittenNoteFromPitch(pitch){
  if(!pitch) return null;
  const range = transcriptionSoundingRange();
  if(pitch < range.min || pitch > range.max) return null;
  const soundingMidi = Math.round(69 + 12 * Math.log2(pitch / 440));
  const instrument = transcriptionInstrument ? transcriptionInstrument.value : 'alto';
  const transpose = instrument === 'alto' ? -9 : instrument === 'tenor' || instrument === 'soprano' ? -2 : 0;
  const writtenMidi = soundingMidi - transpose;
  return midiToNoteName(writtenMidi);
}

function normalizePitchOctaveNearTarget(pitch, targetFrequency){
  if(!pitch || !targetFrequency) return pitch;
  let normalized = pitch;
  while(normalized / targetFrequency > Math.SQRT2) normalized /= 2;
  while(targetFrequency / normalized > Math.SQRT2) normalized *= 2;
  return normalized;
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

async function playScoreSequence(){
  if (!scoreEvents.length) { alert('Nenhuma nota na partitura para executar.'); return; }
  const ctx = await ensureAudioContext();
  if(ctx.state === 'suspended') await ctx.resume();
  const startTime = ctx.currentTime + 0.08;
  const firstEventStart = Math.min(...scoreEvents.map(event=>Number(event.start) || 0));
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
  if(playTranscriptionBtn) playTranscriptionBtn.disabled = true;
  if(transcriptionStatus) transcriptionStatus.textContent = 'Reproduzindo a transcricao...';
  const scheduledNotes = scoreEvents.map((event, index) => {
    const nextTime = index < scoreEvents.length - 1 ? scoreEvents[index + 1].start : event.start + 700;
    const durationMs = event.duration > 0 ? event.duration : Math.max(120, nextTime - event.start);
    const quant = quantizeDuration(durationMs);
    const duration = Math.max(0.045, quant.ms / 1000 * 0.96);
    const writtenMidi = noteNameToMidiNumber(event.note);
    const instrument = transcriptionInstrument ? transcriptionInstrument.value : 'alto';
    const instrumentTranspose = instrument === 'alto' ? -9 : instrument === 'tenor' || instrument === 'soprano' ? -2 : 0;
    const frequency = writtenMidi === null ? null : midiToFrequency(writtenMidi + instrumentTranspose);
    const noteStart = startTime + Math.max(0, (event.start - firstEventStart) / 1000);
    return {frequency, noteStart, duration};
  });
  const finishTime = scheduledNotes.reduce((latest, note)=>Math.max(latest, note.noteStart + note.duration), startTime);
  let nextNoteIndex = 0;
  const scheduleAheadSeconds = 1.5;
  const scheduleWindow = ()=>{
    if(playbackId !== referencePlaybackId){
      if(playTranscriptionBtn) playTranscriptionBtn.disabled = false;
      return;
    }
    const horizon = ctx.currentTime + scheduleAheadSeconds;
    while(nextNoteIndex < scheduledNotes.length && scheduledNotes[nextNoteIndex].noteStart <= horizon){
      const note = scheduledNotes[nextNoteIndex];
      if(note.frequency) playReferenceTone(note.frequency, note.noteStart, note.duration, playbackBus, TRANSCRIPTION_PLAYBACK_GAIN);
      nextNoteIndex += 1;
    }
    if(ctx.currentTime >= finishTime){
      if(playTranscriptionBtn) playTranscriptionBtn.disabled = false;
      if(transcriptionStatus) transcriptionStatus.textContent = 'Reproducao concluida. Confira a pauta ou grave novamente.';
      return;
    }
    window.setTimeout(scheduleWindow, 35);
  };
  scheduleWindow();
}

function estimateTranscriptionKey(){
  if(!scoreEvents.length) return '';
  const majorIntervals = new Set([0,2,4,5,7,9,11]);
  let bestRoot = 0;
  let bestScore = -Infinity;
  for(let root = 0; root < 12; root += 1){
    let score = 0;
    scoreEvents.forEach((event, index)=>{
      const midi = noteNameToMidiNumber(event.originalNote || event.note);
      if(midi === null) return;
      const interval = ((midi - root) % 12 + 12) % 12;
      const weight = Math.max(1, Number(event.duration) || 250);
      score += majorIntervals.has(interval) ? weight : -weight * 1.4;
      if(interval === 0) score += weight * (index === 0 || index === scoreEvents.length - 1 ? 0.8 : 0.3);
      if(interval === 7) score += weight * 0.15;
    });
    if(score > bestScore){ bestScore = score; bestRoot = root; }
  }
  return ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'][bestRoot];
}

function effectiveTranscriptionKey(){
  return transcriptionKey && transcriptionKey.value !== 'auto'
    ? transcriptionKey.value
    : (detectedTranscriptionKey || estimateTranscriptionKey() || 'C');
}

function updateTranscriptionKeyDisplay(){
  detectedTranscriptionKey = estimateTranscriptionKey();
  const key = effectiveTranscriptionKey();
  respellCapturedScoreForKey(key);
  if(transcriptionDetectedKey){
    transcriptionDetectedKey.textContent = detectedTranscriptionKey
      ? `Tom tocado: ${noteToSolfege(`${detectedTranscriptionKey}4`)} maior (${detectedTranscriptionKey})${transcriptionKey && transcriptionKey.value !== 'auto' ? ' · ajustado manualmente' : ''}`
      : 'Tom tocado: aguardando notas';
  }
  if(playTranscriptionKeyBtn) playTranscriptionKeyBtn.disabled = !scoreEvents.length;
  return key;
}

function transcriptionKeyPrefersFlats(key = effectiveTranscriptionKey()){
  return readingKeyFifthsForRoot(`${key}4`) < 0;
}

function respellCapturedScoreForKey(key = effectiveTranscriptionKey()){
  const preferFlats = transcriptionKeyPrefersFlats(key);
  scoreEvents.forEach(event=>{
    event.note = transposeReadingNote(event.note, 0, preferFlats);
    if(event.originalNote) event.originalNote = transposeReadingNote(event.originalNote, 0, preferFlats);
  });
}

function transposeCapturedScoreToSelectedKey(){
  if(!scoreEvents.length) return;
  const sourceKey = estimateTranscriptionKey() || 'C';
  const targetKey = transcriptionKey && transcriptionKey.value !== 'auto' ? transcriptionKey.value : sourceKey;
  const sourceMidi = noteNameToMidiNumber(`${sourceKey}4`);
  const targetMidi = noteNameToMidiNumber(`${targetKey}4`);
  if(sourceMidi === null || targetMidi === null) return;
  let semitones = targetMidi - sourceMidi;
  while(semitones > 6) semitones -= 12;
  while(semitones < -6) semitones += 12;
  const preferFlats = readingKeyFifthsForRoot(`${targetKey}4`) < 0;
  scoreEvents.forEach(event=>{
    if(!event.originalNote) event.originalNote = event.note;
    event.note = transposeReadingNote(event.originalNote, semitones, preferFlats);
  });
  updateNoteDisplay();
  if(transcriptionStatus){
    transcriptionStatus.textContent = semitones
      ? `Transposto de ${noteToSolfege(`${sourceKey}4`)} maior para ${noteToSolfege(`${targetKey}4`)} maior (${semitones > 0 ? '+' : ''}${semitones} semitons).`
      : `Tom original mantido em ${noteToSolfege(`${sourceKey}4`)} maior.`;
  }
}

function buildMusicXML(events){
  // events: [{note, start, duration}]
  const divisions = 480; // quarter = 480
  const quarterLen = divisions;
  const scoreKey = effectiveTranscriptionKey();
  const scoreKeyFifths = readingKeyFifthsForRoot(`${scoreKey}4`);
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
  const timelineOffset = events.length ? Number(events[0].start) || 0 : 0;

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
  function typeFromDivisions(value){ return typeFromFactor(value / divisions); }

  const meterMatch = String(transcriptionMeter ? transcriptionMeter.value : '4/4').match(/^(\d+)\/(\d+)$/);
  const meterBeats = meterMatch ? Number(meterMatch[1]) : 4;
  const meterBeatType = meterMatch ? Number(meterMatch[2]) : 4;
  const measureDivs = Math.round(quarterLen * meterBeats * 4 / meterBeatType);
  let measureIndex = 1;
  let measurePos = 0; // in divisions

  function openMeasure(){
    out += `<measure number="${measureIndex}">\n`;
    if(measureIndex===1){
      out += `<attributes>\n<divisions>${divisions}</divisions>\n<key><fifths>${scoreKeyFifths}</fifths></key>\n<time><beats>${meterBeats}</beats><beat-type>${meterBeatType}</beat-type></time>\n<clef><sign>G</sign><line>2</line></clef>\n</attributes>\n`;
    }
  }

  openMeasure();

  // previous end time for rests
  let prevEnd = 0;

  for(let i=0;i<events.length;i++){
    const ev = events[i];
    const startMs = Math.max(0, Math.round(ev.start - timelineOffset));
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

    const p = noteToPitch(ev.note);
    let remainingNoteDivs = durDivs;
    let continuation = false;
    while(remainingNoteDivs > 0){
      if(measurePos >= measureDivs){
        out += `</measure>\n`;
        measureIndex++; measurePos=0; openMeasure();
      }
      const segmentDivs = Math.min(remainingNoteDivs, measureDivs - measurePos);
      const continuesNext = remainingNoteDivs > segmentDivs;
      if(p){
        out += `<note>\n<pitch>\n<step>${p.step}</step>\n` + (p.alter? `<alter>${p.alter}</alter>\n` : '') + `<octave>${p.octave}</octave>\n</pitch>\n`;
      } else {
        out += `<note>\n`;
      }
      out += `<duration>${segmentDivs}</duration>\n`;
      out += `<type>${typeFromDivisions(segmentDivs)}</type>\n`;
      if(continuation) out += `<tie type="stop"/>\n`;
      if(continuesNext) out += `<tie type="start"/>\n`;
      if(continuation || continuesNext){
        out += `<notations>`;
        if(continuation) out += `<tied type="stop"/>`;
        if(continuesNext) out += `<tied type="start"/>`;
        out += `</notations>\n`;
      }
      out += `</note>\n`;
      measurePos += segmentDivs;
      remainingNoteDivs -= segmentDivs;
      continuation = true;
    }
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
  if (saveTranscriptionBtn) saveTranscriptionBtn.disabled = scoreEvents.length === 0;
  if (saveTranscriptionPdfBtn) saveTranscriptionPdfBtn.disabled = scoreEvents.length === 0;
  updateTranscriptionKeyDisplay();
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
  detectedTranscriptionKey = '';
  updateNoteDisplay();
}

async function playDetectedTranscriptionKey(){
  if(!scoreEvents.length) return;
  const key = updateTranscriptionKeyDisplay();
  const rootMidi = noteNameToMidiNumber(`${key}4`);
  if(rootMidi === null) return;
  const intervals = [0,2,4,5,7,9,11,12,11,9,7,5,4,2,0];
  const instrument = transcriptionInstrument ? transcriptionInstrument.value : 'alto';
  const transpose = instrument === 'alto' ? -9 : instrument === 'tenor' || instrument === 'soprano' ? -2 : 0;
  const ctx = await ensureAudioContext();
  if(ctx.state === 'suspended') await ctx.resume();
  const stepSeconds = 60 / clampBpm(transcriptionBpm ? transcriptionBpm.value : 60) * 0.5;
  const bus = ctx.createGain();
  bus.gain.value = 0.8;
  bus.connect(ctx.destination);
  bus.connect(getReferenceReverbBus(ctx).input);
  intervals.forEach((interval, index)=>{
    playReferenceTone(midiToFrequency(rootMidi + interval + transpose), ctx.currentTime + 0.08 + index * stepSeconds, Math.max(0.12, stepSeconds * 0.88), bus);
  });
  if(transcriptionStatus) transcriptionStatus.textContent = `Ouvindo ${noteToSolfege(`${key}4`)} maior no ${transcriptionInstrument ? transcriptionInstrument.options[transcriptionInstrument.selectedIndex].textContent : 'sax'}.`;
  window.setTimeout(()=>{ try{ bus.disconnect(); }catch(error){} }, (intervals.length * stepSeconds + 1) * 1000);
}

function capturedScoreDataForStorage(title){
  const notes = scoreEvents.map(event=>event.note);
  const beats = scoreEvents.map(event=>quantizeDuration(Math.max(80, Number(event.duration) || 0)).factor);
  const meter = transcriptionMeter ? transcriptionMeter.value : '4/4';
  const capacity = readingMeasureCapacity(meter);
  const measureStarts = [];
  let elapsed = 0;
  beats.forEach((beat, index)=>{
    if(index > 0 && elapsed >= capacity - 0.001){
      measureStarts.push(index);
      elapsed = 0;
    }
    elapsed += beat;
  });
  const key = effectiveTranscriptionKey();
  return {
    title,
    key:`${key}4`,
    keyFifths:readingKeyFifthsForRoot(`${key}4`),
    meter,
    bpm:clampBpm(transcriptionBpm ? transcriptionBpm.value : 60),
    notes,
    beats,
    measureStarts,
    sourceMeasureNoteStarts:[0, ...measureStarts],
    sourceMusicXml:buildMusicXML(scoreEvents),
    instrument:transcriptionInstrument ? transcriptionInstrument.value : 'alto',
    capturedEvents:scoreEvents.map(event=>({note:event.note, start:event.start, duration:event.duration})),
    degrees:notes.map((_, index)=>String(index + 1)),
    functions:notes.map(()=> 'nota captada do estudante'),
    pitchTheory:'Melodia captada pelo microfone.',
    rhythmTheory:'Duracoes quantizadas conforme o BPM da captacao.',
    functionTheory:`Tom identificado: ${noteToSolfege(`${key}4`)} maior.`,
  };
}

async function saveCapturedTranscription(){
  if(!scoreEvents.length) return;
  if(transcriptionActive) stop();
  const title = (transcriptionTitle ? transcriptionTitle.value : '').trim() || `Melodia ${new Date().toLocaleDateString('pt-BR')}`;
  if(saveTranscriptionBtn) saveTranscriptionBtn.disabled = true;
  if(transcriptionStatus) transcriptionStatus.textContent = 'Salvando partitura captada...';
  try{
    const response = await fetch('/api/saved_scores/', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'X-CSRFToken':getCSRF() || ''},
      body:JSON.stringify({title, score_data:capturedScoreDataForStorage(title)}),
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.message || 'Nao foi possivel salvar.');
    if(transcriptionTitle) transcriptionTitle.value = title;
    if(transcriptionStatus) transcriptionStatus.textContent = `Partitura "${title}" salva em Minhas partituras.`;
    await loadSavedScores();
  }catch(error){
    if(transcriptionStatus) transcriptionStatus.textContent = error.message || 'Falha ao salvar a partitura.';
  }finally{
    if(saveTranscriptionBtn) saveTranscriptionBtn.disabled = !scoreEvents.length;
  }
}

function saveCapturedTranscriptionPdf(){
  if(!scoreEvents.length || !studentScoreContainer) return;
  const svg = studentScoreContainer.querySelector('svg');
  if(!svg){
    if(transcriptionStatus) transcriptionStatus.textContent = 'Aguarde a pauta terminar de desenhar antes de salvar o PDF.';
    return;
  }
  const rawTitle = transcriptionTitle && transcriptionTitle.value.trim() ? transcriptionTitle.value.trim() : 'Minha partitura';
  const title = escapeMusicXmlText(rawTitle);
  const key = effectiveTranscriptionKey();
  const meter = transcriptionMeter ? transcriptionMeter.value : '4/4';
  const bpm = clampBpm(transcriptionBpm ? transcriptionBpm.value || 60 : 60);
  const instrument = transcriptionInstrument && transcriptionInstrument.selectedIndex >= 0
    ? transcriptionInstrument.options[transcriptionInstrument.selectedIndex].textContent
    : 'Sax';
  const printWindow = window.open('', '_blank');
  if(!printWindow){
    if(transcriptionStatus) transcriptionStatus.textContent = 'Permita pop-ups deste site para abrir a tela de salvar PDF.';
    return;
  }
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title><style>
    @page{size:A4 landscape;margin:12mm}
    *{box-sizing:border-box}body{margin:0;color:#111;font-family:Arial,sans-serif;background:#fff}
    header{margin:0 0 10mm;border-bottom:1px solid #bbb;padding-bottom:4mm}
    h1{font-size:20pt;margin:0 0 3mm}.meta{font-size:10pt;color:#444;display:flex;gap:8mm;flex-wrap:wrap}
    .score{width:100%;overflow:visible}.score svg{display:block;width:100%!important;height:auto!important;max-width:none!important}
  </style></head><body><header><h1>${title}</h1><div class="meta"><span>Tom: ${escapeMusicXmlText(noteToSolfege(`${key}4`))} maior (${escapeMusicXmlText(key)})</span><span>Compasso: ${escapeMusicXmlText(meter)}</span><span>BPM: ${bpm}</span><span>Instrumento: ${escapeMusicXmlText(instrument)}</span></div></header><main class="score">${svg.outerHTML}</main></body></html>`);
  printWindow.document.close();
  printWindow.addEventListener('load', ()=>{
    window.setTimeout(()=>{
      printWindow.focus();
      printWindow.print();
    }, 180);
  }, {once:true});
  if(transcriptionStatus) transcriptionStatus.textContent = 'PDF preparado. Escolha "Salvar como PDF" na janela de impressão.';
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
  transcriptionActive = true;
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
if(playTranscriptionKeyBtn) playTranscriptionKeyBtn.addEventListener('click', playDetectedTranscriptionKey);
if(transcriptionSemitoneDown) transcriptionSemitoneDown.addEventListener('click', ()=>transposeSelectedTranscriptionNote(-1));
if(transcriptionNaturalNote) transcriptionNaturalNote.addEventListener('click', naturalizeSelectedTranscriptionNote);
if(transcriptionSemitoneUp) transcriptionSemitoneUp.addEventListener('click', ()=>transposeSelectedTranscriptionNote(1));
if(transcriptionOctaveDown) transcriptionOctaveDown.addEventListener('click', ()=>transposeSelectedTranscriptionNote(-12));
if(transcriptionOctaveUp) transcriptionOctaveUp.addEventListener('click', ()=>transposeSelectedTranscriptionNote(12));
if(transcriptionDeleteNote) transcriptionDeleteNote.addEventListener('click', deleteSelectedTranscriptionNote);
transcriptionDurationTools.forEach(button=>{
  button.addEventListener('click', ()=>setSelectedTranscriptionDuration(Number(button.dataset.durationFactor)));
});
if(saveTranscriptionBtn) saveTranscriptionBtn.addEventListener('click', saveCapturedTranscription);
if(saveTranscriptionPdfBtn) saveTranscriptionPdfBtn.addEventListener('click', saveCapturedTranscriptionPdf);
if(transcriptionKey) transcriptionKey.addEventListener('change', ()=>{
  transposeCapturedScoreToSelectedKey();
  updateTranscriptionKeyDisplay();
  if(scoreEvents.length) renderStudentTranscription();
});
if(clearTranscriptionBtn) clearTranscriptionBtn.addEventListener('click', ()=>{
  clearScore();
  selectedTranscriptionNoteIndex = -1;
  renderTranscriptionEditor();
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
