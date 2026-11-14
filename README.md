# Intelligent NSE-BSE Market Analyzer

An AI and Machine Learning-based web application for analyzing historical stock market data from the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE).

The platform combines stock market data analysis, technical indicators, machine learning-based predictions, risk analysis and interactive visualizations to help users understand stock market trends and patterns.

## Project Information

| Detail | Description |
|---|---|
| Project Title | Intelligent NSE-BSE Market Analyzer |
| Project Type | B.Tech Final-Year Academic Project |
| Degree | Bachelor of Technology |
| Branch | Artificial Intelligence and Machine Learning |
| Expected Graduation | 2027 |
| Primary SDG | SDG 9 – Industry, Innovation and Infrastructure |

## Overview

The stock market generates large amounts of historical data that can be difficult to analyze manually. This project aims to simplify stock market analysis by providing an integrated platform for exploring NSE and BSE stocks.

The application uses historical End-of-Day (EOD) stock market data, technical analysis indicators, machine learning algorithms and risk evaluation techniques to generate analytical insights.

It is designed as an educational and analytical platform and does not execute trades or provide guaranteed investment predictions.

## Objectives

- Analyze historical NSE and BSE stock market data.
- Identify stock price trends and patterns.
- Apply machine learning algorithms for stock price prediction.
- Calculate technical indicators for market analysis.
- Evaluate stock risk using statistical measures.
- Compare multiple stocks through interactive visualizations.
- Provide a user-friendly stock analysis dashboard.

## Key Features

### 1. Stock Market Analysis
- Explore NSE and BSE stocks.
- View historical stock price information.
- Analyze stock price movements and trading patterns.

### 2. Technical Indicators
The platform includes technical analysis indicators such as:

- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- Moving Average Convergence Divergence (MACD)
- Bollinger Bands
- Pivot Points

### 3. Machine Learning Predictions
The project incorporates machine learning regression algorithms:

- Random Forest Regression
- Ridge Regression
- Decision Tree Regression

These algorithms are used to analyze historical patterns and estimate stock price movements.

### 4. Risk Analysis
The application includes financial risk analysis measures:

- Historical Volatility
- Value at Risk (VaR)
- Sharpe Ratio

### 5. Stock Comparison
Compare selected stocks using historical price information, technical indicators and analytical visualizations.

### 6. Dashboard and User Features
- Interactive dashboard
- Stock exploration
- Watchlist management
- Stock comparison
- User authentication

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Node.js, Express.js |
| Database | SQLite |
| User Authentication | Firebase Authentication |
| User Data Storage | Firebase Cloud Firestore |
| Market Data Service | TejHQ |
| Machine Learning | Python/JavaScript implementation to be verified against the final source code |
| Development Tools | Visual Studio Code, Git, GitHub |

## System Architecture

The application follows a frontend-backend architecture.

**Market Data Flow:**

TejHQ Historical EOD Data → Market Data Service → Data Processing → SQLite Database → Backend APIs → React Frontend

**User Data Flow:**

User → Firebase Authentication → User Preferences and Application Data → Firebase Cloud Firestore

**Analysis Flow:**

Historical Stock Data → Technical Indicators → Machine Learning Models → Risk Analysis → Visualizations

## Machine Learning Algorithms

The project uses the following regression algorithms:

1. **Random Forest Regression:** Uses an ensemble of decision trees to model relationships in historical stock data.
2. **Ridge Regression:** Applies L2 regularization to a linear regression model.
3. **Decision Tree Regression:** Uses decision-based splits to estimate numerical stock prices.

## Database

The project uses two storage systems for different purposes:

**SQLite**
- Stores historical stock market data.
- Supports stock data retrieval and analysis.
- Database file: `market_history.db`.

**Firebase Cloud Firestore**
- Stores user-related application information.
- Supports user preferences and watchlist-related information.

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Git
- Firebase project configuration

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/intelligent-nse-bse-market-analyzer.git
```

### Step 2: Navigate to the Project Directory

```bash
cd intelligent-nse-bse-market-analyzer
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create the required environment configuration using the project's existing environment-variable template.

Add the necessary Firebase configuration and other required settings.

Do not upload API keys, passwords, private credentials or service-account files to GitHub.

### Step 5: Run the Application

Check the `scripts` section of `package.json` for the available development command.

For example, if the project defines a `dev` script:

```bash
npm run dev
```

If the backend runs separately, start it using the command defined in its package configuration.

## Project Structure

The following is a high-level description of the important project files and folders. Actual paths may vary depending on the final repository structure.

```text
intelligent-nse-bse-market-analyzer/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── data/
│   └── firebase.ts
│
├── data/
│   └── market_history.db
│
├── server.ts
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Sustainable Development Goals

**Primary SDG: Goal 9 – Industry, Innovation and Infrastructure**

This project supports SDG 9 by demonstrating the application of artificial intelligence, machine learning, data analytics and digital technologies to develop an innovative financial analysis platform.

It also has potential supporting relevance to:

- **SDG 8 – Decent Work and Economic Growth:** By improving access to stock market information.
- **SDG 4 – Quality Education:** By providing an educational platform for understanding financial markets and analytical techniques.

## Project Limitations

- Analysis is based on the availability and quality of historical market data.
- Historical EOD data is not the same as live intraday market data.
- Machine learning predictions are estimates and are not guaranteed to be accurate.
- The platform is intended for academic and analytical purposes, not as financial advice.

## Future Enhancements

- Integration of additional reliable market data sources.
- Improved machine learning prediction models.
- Advanced portfolio analysis.
- Enhanced stock comparison features.
- Improved prediction evaluation and performance metrics.
- Additional financial visualization tools.

## Academic Project Disclaimer

This project has been developed as part of the Bachelor of Technology final-year academic project in Artificial Intelligence and Machine Learning.

The application is intended for educational, research and analytical purposes only. It does not provide financial advice or guarantee future stock market performance.

## Author

**Harsha Gowda S**

B.Tech – Artificial Intelligence and Machine Learning

Final-Year Academic Project, 2026–2027
