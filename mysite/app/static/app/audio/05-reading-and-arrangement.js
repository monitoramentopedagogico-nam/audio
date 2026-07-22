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
  if(window.SaxTiming){
    return window.SaxTiming.readingPageRanges(total, exercise && exercise.measureStarts, READING_SCORE_PAGE_SIZE);
  }
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
  const sourcePitchedNoteCount = Array.from(documentNode.querySelectorAll('part:first-of-type note'))
    .filter(note=>note.querySelector('pitch') && !note.querySelector('chord')).length;
  const recognizedNoteCount = exercise.notes ? exercise.notes.length : 0;
  // The study cursor indexes the recognized melodic line. If OMR retained extra
  // voices, ornaments or tied segments, use the normalized score so one cursor
  // step always corresponds to one recognized note. The original remains in
  // the dedicated original-score view.
  if(sourcePitchedNoteCount !== recognizedNoteCount) return '';
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
  const cursor = readingOsmd.cursor;
  cursor.reset();
  cursor.show();
  let cursorSteps = Math.max(0, localIndex);
  if(currentReadingExercise && typeof DOMParser !== 'undefined'){
    try{
      const documentNode = new DOMParser().parseFromString(readingPageMusicXml(currentReadingExercise), 'application/xml');
      const xmlNotes = Array.from(documentNode.querySelectorAll('part > measure > note'));
      let pitchedIndex = -1;
      const targetXmlIndex = xmlNotes.findIndex(noteElement=>{
        if(!noteElement.querySelector('pitch') || noteElement.querySelector('chord')) return false;
        pitchedIndex += 1;
        return pitchedIndex === localIndex;
      });
      if(targetXmlIndex >= 0) cursorSteps = targetXmlIndex;
    }catch(error){
      console.warn('Falha ao mapear cursor pelo MusicXML; usando indice de nota.', error);
    }
  }
  for(let index = 0; index < cursorSteps; index += 1) cursor.next();
  cursor.show();
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
    if(index >= 0 && previousIndex >= 0 && previousIndex !== index){
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
    } else if(previousIndex >= 0 && readingOsmd && readingOsmdRenderPromise){
      // The scheduler signals completion with -1. Keep the cursor on the last
      // performed note and correct any delayed page-render positioning.
      const pageRanges = readingScorePageRanges(currentReadingExercise);
      const finalPage = pageRanges.findIndex(range=>previousIndex >= range.start && previousIndex < range.end);
      if(finalPage === readingScorePage){
        const finalLocalIndex = previousIndex - pageRanges[finalPage].start;
        readingOsmdRenderPromise.then(()=>{
          if(readingScorePage === finalPage) positionReadingOsmdCursor(finalLocalIndex);
        });
      }
    }
    if(index >= 0) previousIndex = index;
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
