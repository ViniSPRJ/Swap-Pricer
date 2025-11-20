
export enum Page {
  DASHBOARD = 'dashboard',
  PRICER = 'pricer',
  RESULTS = 'results',
  SETTINGS = 'settings'
}

export interface SwapLeg {
  currency: string;
  notional: number;
  rate: number;
  type: 'Fixed' | 'Floating';
  frequency: string;
  convention: string;
}

export interface SwapDeal {
  id?: string;
  status?: 'Active' | 'Pending' | 'Matured';
  valueDate: string;
  startDate: string;
  endDate: string;
  leg1: SwapLeg;
  leg2: SwapLeg;
}

export interface PricingResult {
  npvTotal: number;
  npvTotalFormatted: string;
  spread: number;
  principal: number;
  leg1Npv: number;
  leg2Npv: number;
  cashflows: CashflowRow[];
}

export interface CashflowRow {
  date: string;
  leg1Flow: number;
  leg2Flow: number;
  discountFactor: number;
  presentValue: number;
}
