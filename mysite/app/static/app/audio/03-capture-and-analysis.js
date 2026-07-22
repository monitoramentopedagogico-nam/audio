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
  transcriptionCandidateNote = null;
  transcriptionCandidateFrames = 0;
  transcriptionPeakRms = 0;
  transcriptionAttackArmed = false;
  selectedTranscriptionNoteIndex = -1;
  lastMicrophoneFrameAt = 0;
  if(microphoneWatchdogTimer) clearTimeout(microphoneWatchdogTimer);
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
    // A tiny inaudible value prevents some mobile browsers from optimizing
    // the complete analysis graph away when the destination gain is exactly zero.
    silentGain.gain.value = 0.00001;
    if(!audioCtx.audioWorklet || !audioCtx.audioWorklet.addModule){
      startScriptProcessorFallback(hp);
    } else {
    audioCtx.audioWorklet.addModule(window.SAX_AUDIO_WORKLET_URL || '/static/app/audio-worklet-processor.js').then(()=>{
      workletNode = new AudioWorkletNode(audioCtx, 'frame-processor', {processorOptions:{frameSize:2048}});
      // hp -> worklet -> silentGain -> destination (so worklet receives audio)
      hp.connect(workletNode);
      workletNode.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      // receive frames from worklet
      workletNode.port.onmessage = evt => {
        lastMicrophoneFrameAt = performance.now();
        const floatBuf = evt.data; // Float32Array
        // compute RMS and pitch
        const buf = floatBuf;
        let sum=0; for(let i=0;i<buf.length;i++){ sum += buf[i]*buf[i]; }
        const rms = Math.sqrt(sum/buf.length);
        captureCalibrationSample(rms);
        updateMicrophoneDiagnostic(rms);
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
        const rmsRise = currentRms - prevRms;
        const attack = prevRms > 0.0002 && rmsRise >= Math.max(0.002, prevRms * 0.55);
        prevRms = currentRms;
        if(attackValEl) attackValEl.textContent = attack ? 'sim' : '—';
        // update RMS meter
        if(rmsFillEl) rmsFillEl.style.width = Math.min(100, Math.round(Math.min(1, rms*12)*100)) + '%';
        // draw spectrogram column
        if(specCtx && specCanvas){
          const w = specCanvas.width = specCanvas.clientWidth;
          const h = specCanvas.height = specCanvas.clientHeight;
          if(w > 1 && h > 1){
            // shift canvas left only while the advanced spectrogram is visible.
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
        }

        updatePitchEstimate(buf, rms, audioCtx.sampleRate);
        if(!currentEstimatedPitch && hasPitchDetectionSignal(rms)){
          const spectrumPitch = estimatePitchFromSpectrum(freqData);
          if(spectrumPitch) currentEstimatedPitch = spectrumPitch;
        }

        if(transcriptionActive) captureTranscriptionNote(transcriptionWrittenNoteFromPitch(currentEstimatedPitch), rms, attack);

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
      if(!processor) startScriptProcessorFallback(hp);
    });
    const watchMicrophoneFrames = ()=>{
      if(!audioCtx) return;
      const frameAge = lastMicrophoneFrameAt ? performance.now() - lastMicrophoneFrameAt : Infinity;
      if(frameAge > 1800 && !processor){
        console.warn('AudioWorklet sem quadros recentes; alternando para ScriptProcessor.');
        if(workletNode){
          try{ hp.disconnect(workletNode); }catch(error){}
          try{ workletNode.disconnect(); }catch(error){}
          workletNode = null;
        }
        startScriptProcessorFallback(hp);
        if(transcriptionStatus) transcriptionStatus.textContent = 'Modo compativel do microfone ativado. Toque novamente.';
        setBeginnerStatus('ready', 'Ouvindo', 'Modo compativel ativado. Toque a nota destacada novamente.');
        return;
      }
      microphoneWatchdogTimer = setTimeout(watchMicrophoneFrames, 1500);
    };
    microphoneWatchdogTimer = setTimeout(watchMicrophoneFrames, 1500);
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
    transcriptionActive = false;
  });
}

function captureTranscriptionNote(note, rms, attack = false){
  const currentTime = performance.now() - captureStartTime;
  const transcriptionThreshold = transcriptionSignalThreshold();
  if(note && rms >= transcriptionThreshold){
    if(transcriptionPeakRms <= 0) transcriptionPeakRms = rms;
    if(rms <= transcriptionPeakRms * 0.68) transcriptionAttackArmed = true;
    transcriptionPeakRms = Math.max(rms, transcriptionPeakRms * 0.992);
    const confirmedAttack = attack && transcriptionAttackArmed;
    // A new tongue attack can repeat the same pitch without an audible silence.
    // Split it only after a minimum duration so normal amplitude fluctuations do
    // not create duplicate notes.
    if(note === lastDetectedNote && confirmedAttack && currentScoreEvent && currentTime - currentScoreEvent.start >= 120){
      currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
      currentScoreEvent = {note, originalNote:note, start:currentTime, duration:0};
      scoreEvents.push(currentScoreEvent);
      transcriptionPeakRms = rms;
      transcriptionAttackArmed = false;
      noteHistory.push(note);
      if(noteHistory.length > 16) noteHistory.shift();
      updateNoteDisplay();
      if(transcriptionStatus) transcriptionStatus.textContent = `Captando: ${noteToWrittenSolfege(note)} (${note}) · ${scoreEvents.length} nota${scoreEvents.length === 1 ? '' : 's'}`;
      transcriptionCandidateNote = null;
      transcriptionCandidateFrames = 0;
      return;
    }
    if(note !== lastDetectedNote){
      if(note !== transcriptionCandidateNote){
        transcriptionCandidateNote = note;
        transcriptionCandidateFrames = 1;
        return;
      }
      transcriptionCandidateFrames += 1;
      if(transcriptionCandidateFrames < 3) return;
      if(currentScoreEvent) currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
      currentScoreEvent = {note, originalNote:note, start:currentTime, duration:0};
      scoreEvents.push(currentScoreEvent);
      transcriptionPeakRms = rms;
      transcriptionAttackArmed = false;
      lastDetectedNote = note;
      noteHistory.push(note);
      if(noteHistory.length > 16) noteHistory.shift();
      updateNoteDisplay();
      if(transcriptionStatus) transcriptionStatus.textContent = `Captando: ${noteToWrittenSolfege(note)} (${note}) · ${scoreEvents.length} nota${scoreEvents.length === 1 ? '' : 's'}`;
    }
    transcriptionCandidateNote = null;
    transcriptionCandidateFrames = 0;
  } else {
    transcriptionCandidateNote = null;
    transcriptionCandidateFrames = 0;
    transcriptionPeakRms = 0;
    transcriptionAttackArmed = false;
    if(lastDetectedNote && currentScoreEvent){
      currentScoreEvent.duration = Math.max(80, currentTime - currentScoreEvent.start);
      currentScoreEvent = null;
      lastDetectedNote = null;
    }
  }
}

function startScriptProcessorFallback(inputNode){
  if(!audioCtx || !inputNode) return;
  setBeginnerStatus('ready', 'Ouvindo', 'Microfone ativo. Toque a nota alvo com som claro.');
  processor = audioCtx.createScriptProcessor(2048, 1, 1);
  inputNode.connect(processor);
  if(!silentGain){
    silentGain = audioCtx.createGain();
    silentGain.gain.value = 0.00001;
  }
  processor.connect(silentGain);
  silentGain.connect(audioCtx.destination);
  processor.onaudioprocess = event => {
    lastMicrophoneFrameAt = performance.now();
    const buf = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for(let i=0;i<buf.length;i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const rmsRise = rms - prevRms;
    const attack = prevRms > 0.0002 && rmsRise >= Math.max(0.002, prevRms * 0.55);
    prevRms = rms;
    captureCalibrationSample(rms);
    updateMicrophoneDiagnostic(rms);
    updatePitchEstimate(buf, rms, audioCtx.sampleRate);
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);
    if(!currentEstimatedPitch && hasPitchDetectionSignal(rms)){
      const spectrumPitch = estimatePitchFromSpectrum(freqData);
      if(spectrumPitch) currentEstimatedPitch = spectrumPitch;
    }
    if(transcriptionActive) captureTranscriptionNote(transcriptionWrittenNoteFromPitch(currentEstimatedPitch), rms, attack);
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
  removeUnstableFinalCapture();
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
  if(microphoneWatchdogTimer){ clearTimeout(microphoneWatchdogTimer); microphoneWatchdogTimer = null; }
  updateNoteDisplay();
  renderStudentTranscription();
  transcriptionActive = false;
}

function removeUnstableFinalCapture(){
  if(scoreEvents.length < 2) return;
  const last = scoreEvents[scoreEvents.length - 1];
  const previous = scoreEvents[scoreEvents.length - 2];
  const lastDuration = Math.max(0, Number(last.duration) || 0);
  const lastMidi = noteNameToMidiNumber(last.note);
  const previousMidi = noteNameToMidiNumber(previous.note);
  const largeReleaseJump = lastMidi !== null && previousMidi !== null && Math.abs(lastMidi - previousMidi) >= 5;
  if(lastDuration < 180 && largeReleaseJump){
    scoreEvents.pop();
    lastDetectedNote = previous.note;
  }
}

async function renderStudentTranscription(){
  renderTranscriptionEditor();
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
    bindTranscriptionScoreNotes();
  }catch(error){
    console.error('Nao foi possivel desenhar a transcricao completa.', error);
    renderScore();
  }
}

function bindTranscriptionScoreNotes(){
  if(!studentTranscriptionOsmd || !studentScoreContainer || !scoreEvents.length) return;
  try{
    const measureList = studentTranscriptionOsmd.GraphicSheet && studentTranscriptionOsmd.GraphicSheet.MeasureList;
    if(!Array.isArray(measureList)) return;
    const graphicalNotes = [];
    measureList.forEach(measureRow=>{
      (Array.isArray(measureRow) ? measureRow : []).forEach(measure=>{
        const staffEntries = measure && (measure.staffEntries || measure.StaffEntries) || [];
        staffEntries.forEach(staffEntry=>{
          const voiceEntries = staffEntry && (staffEntry.graphicalVoiceEntries || staffEntry.GraphicalVoiceEntries) || [];
          voiceEntries.forEach(voiceEntry=>{
            const notes = voiceEntry && (voiceEntry.notes || voiceEntry.Notes) || [];
            notes.forEach(note=>{
              const sourceNote = note && (note.sourceNote || note.SourceNote);
              if(!sourceNote || (typeof sourceNote.isRest === 'function' && sourceNote.isRest())) return;
              graphicalNotes.push(note);
            });
          });
        });
      });
    });

    let eventIndex = -1;
    graphicalNotes.forEach(graphicalNote=>{
      const sourceNote = graphicalNote.sourceNote || graphicalNote.SourceNote;
      const tie = sourceNote && (sourceNote.NoteTie || sourceNote.noteTie);
      const tieStart = tie && (tie.StartNote || tie.startNote);
      const isTieContinuation = Boolean(tieStart && tieStart !== sourceNote && eventIndex >= 0);
      if(!isTieContinuation) eventIndex += 1;
      if(eventIndex >= scoreEvents.length) return;
      const svgGroup = typeof graphicalNote.getSVGGElement === 'function' ? graphicalNote.getSVGGElement() : null;
      if(!svgGroup) return;
      const noteHead = typeof graphicalNote.getVFNoteSVG === 'function' ? graphicalNote.getVFNoteSVG() : null;
      const editTarget = noteHead || svgGroup;
      const linkedEventIndex = eventIndex;
      editTarget.classList.add('transcription-score-note-editable');
      svgGroup.dataset.transcriptionEventIndex = String(linkedEventIndex);
      svgGroup.setAttribute('role', 'button');
      svgGroup.setAttribute('tabindex', '0');
      svgGroup.setAttribute('aria-label', `Editar nota ${linkedEventIndex + 1}: ${scoreEvents[linkedEventIndex].note}`);
      const selectNote = ()=>selectTranscriptionNote(linkedEventIndex);
      editTarget.addEventListener('click', selectNote);
      let dragStartY = null;
      let dragSemitones = 0;
      editTarget.addEventListener('pointerdown', event=>{
        if(event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        selectNote();
        dragStartY = event.clientY;
        dragSemitones = 0;
        svgGroup.classList.add('transcription-score-note-dragging');
        if(typeof editTarget.setPointerCapture === 'function') editTarget.setPointerCapture(event.pointerId);
      });
      editTarget.addEventListener('pointermove', event=>{
        if(dragStartY === null) return;
        dragSemitones = Math.max(-24, Math.min(24, Math.round((dragStartY - event.clientY) / 8)));
        if(transcriptionEditSelection){
          const direction = dragSemitones > 0 ? `+${dragSemitones}` : String(dragSemitones);
          transcriptionEditSelection.textContent = dragSemitones
            ? `Mover nota ${linkedEventIndex + 1}: ${direction} semitom${Math.abs(dragSemitones) === 1 ? '' : 's'}`
            : `Nota ${linkedEventIndex + 1} selecionada`;
        }
      });
      const finishDrag = event=>{
        if(dragStartY === null) return;
        const semitones = dragSemitones;
        dragStartY = null;
        dragSemitones = 0;
        svgGroup.classList.remove('transcription-score-note-dragging');
        if(typeof editTarget.releasePointerCapture === 'function' && editTarget.hasPointerCapture && editTarget.hasPointerCapture(event.pointerId)){
          editTarget.releasePointerCapture(event.pointerId);
        }
        selectTranscriptionNote(linkedEventIndex);
        if(semitones) transposeSelectedTranscriptionNote(semitones);
      };
      editTarget.addEventListener('pointerup', finishDrag);
      editTarget.addEventListener('pointercancel', finishDrag);
      svgGroup.addEventListener('keydown', event=>{
        if(event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          selectNote();
        } else if(event.key === 'ArrowUp' || event.key === 'ArrowDown'){
          event.preventDefault();
          selectNote();
          transposeSelectedTranscriptionNote(event.key === 'ArrowUp' ? 1 : -1);
        }
      });
    });
    highlightSelectedTranscriptionScoreNote();
  }catch(error){
    console.warn('Nao foi possivel ativar a edicao direta na pauta.', error);
  }
}

function selectTranscriptionNote(index){
  if(index < 0 || index >= scoreEvents.length) return;
  selectedTranscriptionNoteIndex = index;
  renderTranscriptionEditor();
  highlightSelectedTranscriptionScoreNote();
}

function highlightSelectedTranscriptionScoreNote(){
  if(!studentScoreContainer) return;
  studentScoreContainer.querySelectorAll('.transcription-score-note-selected').forEach(element=>{
    element.classList.remove('transcription-score-note-selected');
  });
  if(selectedTranscriptionNoteIndex < 0) return;
  studentScoreContainer.querySelectorAll(`[data-transcription-event-index="${selectedTranscriptionNoteIndex}"]`).forEach(element=>{
    element.classList.add('transcription-score-note-selected');
  });
}

function renderTranscriptionEditor(){
  if(!transcriptionEditor || !transcriptionNoteList) return;
  transcriptionEditor.hidden = !scoreEvents.length;
  if(!scoreEvents.length){
    selectedTranscriptionNoteIndex = -1;
    transcriptionNoteList.innerHTML = '';
    updateTranscriptionEditButtons();
    return;
  }
  if(selectedTranscriptionNoteIndex >= scoreEvents.length) selectedTranscriptionNoteIndex = -1;
  transcriptionNoteList.innerHTML = '';
  scoreEvents.forEach((event, index)=>{
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `transcription-note-chip${index === selectedTranscriptionNoteIndex ? ' active' : ''}`;
    button.textContent = `${index + 1}: ${noteToWrittenSolfege(event.note)} (${event.note})`;
    button.setAttribute('aria-pressed', index === selectedTranscriptionNoteIndex ? 'true' : 'false');
    button.addEventListener('click', ()=>selectTranscriptionNote(index));
    transcriptionNoteList.appendChild(button);
  });
  updateTranscriptionEditButtons();
}

function updateTranscriptionEditButtons(){
  const selected = selectedTranscriptionNoteIndex >= 0 && selectedTranscriptionNoteIndex < scoreEvents.length;
  [transcriptionSemitoneDown, transcriptionNaturalNote, transcriptionSemitoneUp, transcriptionOctaveDown, transcriptionOctaveUp, transcriptionDeleteNote, ...transcriptionDurationTools].forEach(button=>{
    if(button) button.disabled = !selected;
  });
  const selectedFactor = selected
    ? quantizeDuration(Math.max(80, Number(scoreEvents[selectedTranscriptionNoteIndex].duration) || 0)).factor
    : null;
  transcriptionDurationTools.forEach(button=>{
    button.classList.toggle('active', selected && Number(button.dataset.durationFactor) === selectedFactor);
  });
  if(transcriptionEditSelection){
    transcriptionEditSelection.textContent = selected
      ? `Nota ${selectedTranscriptionNoteIndex + 1} selecionada: ${noteToWrittenSolfege(scoreEvents[selectedTranscriptionNoteIndex].note)} (${scoreEvents[selectedTranscriptionNoteIndex].note})`
      : 'Toque em uma nota abaixo da pauta para corrigir';
  }
}

async function transposeSelectedTranscriptionNote(semitones){
  if(selectedTranscriptionNoteIndex < 0 || selectedTranscriptionNoteIndex >= scoreEvents.length) return;
  const event = scoreEvents[selectedTranscriptionNoteIndex];
  const midi = noteNameToMidiNumber(event.note);
  if(midi === null) return;
  const targetMidi = Math.max(0, Math.min(127, midi + semitones));
  event.note = transposeReadingNote(midiToNoteName(targetMidi), 0, transcriptionKeyPrefersFlats());
  event.originalNote = event.note;
  updateNoteDisplay();
  updateTranscriptionKeyDisplay();
  await renderStudentTranscription();
}

async function naturalizeSelectedTranscriptionNote(){
  if(selectedTranscriptionNoteIndex < 0 || selectedTranscriptionNoteIndex >= scoreEvents.length) return;
  const event = scoreEvents[selectedTranscriptionNoteIndex];
  const midi = noteNameToMidiNumber(event.note);
  if(midi === null) return;
  const sharpPitchClasses = new Set([1, 3, 6, 8, 10]);
  const naturalMidi = sharpPitchClasses.has(((midi % 12) + 12) % 12) ? midi - 1 : midi;
  event.note = midiToNoteName(naturalMidi);
  event.originalNote = event.note;
  updateNoteDisplay();
  updateTranscriptionKeyDisplay();
  await renderStudentTranscription();
}

async function setSelectedTranscriptionDuration(factor){
  if(selectedTranscriptionNoteIndex < 0 || selectedTranscriptionNoteIndex >= scoreEvents.length) return;
  const bpm = clampBpm(transcriptionBpm ? transcriptionBpm.value || 60 : 60);
  scoreEvents[selectedTranscriptionNoteIndex].duration = (60000 / bpm) * factor;
  updateNoteDisplay();
  await renderStudentTranscription();
}

async function deleteSelectedTranscriptionNote(){
  if(selectedTranscriptionNoteIndex < 0 || selectedTranscriptionNoteIndex >= scoreEvents.length) return;
  scoreEvents.splice(selectedTranscriptionNoteIndex, 1);
  if(selectedTranscriptionNoteIndex >= scoreEvents.length) selectedTranscriptionNoteIndex = scoreEvents.length - 1;
  updateNoteDisplay();
  updateTranscriptionKeyDisplay();
  if(!scoreEvents.length && studentScoreContainer) studentScoreContainer.innerHTML = '<p>A pauta aparecerá aqui.</p>';
  await renderStudentTranscription();
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
  const range = transcriptionActive ? transcriptionSoundingRange() : {min:80, max:900};
  const minBin = Math.floor(range.min * analyser.fftSize / audioCtx.sampleRate);
  const maxBin = Math.min(data.length - 1, Math.floor(range.max * analyser.fftSize / audioCtx.sampleRate));
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

function hasPitchDetectionSignal(rms){
  return transcriptionActive ? rms >= transcriptionSignalThreshold() : hasUsableSignal(rms);
}

function transcriptionSignalThreshold(){
  // Reject room noise and the unstable tail of the sax note, while retaining
  // softer attacks measured during microphone calibration.
  return Math.max(0.0008, MIN_NOTE_RMS * 0.70, calibratedNoiseRms * 1.10);
}

function updatePitchEstimate(buf, rms, sampleRate){
  const pitchSilenceThreshold = transcriptionActive ? Math.max(0.0007, calibratedNoiseRms * 1.02) : SILENCE_RMS;
  const pitchDetectionThreshold = transcriptionActive ? transcriptionSignalThreshold() : MIN_NOTE_RMS;
  if(rms < pitchSilenceThreshold){
    missedPitchFrames += 1;
    if(missedPitchFrames > (transcriptionActive ? 1 : 3)) currentEstimatedPitch = null;
    return null;
  }

  let pitch = null;
  if(rms >= pitchDetectionThreshold){
    pitch = yinPitch(buf, sampleRate) || autoCorrelate(buf, sampleRate);
  }

  if(pitch){
    missedPitchFrames = 0;
    if(currentEstimatedPitch){
      const semitoneDistance = Math.abs(12 * Math.log2(pitch / currentEstimatedPitch));
      // Follow a real note change immediately. Within the same note, retain a
      // small amount of smoothing to ignore vibrato and embouchure fluctuation.
      currentEstimatedPitch = transcriptionActive && semitoneDistance >= 0.65
        ? pitch
        : currentEstimatedPitch * (transcriptionActive ? 0.25 : 0.55) + pitch * (transcriptionActive ? 0.75 : 0.45);
    } else {
      currentEstimatedPitch = pitch;
    }
    pitchHistory.push(currentEstimatedPitch);
    if(pitchHistory.length > 80) pitchHistory.shift();
  } else {
    missedPitchFrames += 1;
    if(missedPitchFrames > (transcriptionActive ? 2 : 10)) currentEstimatedPitch = null;
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
