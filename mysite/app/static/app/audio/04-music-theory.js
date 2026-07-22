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
