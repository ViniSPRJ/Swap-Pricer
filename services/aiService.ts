import { GoogleGenAI } from "@google/genai";
import { SwapDeal, PricingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSwapDeal = async (deal: SwapDeal, result: PricingResult): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. Unable to perform AI analysis.";
  }

  const prompt = `
    Act as a senior financial derivative analyst. Analyze the following Cross-Currency Swap deal and its pricing results.
    
    **Deal Parameters:**
    - Maturity: ${deal.startDate} to ${deal.endDate}
    - Leg 1 (Payer): ${deal.leg1.currency} ${deal.leg1.notional.toLocaleString()} @ ${deal.leg1.rate}% (${deal.leg1.type})
    - Leg 2 (Receiver): ${deal.leg2.currency} ${deal.leg2.notional.toLocaleString()} @ ${deal.leg2.rate}% (${deal.leg2.type})

    **Pricing Results:**
    - Total NPV: ${result.npvTotalFormatted}
    - Spread: ${result.spread} bps
    - Leg 1 NPV: ${deal.leg1.currency} ${result.leg1Npv.toLocaleString()}
    - Leg 2 NPV: ${deal.leg2.currency} ${result.leg2Npv.toLocaleString()}

    **Instructions:**
    1. Briefly explain the economic rationale of this trade.
    2. Highlight any arbitrage opportunities or risks based on the NPV.
    3. Comment on the interest rate differential.
    4. Keep it concise (under 150 words) and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Failed to generate analysis. Please check your connection or API limits.";
  }
};
