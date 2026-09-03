export type EventType = 'PRICE_UPDATE' | 'PRICE_SPIKE' | 'PRICE_DROP' | 'HIGH_VOLUME' | 'NEW_HIGH' | 'NEW_LOW' | 'PRICE_TARGET';
export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type DataMode = 'LIVE' | 'DEMO';

export interface Stock {
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  currency: string;
  latestPrice: number | null;
  percentageChange: number | null;
  volume: number | null;
  timestamp: string | null;
  source: string | null; // raw value from MarketData: 'demo' | 'live' (lowercase) — see formatting note where displayed
}

export interface MarketDataPoint {
  price: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  percentageChange: number;
  timestamp: string;
  source: string;
}

export interface MarketEvent {
  eventId: string;
  eventType: EventType;
  symbol: string;
  price: number;
  previousPrice: number;
  percentageChange: number;
  volume: number;
  severity: EventSeverity;
  timestamp: string;
}

export interface Alert {
  _id: string;
  eventId: string;
  symbol: string;
  alertType: string;
  message: string;
  severity: EventSeverity;
  isRead: boolean;
  triggeredAt: string;
}

export interface MarketOverview {
  marketStatus: 'OPEN' | 'CLOSED';
  dataMode: DataMode;
  nifty50: { price: number; percentageChange: number } | null;
  sensex: { price: number; percentageChange: number } | null;
  topGainers: { symbol: string; price: number; percentageChange: number; volume: number }[];
  topLosers: { symbol: string; price: number; percentageChange: number; volume: number }[];
  trackedStockCount: number;
  latestUpdate: string | null;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  returnPercentage: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalReturnPercentage: number;
  positions: PortfolioPosition[];
}

export interface AlertRule {
  _id: string;
  symbol: string;
  ruleType: 'PRICE_CHANGE' | 'PRICE_TARGET' | 'VOLUME';
  operator: '>' | '<' | '>=' | '<=' | '=';
  threshold: number;
  isActive: boolean;
}

export interface Watchlist {
  _id: string;
  name: string;
}

export interface WatchlistDetail {
  id: string;
  name: string;
  items: { symbol: string; price: number | null; percentageChange: number | null }[];
}
