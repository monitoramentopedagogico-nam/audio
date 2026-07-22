'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const timing = require('../mysite/app/static/app/audio-timing.js');

test('por que ele vive keeps 50 notes aligned across three pages', ()=>{
  const beats = [1,1,1,2,.25,2,2,.5,1,.5,2,1,1,1,2,2,1,1,.25,1,2,.25,1,1,1,2,2,.25,.5,1,.25,1,.5,.5,1,2,1,1,1,1,.5,.25,1,2,.5,1,.25,1,1,4];
  const measureStarts = [4,7,11,15,18,23,26,31,36,40,45];
  const pages = timing.readingPageRanges(beats.length, measureStarts, 24);
  const timeline = timing.buildTimeline(beats, 70);
  assert.deepEqual(pages, [{start:0,end:23},{start:23,end:45},{start:45,end:50}]);
  assert.equal(pages.reduce((sum, page)=>sum + page.end - page.start, 0), 50);
  assert.ok(Math.abs(timeline.starts[49] - 43.928571) < 0.00001);
  assert.ok(Math.abs(timeline.totalSeconds - 47.357142) < 0.00001);
});

test('sound gate remains synchronized with the complete rhythmic value', ()=>{
  const full = 4 * (60 / 70);
  const sounding = timing.soundingDuration(4, 70);
  assert.ok(full - sounding <= 0.07);
  assert.ok(sounding <= full);
});
