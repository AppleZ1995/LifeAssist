const fs = require('fs');
const path = require('path');

const lotteryDir = path.join(__dirname, 'db/lottery_ssq');

function readAllResults() {
  const files = fs.readdirSync(lotteryDir).filter(f => f.endsWith('.json'));
  const all = [];
  files.sort(); // ensure consistent order (origin.json, origin1.json...)
  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(lotteryDir, file), 'utf8'));
    if (data.result && Array.isArray(data.result)) {
      data.result.forEach(r => {
        const reds = r.red ? r.red.split(',').map(s => parseInt(s,10)) : [];
        const blue = r.blue ? parseInt(r.blue,10) : null;
        if (reds.length === 6 && blue) {
          all.push({date: r.date, code: r.code, red: reds.sort((a,b)=>a-b), blue: blue});
        }
      });
    }
  });
  return all;
}

function analyze(results) {
  const total = results.length;
  const redFreq = Array(34).fill(0); // 1..33
  const blueFreq = Array(17).fill(0); // 1..16
  results.forEach(r => {
    r.red.forEach(n => redFreq[n]++);
    blueFreq[r.blue]++;
  });
  return {total, redFreq, blueFreq};
}

function recencyScores(results, window=10) {
  // Give higher weight to more recent draws; results assumed newest-first in origin.json
  // But files may be ordered oldest-first; determine ordering by date presence: we'll assume files are newest-first as earlier scripts used
  // To be safe, sort by code descending if code is numeric
  const sorted = results.slice().sort((a,b)=>parseInt(b.code)-parseInt(a.code));
  if (typeof window === 'undefined' || window === null) window = 10;
  const scores = Array(34).fill(0);
  const limit = Math.min(window, sorted.length);
  for (let i=0;i<limit;i++){
    const draw = sorted[i];
    const weight = (window - i) / window; // recent draw weight near 1, older near 0
    draw.red.forEach(n=> scores[n] += weight);
  }
  return scores;
}

function topNFromArrayCount(arr, start=1, end=33, n=6){
  const list = [];
  if (typeof start === 'undefined' || start === null) start = 1;
  if (typeof end === 'undefined' || end === null) end = 33;
  if (typeof n === 'undefined' || n === null) n = 6;
  for (let i=start;i<=end;i++) list.push({num:i,count:arr[i]});
  list.sort((a,b)=>b.count - a.count || a.num - b.num);
  return list.slice(0,n).map(x=>x.num);
}

function bottomNFromArrayCount(arr, start=1, end=33, n=6){
  const list = [];
  if (typeof start === 'undefined' || start === null) start = 1;
  if (typeof end === 'undefined' || end === null) end = 33;
  if (typeof n === 'undefined' || n === null) n = 6;
  for (let i=start;i<=end;i++) list.push({num:i,count:arr[i]});
  list.sort((a,b)=>a.count - b.count || a.num - b.num);
  return list.slice(0,n).map(x=>x.num);
}

function weightedTopByCombined(redFreq, recency, n) {
  if (typeof n === 'undefined' || n === null) n = 6;
  // combine normalized freq and recency
  const maxFreq = Math.max(...redFreq.slice(1));
  const maxRec = Math.max(...recency.slice(1));
  const list = [];
  for (let i=1;i<=33;i++){
    const f = maxFreq? (redFreq[i]/maxFreq) : 0;
    const r = maxRec? (recency[i]/maxRec) : 0;
    const score = 0.7*f + 0.3*r;
    list.push({num:i,score});
  }
  list.sort((a,b)=>b.score - a.score || a.num - b.num);
  return list.slice(0,n).map(x=>x.num);
}

function makeCandidates(analysis, recency, results) {
  const candidates = [];
  const top6 = topNFromArrayCount(analysis.redFreq,1,33,6);
  const topBlueIdx = analysis.blueFreq.slice(1).map((c,i)=>({num:i+1,count:c})).sort((a,b)=>b.count-a.count)[0].num;
  const blueSorted = analysis.blueFreq.slice(1).map((c,i)=>({num:i+1,count:c})).sort((a,b)=>b.count-a.count);

  // 1. Most Frequent
  candidates.push({name:'Most Frequent', red: top6.slice(), blue: blueSorted[0].num});

  // 2. Hot & Cold Mix (top3 + bottom3)
  const hot3 = topNFromArrayCount(analysis.redFreq,1,33,3);
  const cold3 = bottomNFromArrayCount(analysis.redFreq,1,33,3);
  candidates.push({name:'Hot & Cold Mix', red: [...new Set([...hot3,...cold3])].slice(0,6), blue: blueSorted[1] ? blueSorted[1].num : blueSorted[0].num});

  // 3. Recent Heavy: numbers appearing most in last 10 draws
  const recList = [];
  for (let i=1;i<=33;i++) recList.push({num:i,score:recency[i]});
  recList.sort((a,b)=>b.score - a.score || a.num - b.num);
  const recentTop = recList.slice(0,6).map(x=>x.num);
  candidates.push({name:'Recent Heavy', red: recentTop, blue: results.length? results[0].blue : blueSorted[0].num});

  // 4. Balanced: 4 top frequent + 2 from weighted combined
  const weightedTop = weightedTopByCombined(analysis.redFreq, recency, 8);
  const balanced = Array.from(new Set([...top6.slice(0,4), ...weightedTop.slice(0,4)])).slice(0,6);
  candidates.push({name:'Balanced Mix', red: balanced, blue: blueSorted[2] ? blueSorted[2].num : blueSorted[0].num});

  // 5. Weighted Score Top 6 (using combined metric)
  const weightedTop6 = weightedTopByCombined(analysis.redFreq, recency, 6);
  candidates.push({name:'Weighted Combined Top', red: weightedTop6, blue: blueSorted[0].num});

  return candidates;
}

function scoreGroup(group, analysis, recency) {
  // red component: average combined score
  const maxRedFreq = Math.max(...analysis.redFreq.slice(1));
  const maxRec = Math.max(...recency.slice(1));
  let redSum = 0;
  group.red.forEach(n=>{
    const f = maxRedFreq? (analysis.redFreq[n]/maxRedFreq) : 0;
    const r = maxRec? (recency[n]/maxRec) : 0;
    const cs = 0.7*f + 0.3*r; // combined score per number
    redSum += cs;
  });
  const redAvg = redSum / group.red.length; // 0..1
  // blue component
  const maxBlue = Math.max(...analysis.blueFreq.slice(1));
  const blueScore = maxBlue? (analysis.blueFreq[group.blue]/maxBlue) : 0; // 0..1
  // final score: weight red 0.75, blue 0.25
  const final = (redAvg*0.75 + blueScore*0.25);
  return Math.round(final*10000)/100; // percentage with 2 decimals
}

function normalizeAndFormat(groups, analysis, recency) {
  const scored = groups.map(g=> ({...g, score: scoreGroup(g,analysis,recency)}));
  // sort desc
  scored.sort((a,b)=>b.score - a.score);
  return scored.map((g,idx)=> ({rank: idx+1, name:g.name, red:g.red.map(n=>String(n).padStart(2,'0')), blue: String(g.blue).padStart(2,'0'), score:g.score}));
}

function main(){
  const results = readAllResults();
  if (!results.length) { console.error('No results found'); process.exit(1);} 
  const analysis = analyze(results);
  const recency = recencyScores(results, 10);
  const candidates = makeCandidates(analysis, recency, results);
  const out = normalizeAndFormat(candidates, analysis, recency);
  console.log(JSON.stringify({generatedAt:new Date().toISOString(), totalHistorical:analysis.total, candidates: out}, null, 2));
}

main();
