
import React, { useState } from 'react';
import { Page, SwapDeal, PricingResult, CashflowRow } from './types';
import { analyzeSwapDeal } from './services/aiService';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  AreaChart, 
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// --- Utilities & Calculation Logic ---

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const getFrequencyMonths = (freq: string): number => {
  switch (freq) {
    case 'Monthly': return 1;
    case 'Quarterly': return 3;
    case 'Semi-Annual': return 6;
    case 'Annual': return 12;
    default: return 3;
  }
};

// Dynamic Cashflow Generator
const generateSmartCashflows = (deal: SwapDeal): CashflowRow[] => {
  const rows: CashflowRow[] = [];
  const start = new Date(deal.startDate);
  const end = new Date(deal.endDate);
  let currentDate = new Date(start);

  // Determine frequency in months (using Leg 1 as driver for row generation for simplicity)
  const monthsToAdd = getFrequencyMonths(deal.leg1.frequency);

  // Advance to first payment
  currentDate = addMonths(currentDate, monthsToAdd);

  let period = 1;

  while (currentDate <= end) {
    const dateStr = formatDate(currentDate);
    
    // Calculate crude interest flows
    // Simple Interest = Notional * Rate% * (Months/12)
    const timeFraction = monthsToAdd / 12;
    
    // Leg 1 (Payer/Receiver based on context, usually Payer in standard swap notation for Leg 1)
    // Assuming Leg 1 is Receiver for this calculation logic as per the results page label "Perna Ativa (Recebimento)"
    // However, the PricerForm labels Leg 1 as Payer. Let's align with PricerForm: Leg 1 = Payer (-), Leg 2 = Receiver (+)
    // Wait, standard XCCY: usually exchange notional at start/end. Here we just show interest flows.
    
    // Let's randomize rates slightly to simulate floating if needed, or use fixed.
    const leg1Rate = deal.leg1.type === 'Floating' ? deal.leg1.rate + (Math.random() * 0.5 - 0.25) : deal.leg1.rate;
    const leg2Rate = deal.leg2.type === 'Floating' ? deal.leg2.rate + (Math.random() * 0.5 - 0.25) : deal.leg2.rate;

    const leg1Interest = deal.leg1.notional * (leg1Rate / 100) * timeFraction;
    const leg2Interest = deal.leg2.notional * (leg2Rate / 100) * timeFraction;

    // Discount factor (simple decay)
    const discountFactor = 1 / Math.pow(1.04, period * timeFraction); // Assuming 4% discount rate

    // PV in base currency (using simplified Leg 2 currency as reporting currency for demo)
    // In a real app, we'd convert Leg 1 flow to Leg 2 currency using FX forwards.
    // Here: Simple math for demo.
    const fxRate = 1.0; // Assume parity for simple visual 
    const netFlow = leg1Interest - leg2Interest; // Paying Leg 1, Receiving Leg 2? Or vice versa.
    
    // Let's assume we display raw flows in their currencies for the table columns, 
    // but PV is calculated in a consolidated view.
    
    rows.push({
      date: dateStr,
      leg1Flow: Number(leg1Interest.toFixed(2)),
      leg2Flow: Number((-leg2Interest).toFixed(2)), // Convention: Pay = negative, but let's keep flows absolute in table columns or signed? 
      // Re-aligning with UI screenshot: Leg 1 (Positive), Leg 2 (Negative).
      // UI Screenshot says: Leg 1 (Receiving), Leg 2 (Paying).
      // Let's follow the UI screenshot logic for the Result Page.
      discountFactor: Number(discountFactor.toFixed(4)),
      presentValue: Number((Math.abs(leg1Interest) - Math.abs(leg2Interest) * discountFactor).toFixed(2))
    });

    currentDate = addMonths(currentDate, monthsToAdd);
    period++;
  }
  return rows;
};

// --- Components ---

const Sidebar = ({ currentPage, setPage }: { currentPage: Page, setPage: (p: Page) => void }) => (
  <aside className="flex h-screen flex-col justify-between bg-white border-r border-gray-200 p-4 w-64 sticky top-0 hidden md:flex">
    <div>
      <div className="flex gap-3 mb-6">
        <div className="bg-primary flex items-center justify-center rounded-full size-10 text-white shadow-md">
           <span className="material-symbols-outlined">currency_exchange</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-gray-900 text-base font-bold leading-normal font-display">SwapPricer</h1>
          <p className="text-gray-500 text-xs font-medium leading-normal uppercase tracking-wider">Pricing System</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        <button 
          onClick={() => setPage(Page.DASHBOARD)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${currentPage === Page.DASHBOARD ? 'bg-gray-100 text-primary font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
        >
          <span className={`material-symbols-outlined ${currentPage === Page.DASHBOARD ? 'material-symbols-filled' : ''}`}>dashboard</span>
          <p className="text-sm leading-normal">Dashboard</p>
        </button>
        <button 
           onClick={() => setPage(Page.PRICER)}
           className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${currentPage === Page.PRICER ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
        >
          <span className={`material-symbols-outlined ${currentPage === Page.PRICER ? 'material-symbols-filled' : ''}`}>calculate</span>
          <p className="text-sm leading-normal">Pricing Tools</p>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
          <span className="material-symbols-outlined">history</span>
          <p className="text-sm font-medium leading-normal">History</p>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium leading-normal">Settings</p>
        </button>
      </nav>
    </div>
    <div className="flex flex-col gap-4">
      <button onClick={() => setPage(Page.PRICER)} className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold w-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0">
        <span className="truncate">New Pricing</span>
      </button>
      <div className="flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          <span className="material-symbols-outlined">help_outline</span>
          <p className="text-sm font-medium leading-normal">Help</p>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          <span className="material-symbols-outlined">logout</span>
          <p className="text-sm font-medium leading-normal">Logout</p>
        </button>
      </div>
    </div>
  </aside>
);

const MobileHeader = ({ setPage }: { setPage: (p: Page) => void }) => (
  <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="flex items-center gap-2" onClick={() => setPage(Page.DASHBOARD)}>
        <div className="bg-primary rounded-full size-8 flex items-center justify-center text-white">
           <span className="material-symbols-outlined text-lg">currency_exchange</span>
        </div>
        <span className="font-bold text-gray-900">SwapPricer</span>
    </div>
    <button onClick={() => setPage(Page.DASHBOARD)} className="text-gray-600">
      <span className="material-symbols-outlined">menu</span>
    </button>
  </header>
);

// --- Pages ---

const Dashboard = ({ setPage, deals }: { setPage: (p: Page) => void, deals: SwapDeal[] }) => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h1 className="text-gray-900 text-3xl font-black tracking-tight">Portfolio</h1>
          <p className="text-gray-500 text-base">Cross-Currency Swaps Overview</p>
        </div>
        <div className="flex items-center gap-2">
             <button className="bg-white border border-gray-200 hover:bg-gray-50 rounded-full p-2 shadow-sm transition-colors">
                 <span className="material-symbols-outlined text-gray-600">notifications</span>
             </button>
             <div className="bg-gray-200 rounded-full size-10 bg-cover bg-center shadow-inner" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCEZfNXgvcDRygrQtXXyK4nwhfW19Pv064yUlrBCRrRDMosWsUvdJ2y69J-hA3VJrakE2J2hY_KGSkSwtMAJdoasd4mlLqhS72u4QhbQ17UhMw5JAi7Py7igOL7NQACqSb2vE7cysuygCBI00E78eMFhDRCEblU0M_CUUTB_KROb6JByoLTWa7CvlEwopz3GHcdwfKxaBC2h-fNR9Lag3-IhqYE0uihM2HAE-nr5qTc0W1QkwS17emp6CqFXCsFRD3gHnNsNasJAfM")'}}>
             </div>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">search</span>
              <input type="text" placeholder="Search by ID, currency, notional..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-background-light focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400" />
           </div>
           <button onClick={() => setPage(Page.PRICER)} className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md">
              <span className="material-symbols-outlined text-lg">add</span>
              Add New Swap
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold tracking-wide">
              <tr>
                <th className="px-6 py-4">Swap ID</th>
                <th className="px-6 py-4">Pairs</th>
                <th className="px-6 py-4">Notional</th>
                <th className="px-6 py-4">Maturity</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No deals found. Create a new swap pricing.
                      </td>
                  </tr>
              ) : (
                  deals.map((deal) => {
                      const isActive = deal.status === 'Active';
                      const isPending = deal.status === 'Pending';
                      const statusClass = isActive ? 'bg-green-100 text-green-800' : isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-primary transition-colors">{deal.id}</td>
                          <td className="px-6 py-4">{deal.leg1.currency} / {deal.leg2.currency}</td>
                          <td className="px-6 py-4">{deal.leg1.notional.toLocaleString()} / {deal.leg2.notional.toLocaleString()}</td>
                          <td className="px-6 py-4">{deal.endDate}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>{deal.status || 'Active'}</span>
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-negative hover:bg-negative/10 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </td>
                        </tr>
                      );
                  })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
           <p>Showing {deals.length > 0 ? 1 : 0}-{deals.length} of {deals.length} results</p>
           <div className="flex gap-2">
             <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-50" disabled>Prev</button>
             <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-50" disabled>Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const PricerForm = ({ onCalculate }: { onCalculate: (deal: SwapDeal) => void }) => {
  const [deal, setDeal] = useState<SwapDeal>({
    valueDate: '2024-09-27',
    startDate: '2024-10-01',
    endDate: '2029-10-01',
    leg1: { currency: 'BRL', notional: 10000000, rate: 1.25, type: 'Floating', frequency: 'Quarterly', convention: 'Actual/365' },
    leg2: { currency: 'USD', notional: 1850000, rate: 3.75, type: 'Fixed', frequency: 'Semi-Annual', convention: '30/360' }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Pricing Input</h1>
        <p className="text-gray-500">Enter swap parameters to calculate NPV and risk metrics.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* General Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
           <h3 className="text-lg font-bold mb-4 pb-4 border-b border-gray-100 text-gray-900">General Details</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex flex-col gap-2">
                 <span className="text-sm font-medium text-gray-600">Value Date</span>
                 <input type="date" className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium text-gray-900" value={deal.valueDate} onChange={e => setDeal({...deal, valueDate: e.target.value})} />
              </label>
              <label className="flex flex-col gap-2">
                 <span className="text-sm font-medium text-gray-600">Start Date</span>
                 <input type="date" className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium text-gray-900" value={deal.startDate} onChange={e => setDeal({...deal, startDate: e.target.value})} />
              </label>
              <label className="flex flex-col gap-2">
                 <span className="text-sm font-medium text-gray-600">End Date</span>
                 <input type="date" className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium text-gray-900" value={deal.endDate} onChange={e => setDeal({...deal, endDate: e.target.value})} />
              </label>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leg 1 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <h3 className="font-bold text-gray-900">Leg 1 (Payer)</h3>
                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                   <button 
                     onClick={() => setDeal({...deal, leg1: {...deal.leg1, type: 'Floating'}})}
                     className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${deal.leg1.type === 'Floating' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >Floating</button>
                   <button 
                     onClick={() => setDeal({...deal, leg1: {...deal.leg1, type: 'Fixed'}})}
                     className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${deal.leg1.type === 'Fixed' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >Fixed</button>
                </div>
             </div>
             <div className="p-6 grid gap-6">
                <label className="relative">
                   <span className="text-sm font-medium text-gray-600 mb-1 block">Notional</span>
                   <span className="absolute left-3 top-9 text-gray-400 material-symbols-outlined text-lg">attach_money</span>
                   <input type="number" className="w-full pl-10 form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg1.notional} onChange={e => setDeal({...deal, leg1: {...deal.leg1, notional: Number(e.target.value)}})} />
                </label>
                <div className="grid grid-cols-2 gap-4">
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Currency</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg1.currency} onChange={e => setDeal({...deal, leg1: {...deal.leg1, currency: e.target.value}})}>
                        <option>USD</option><option>BRL</option><option>EUR</option><option>JPY</option><option>GBP</option>
                      </select>
                   </label>
                   <label className="relative">
                      <span className="text-sm font-medium text-gray-600 mb-1 block">{deal.leg1.type === 'Floating' ? 'Spread' : 'Rate'} (%)</span>
                      <input type="number" step="0.01" className="w-full form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg1.rate} onChange={e => setDeal({...deal, leg1: {...deal.leg1, rate: Number(e.target.value)}})} />
                      <span className="absolute right-3 top-9 text-gray-400 font-medium">%</span>
                   </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Frequency</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg1.frequency} onChange={e => setDeal({...deal, leg1: {...deal.leg1, frequency: e.target.value}})}>
                        <option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option>
                      </select>
                   </label>
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Convention</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg1.convention} onChange={e => setDeal({...deal, leg1: {...deal.leg1, convention: e.target.value}})}>
                        <option>Actual/365</option><option>30/360</option><option>Actual/360</option>
                      </select>
                   </label>
                </div>
             </div>
          </div>

          {/* Leg 2 */}
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <h3 className="font-bold text-gray-900">Leg 2 (Receiver)</h3>
                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                   <button 
                     onClick={() => setDeal({...deal, leg2: {...deal.leg2, type: 'Floating'}})}
                     className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${deal.leg2.type === 'Floating' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >Floating</button>
                   <button 
                     onClick={() => setDeal({...deal, leg2: {...deal.leg2, type: 'Fixed'}})}
                     className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${deal.leg2.type === 'Fixed' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >Fixed</button>
                </div>
             </div>
             <div className="p-6 grid gap-6">
                <label className="relative">
                   <span className="text-sm font-medium text-gray-600 mb-1 block">Notional</span>
                   <span className="absolute left-3 top-9 text-gray-400 material-symbols-outlined text-lg">euro</span>
                   <input type="number" className="w-full pl-10 form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg2.notional} onChange={e => setDeal({...deal, leg2: {...deal.leg2, notional: Number(e.target.value)}})} />
                </label>
                <div className="grid grid-cols-2 gap-4">
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Currency</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg2.currency} onChange={e => setDeal({...deal, leg2: {...deal.leg2, currency: e.target.value}})}>
                        <option>USD</option><option>BRL</option><option>EUR</option><option>JPY</option><option>GBP</option>
                      </select>
                   </label>
                   <label className="relative">
                      <span className="text-sm font-medium text-gray-600 mb-1 block">{deal.leg2.type === 'Floating' ? 'Spread' : 'Rate'} (%)</span>
                      <input type="number" step="0.01" className="w-full form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg2.rate} onChange={e => setDeal({...deal, leg2: {...deal.leg2, rate: Number(e.target.value)}})} />
                      <span className="absolute right-3 top-9 text-gray-400 font-medium">%</span>
                   </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Frequency</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg2.frequency} onChange={e => setDeal({...deal, leg2: {...deal.leg2, frequency: e.target.value}})}>
                        <option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option>
                      </select>
                   </label>
                   <label>
                      <span className="text-sm font-medium text-gray-600 mb-1 block">Convention</span>
                      <select className="w-full form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20 font-medium" value={deal.leg2.convention} onChange={e => setDeal({...deal, leg2: {...deal.leg2, convention: e.target.value}})}>
                        <option>Actual/365</option><option>30/360</option><option>Actual/360</option>
                      </select>
                   </label>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-200 pt-6">
           <button className="px-4 py-2.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Save as Template
           </button>
           <button 
              onClick={() => onCalculate(deal)}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-blue-600 flex items-center gap-2 transition-all hover:shadow-md"
           >
              <span className="material-symbols-outlined">calculate</span>
              Calculate Price
           </button>
        </div>
      </div>
    </div>
  );
};

const ResultsPage = ({ deal, result }: { deal: SwapDeal, result: PricingResult }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [showCashflows, setShowCashflows] = useState(true);

  const handleAiAnalyze = async () => {
    setLoadingAi(true);
    try {
        const analysis = await analyzeSwapDeal(deal, result);
        setAiAnalysis(analysis);
    } catch(e) {
        setAiAnalysis("Unable to connect to AI service.");
    }
    setLoadingAi(false);
  };

  // Mock curve data relative to rate inputs to make graphs look somewhat relevant
  const baseRateL1 = deal.leg1.rate;
  const baseRateL2 = deal.leg2.rate;
  
  const curveData = [
    { name: '1Y', leg1: baseRateL1 * 0.9, leg2: baseRateL2 * 0.95 },
    { name: '2Y', leg1: baseRateL1 * 0.95, leg2: baseRateL2 * 0.98 },
    { name: '3Y', leg1: baseRateL1 * 1.0, leg2: baseRateL2 * 1.02 },
    { name: '4Y', leg1: baseRateL1 * 1.08, leg2: baseRateL2 * 1.05 },
    { name: '5Y', leg1: baseRateL1 * 1.15, leg2: baseRateL2 * 1.10 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-gray-900">Pricing Results</h1>
           <p className="text-gray-500">Operation ID: {deal.id}</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-colors">
          <span className="material-symbols-outlined">download</span>
          Export Report
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
            <p className="text-gray-500 font-medium">Total NPV</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{result.npvTotalFormatted}</p>
            <p className="text-positive font-medium text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +1.25%
            </p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
            <p className="text-gray-500 font-medium">Swap Spread</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{result.spread.toFixed(1)} bps</p>
            <p className="text-negative font-medium text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_down</span>
                -0.5 bps
            </p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
            <p className="text-gray-500 font-medium">Principal Value</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{deal.leg2.currency} {result.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-gray-400 text-sm font-medium">&nbsp;</p>
         </div>
      </section>

      {/* AI Analyst Section */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-9xl">psychology</span>
           </div>
           <div className="relative z-10">
               <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-3xl">psychology</span>
                     </div>
                     <div>
                       <h3 className="font-bold text-xl">AI Deal Analyst</h3>
                       <p className="text-blue-100 text-sm font-medium opacity-90">Powered by Google Gemini 2.5 Flash</p>
                     </div>
                  </div>
                  {!aiAnalysis && (
                    <button 
                      onClick={handleAiAnalyze} 
                      disabled={loadingAi}
                      className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                    >
                      {loadingAi ? (
                          <>
                            <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                            Analyzing Deal...
                          </>
                      ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Run Analysis
                          </>
                      )}
                    </button>
                  )}
               </div>
               
               {aiAnalysis && (
                 <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 text-sm leading-relaxed animate-in fade-in duration-700 border border-white/10">
                    <div className="prose prose-invert max-w-none">
                        {aiAnalysis.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                    </div>
                 </div>
               )}
               {!aiAnalysis && !loadingAi && (
                 <p className="text-blue-100 text-sm max-w-2xl opacity-80">
                    Click to generate a comprehensive risk assessment, arbitrage opportunity detection, and economic rationale analysis for this specific swap structure using enterprise-grade cloud models.
                 </p>
               )}
           </div>
        </div>
      </section>

      {/* Visuals */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Leg Analysis</h2>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-6">
              <div>
                  <h3 className="font-bold text-lg text-gray-900">Leg 1 ({deal.leg1.currency})</h3>
                  <p className="text-sm text-gray-500">{deal.leg1.type} @ {deal.leg1.rate}%</p>
              </div>
              <span className="text-positive font-bold bg-green-50 px-3 py-1 rounded-full text-sm border border-green-100">
                  NPV: {deal.leg1.currency} {result.leg1Npv.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
           </div>
           <div className="h-56 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={curveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="leg1" stroke="#28a745" strokeWidth={3} fillOpacity={1} fill="url(#colorLeg1)" name="Yield Curve %" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           <p className="text-gray-500 text-xs mt-4 text-center font-medium uppercase tracking-wide">Yield Curve Projection (5Y)</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-6">
              <div>
                  <h3 className="font-bold text-lg text-gray-900">Leg 2 ({deal.leg2.currency})</h3>
                  <p className="text-sm text-gray-500">{deal.leg2.type} @ {deal.leg2.rate}%</p>
              </div>
              <span className="text-negative font-bold bg-red-50 px-3 py-1 rounded-full text-sm border border-red-100">
                  NPV: {deal.leg2.currency} {result.leg2Npv.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
           </div>
           <div className="h-56 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={curveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="leg2" stroke="#dc3545" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} name="Yield Curve %" />
               </LineChart>
             </ResponsiveContainer>
           </div>
           <p className="text-gray-500 text-xs mt-4 text-center font-medium uppercase tracking-wide">Yield Curve Projection (5Y)</p>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowCashflows(!showCashflows)}>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Detailed Cashflow</h3>
              <p className="text-gray-500 text-sm">Projected flows for each leg.</p>
            </div>
            <div className={`bg-gray-100 p-2 rounded-full transition-transform duration-300 ${showCashflows ? 'rotate-180' : ''}`}>
                <span className="material-symbols-outlined text-gray-600">expand_more</span>
            </div>
         </div>
         
         {showCashflows && (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold tracking-wide">
                 <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4 text-right">Leg 1 ({deal.leg1.currency})</th>
                   <th className="px-6 py-4 text-right">Leg 2 ({deal.leg2.currency})</th>
                   <th className="px-6 py-4 text-right">Discount Factor</th>
                   <th className="px-6 py-4 text-right">PV (USD Eq)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {result.cashflows.map((row, idx) => (
                   <tr key={idx} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 font-medium text-gray-900">{row.date}</td>
                     <td className="px-6 py-4 text-right text-positive font-medium font-mono tracking-tight">{row.leg1Flow.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                     <td className="px-6 py-4 text-right text-negative font-medium font-mono tracking-tight">{row.leg2Flow.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                     <td className="px-6 py-4 text-right text-gray-500 font-mono">{row.discountFactor.toFixed(4)}</td>
                     <td className="px-6 py-4 text-right text-gray-900 font-medium font-mono">{row.presentValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </section>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentPage, setPage] = useState<Page>(Page.DASHBOARD);
  const [currentDeal, setCurrentDeal] = useState<SwapDeal | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  
  // Initial Mock Data
  const [deals, setDeals] = useState<SwapDeal[]>([
      { 
          id: 'SWP-001', 
          status: 'Active',
          valueDate: '2024-01-01',
          startDate: '2024-01-03',
          endDate: '2025-12-31',
          leg1: { currency: 'BRL', notional: 5000000, rate: 1.1, type: 'Floating', frequency: 'Quarterly', convention: 'Actual/365' },
          leg2: { currency: 'USD', notional: 1000000, rate: 4.5, type: 'Fixed', frequency: 'Semi-Annual', convention: '30/360' }
      },
      { 
          id: 'SWP-002', 
          status: 'Active',
          valueDate: '2024-02-15',
          startDate: '2024-02-17',
          endDate: '2026-06-15',
          leg1: { currency: 'EUR', notional: 2500000, rate: 0.5, type: 'Floating', frequency: 'Semi-Annual', convention: 'Actual/360' },
          leg2: { currency: 'JPY', notional: 350000000, rate: 0.1, type: 'Fixed', frequency: 'Annual', convention: 'Actual/365' }
      },
      { 
          id: 'SWP-003', 
          status: 'Pending',
          valueDate: '2023-08-29',
          startDate: '2023-09-01',
          endDate: '2024-09-01',
          leg1: { currency: 'GBP', notional: 1000000, rate: 1.5, type: 'Fixed', frequency: 'Annual', convention: 'Actual/365' },
          leg2: { currency: 'AUD', notional: 1800000, rate: 3.2, type: 'Floating', frequency: 'Quarterly', convention: 'Actual/365' }
      }
  ]);

  const handleCalculate = (inputDeal: SwapDeal) => {
    // 1. Generate ID
    const newId = `SWP-${(deals.length + 1).toString().padStart(3, '0')}`;
    
    // 2. Calculate Logic
    const cashflows = generateSmartCashflows(inputDeal);
    
    // Calculate rudimentary NPV sums from generated flows
    const sumPv = cashflows.reduce((acc, row) => acc + row.presentValue, 0);
    const leg1Sum = cashflows.reduce((acc, row) => acc + row.leg1Flow, 0); // This is raw sum, typically we'd discount
    const leg2Sum = cashflows.reduce((acc, row) => acc + row.leg2Flow, 0);

    // Approximating realistic principal based on Leg 2 Notional
    const principal = inputDeal.leg2.notional;
    
    const result: PricingResult = {
      npvTotal: sumPv,
      npvTotalFormatted: `USD ${sumPv.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      spread: Math.abs(inputDeal.leg1.rate - inputDeal.leg2.rate) * 100, // Simple spread calc
      principal: principal,
      leg1Npv: leg1Sum, // Displaying raw sum for demo visualization
      leg2Npv: leg2Sum,
      cashflows: cashflows
    };
    
    const newDeal = { ...inputDeal, id: newId, status: 'Active' as const };
    
    // 3. Update State
    setDeals(prev => [newDeal, ...prev]);
    setCurrentDeal(newDeal);
    setPricingResult(result);
    
    // 4. Navigate
    setPage(Page.RESULTS);
  };

  return (
    <div className="flex min-h-screen w-full bg-background-light font-display text-gray-900">
      <Sidebar currentPage={currentPage} setPage={setPage} />
      <div className="flex flex-col flex-1 w-full h-screen overflow-hidden">
        <MobileHeader setPage={setPage} />
        <main className="flex-1 overflow-y-auto scroll-smooth">
           {currentPage === Page.DASHBOARD && <Dashboard setPage={setPage} deals={deals} />}
           {currentPage === Page.PRICER && <PricerForm onCalculate={handleCalculate} />}
           {currentPage === Page.RESULTS && currentDeal && pricingResult && <ResultsPage deal={currentDeal} result={pricingResult} />}
        </main>
      </div>
    </div>
  );
};

export default App;
