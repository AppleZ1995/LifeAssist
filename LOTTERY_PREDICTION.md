# SSQ Lottery Prediction System

## Overview

This is a comprehensive lottery prediction system that analyzes historical SSQ (双色球 - Chinese Lottery) data and generates predictions for the next lottery draw based on statistical analysis.

## Features

✅ **Analysis of 1,937 Historical Lottery Records**
- Data spans from 2023-11-19 to 2025-11-11
- Complete red number (1-33) and blue number (1-16) frequency analysis

✅ **10 Prediction Groups**
- Multiple prediction strategies to increase chances
- Based on frequency analysis and statistical patterns

✅ **Beautiful Web Interface**
- Interactive dashboard showing frequency analysis
- Color-coded prediction groups
- Copy-to-clipboard functionality
- Fully responsive design

## Architecture

### Files & Components

```
├── analyzeSSQ.js              # Analysis script (run once to generate predictions)
├── predictions.json           # Pre-generated predictions data
├── routes/
│   ├── api.js                 # API endpoint for predictions
│   └── index.js               # Route for lottery page
├── views/
│   └── lottery.ejs            # Frontend UI for predictions
└── db/lottery_ssq/            # Historical lottery data (65 JSON files)
```

## How to Use

### 1. Generate Predictions (if not already done)

```bash
node analyzeSSQ.js
```

This will:
- Read all historical data from `db/lottery_ssq/`
- Analyze frequency of each red number (1-33) and blue number (1-16)
- Generate 10 prediction groups using different strategies
- Save results to `predictions.json`

### 2. View Predictions

Access the web interface:
```
http://localhost:3000/lottery
```

### 3. API Access

Get predictions via API:
```bash
GET /api/v1/lottery-predictions
```

Returns JSON with:
- `totalHistoricalRecords`: Number of historical draws analyzed
- `dataRange`: Date range of historical data
- `redNumberAnalysis`: Frequency count of each red number
- `blueNumberAnalysis`: Frequency count of each blue number
- `predictions`: Array of 10 prediction groups

## Analysis Results

### Top 10 Most Frequent Red Numbers
1. Number **6**: 399 times
2. Number **14**: 399 times
3. Number **22**: 389 times
4. Number **9**: 381 times
5. Number **17**: 378 times
6. Number **2**: 377 times
7. Number **1**: 375 times
8. Number **19**: 373 times
9. Number **26**: 369 times
10. Number **10**: 367 times

### Top 8 Most Frequent Blue Numbers
1. Number **1**: 137 times
2. Number **16**: 137 times
3. Number **15**: 135 times
4. Number **7**: 131 times
5. Number **12**: 128 times
6. Number **6**: 126 times
7. Number **4**: 123 times
8. Number **14**: 123 times

## Prediction Strategies

### 1. **Most Frequent Strategy**
Uses the top 6 most frequently drawn red numbers and the most frequent blue number.
- Red: 02, 06, 09, 14, 17, 22
- Blue: 01

### 2. **Hot & Cold Mix Strategy**
Combines the hottest (most frequent) and coldest (least frequent) numbers.
- Red: 06, 07, 14, 18, 22, 32
- Blue: 16

### 3-10. **Variation Strategies**
Uses different combinations from the frequency ranking to provide diverse options.

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Frontend**: Bootstrap 5 + JavaScript
- **Data Analysis**: Custom JavaScript statistical analysis

## Data Structure

### Historical Data Format (origin*.json)
```json
{
  "state": 0,
  "message": "查询成功",
  "total": 1937,
  "result": [
    {
      "code": "2025130",
      "date": "2025-11-11(二)",
      "red": "01,05,08,14,19,23",
      "blue": "06",
      "sales": "377466594",
      ...
    }
  ]
}
```

### Predictions Output Format (predictions.json)
```json
{
  "totalHistoricalRecords": 1937,
  "dataRange": {
    "latest": "2025-11-11(二)",
    "oldest": "2023-11-19(日)"
  },
  "redNumberAnalysis": { ... },
  "blueNumberAnalysis": { ... },
  "predictions": [
    {
      "strategy": "Most Frequent",
      "red": [2, 6, 9, 14, 17, 22],
      "blue": 1
    },
    ...
  ]
}
```

## Disclaimer

⚠️ **Important Notice**: This system is for informational and entertainment purposes only. Lottery drawings are random events, and these predictions do NOT guarantee winning results. Past frequency analysis does not predict future outcomes. Please gamble responsibly and only with money you can afford to lose.

## Future Enhancements

- [ ] Machine learning model for better predictions
- [ ] Historical win rate tracking
- [ ] Export predictions to CSV/PDF
- [ ] Mobile app version
- [ ] Real-time prediction updates
- [ ] Combination analysis (which numbers appear together most frequently)
- [ ] Probability calculations

## API Reference

### GET /api/v1/lottery-predictions

Returns current lottery predictions and analysis.

**Response:**
```json
{
  "totalHistoricalRecords": 1937,
  "dataRange": {
    "latest": "2025-11-11(二)",
    "oldest": "2023-11-19(日)"
  },
  "redNumberAnalysis": {
    "1": 375,
    "2": 377,
    ...
  },
  "blueNumberAnalysis": {
    "1": 137,
    "16": 137,
    ...
  },
  "predictions": [
    {
      "strategy": "Most Frequent",
      "red": [2, 6, 9, 14, 17, 22],
      "blue": 1
    },
    ...
  ]
}
```

## License

MIT License

## Support

For issues or questions, please refer to the main LifeAssist project documentation.
