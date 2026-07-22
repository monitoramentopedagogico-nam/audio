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
