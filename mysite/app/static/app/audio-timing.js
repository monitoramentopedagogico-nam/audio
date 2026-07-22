(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.SaxTiming = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  function clampBpm(value){
    return Math.max(30, Math.min(240, Number(value) || 60));
  }

  function buildTimeline(beats, bpm){
    const secondsPerBeat = 60 / clampBpm(bpm);
    const starts = [];
    let elapsed = 0;
    (beats || []).forEach(value=>{
      starts.push(elapsed);
      elapsed += Math.max(0.125, Number(value) || 1) * secondsPerBeat;
    });
    return {starts, totalSeconds:elapsed, secondsPerBeat};
  }

  function readingPageRanges(totalNotes, measureStarts, pageSize){
    const total = Math.max(0, Number(totalNotes) || 0);
    if(!total) return [{start:0, end:0}];
    const starts = [0, ...(measureStarts || [])]
      .map(Number)
      .filter((value, index, values)=>value >= 0 && value < total && values.indexOf(value) === index)
      .sort((a, b)=>a - b);
    if(starts[0] !== 0) starts.unshift(0);
    const measures = starts.map((start, index)=>({start, end:starts[index + 1] || total}));
    const pages = [];
    let pageStart = measures[0].start;
    let pageEnd = pageStart;
    measures.forEach(measure=>{
      const proposedCount = measure.end - pageStart;
      if(pageEnd > pageStart && proposedCount > pageSize){
        pages.push({start:pageStart, end:pageEnd});
        pageStart = measure.start;
      }
      pageEnd = measure.end;
    });
    pages.push({start:pageStart, end:pageEnd});
    return pages;
  }

  function soundingDuration(noteBeats, bpm){
    const fullDuration = Math.max(0.125, Number(noteBeats) || 1) * (60 / clampBpm(bpm));
    return Math.max(0.08, Math.min(fullDuration * 0.98, fullDuration - 0.012));
  }

  return {clampBpm, buildTimeline, readingPageRanges, soundingDuration};
});
