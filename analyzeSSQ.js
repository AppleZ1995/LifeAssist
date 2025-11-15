const fs = require('fs');
const path = require('path');

// Read all lottery data files
const lotteryDir = path.join(__dirname, 'db/lottery_ssq');

// Collect all historical data
const allResults = [];

try {
  const files = fs.readdirSync(lotteryDir).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(lotteryDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (data.result && Array.isArray(data.result)) {
      data.result.forEach(result => {
        const reds = result.red ? result.red.split(',').map(n => parseInt(n)) : [];
        const blue = result.blue ? parseInt(result.blue) : null;
        
        if (reds.length > 0 && blue) {
          allResults.push({
            code: result.code,
            date: result.date,
            red: reds.sort((a, b) => a - b),
            blue: blue
          });
        }
      });
    }
  });
  
  console.log(`Total historical results: ${allResults.length}`);
  
  // Analyze red numbers frequency
  const redFrequency = {};
  const blueFrequency = {};
  
  for (let i = 1; i <= 33; i++) redFrequency[i] = 0;
  for (let i = 1; i <= 16; i++) blueFrequency[i] = 0;
  
  allResults.forEach(result => {
    result.red.forEach(num => {
      redFrequency[num]++;
    });
    blueFrequency[result.blue]++;
  });
  
  // Get top frequency numbers
  const redSorted = Object.entries(redFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
    
  const blueSorted = Object.entries(blueFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  console.log('\n=== Red Numbers Frequency (Top 15) ===');
  redSorted.forEach(([num, count], idx) => {
    console.log(`${idx + 1}. Number ${num}: ${count} times`);
  });
  
  console.log('\n=== Blue Numbers Frequency (Top 8) ===');
  blueSorted.forEach(([num, count], idx) => {
    console.log(`${idx + 1}. Number ${num}: ${count} times`);
  });
  
  // Generate predictions using multiple strategies
  const predictions = [];
  
  // Strategy 1: Most frequent numbers
  const topRedNums = redSorted.slice(0, 6).map(([num]) => parseInt(num));
  const topBlueNum = parseInt(blueSorted[0][0]);
  predictions.push({
    strategy: 'Most Frequent',
    red: topRedNums.sort((a, b) => a - b),
    blue: topBlueNum
  });
  
  // Strategy 2: Mix of hot and cold numbers
  const hotReds = redSorted.slice(0, 3).map(([num]) => parseInt(num));
  const coldReds = redSorted.slice(-3).map(([num]) => parseInt(num));
  const mixedPrediction = [...hotReds, ...coldReds].sort((a, b) => a - b);
  predictions.push({
    strategy: 'Hot & Cold Mix',
    red: mixedPrediction.slice(0, 6),
    blue: blueSorted[1] ? parseInt(blueSorted[1][0]) : topBlueNum
  });
  
  // Strategy 3: Statistical analysis with variations
  for (let i = 0; i < 8; i++) {
    const selected = redSorted
      .slice(i, i + 6)
      .map(([num]) => parseInt(num))
      .sort((a, b) => a - b);
    
    if (selected.length === 6) {
      predictions.push({
        strategy: `Variation ${i + 1}`,
        red: selected,
        blue: blueSorted[i % blueSorted.length] ? parseInt(blueSorted[i % blueSorted.length][0]) : topBlueNum
      });
    }
  }
  
  // Output predictions
  console.log('\n=== PREDICTIONS (10 Possible Groups) ===\n');
  predictions.slice(0, 10).forEach((pred, idx) => {
    const redStr = pred.red.map(n => String(n).padStart(2, '0')).join(', ');
    const blueStr = String(pred.blue).padStart(2, '0');
    console.log(`${idx + 1}. [${pred.strategy}]`);
    console.log(`   Red:  ${redStr}`);
    console.log(`   Blue: ${blueStr}`);
    console.log('');
  });
  
  // Generate summary report
  const summaryReport = {
    totalHistoricalRecords: allResults.length,
    dataRange: {
      latest: allResults[0].date,
      oldest: allResults[allResults.length - 1].date
    },
    redNumberAnalysis: Object.fromEntries(
      redSorted.slice(0, 10).map(([num, count]) => [num, count])
    ),
    blueNumberAnalysis: Object.fromEntries(
      blueSorted.slice(0, 10).map(([num, count]) => [num, count])
    ),
    predictions: predictions.slice(0, 10)
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, 'predictions.json');
  fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2), 'utf-8');
  console.log(`\n✓ Report saved to: ${reportPath}`);
  
} catch (error) {
  console.error('Error:', error.message);
}
