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

export const generatePricingCode = async (deal: SwapDeal, language: 'python' | 'cpp'): Promise<string> => {
  if (!process.env.API_KEY) {
    return "// API Key missing. Unable to generate code.";
  }

  const lib = language === 'python' ? 'QuantLib-Python' : 'QuantLib C++';
  // Note: We escape the backticks in the prompt instructions to ensure valid JS string parsing
  const prompt = `
    Act as a Quantitative Developer. Write a complete, executable ${language} script using ${lib} to price the following Cross-Currency Swap.

    **Instrument Details:**
    - Start Date: ${deal.startDate}
    - End Date: ${deal.endDate}
    - Valuation Date: ${deal.valueDate}
    
    **Leg 1 (Payer):**
    - Currency: ${deal.leg1.currency}
    - Notional: ${deal.leg1.notional}
    - Rate: ${deal.leg1.rate}%
    - Type: ${deal.leg1.type}
    - Frequency: ${deal.leg1.frequency}
    - Day Count: ${deal.leg1.convention}

    **Leg 2 (Receiver):**
    - Currency: ${deal.leg2.currency}
    - Notional: ${deal.leg2.notional}
    - Rate: ${deal.leg2.rate}%
    - Type: ${deal.leg2.type}
    - Frequency: ${deal.leg2.frequency}
    - Day Count: ${deal.leg2.convention}

    **Requirements:**
    1. Include necessary imports.
    2. Mock/Bootstrap simple flat yield curves for both currencies (assume reasonable rates, e.g., 3% and 1.5%).
    3. Setup the Schedule and VanillaSwap (or CrossCurrencySwap if available in the specific library version, otherwise model as two legs).
    4. Setup a PricingEngine.
    5. Print the NPV.
    6. Add comments explaining the steps.
    7. Do not use markdown formatting (\`\`\`), just return raw code.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let text = response.text || "// No code generated.";
    // Clean up markdown code blocks if the model adds them despite instructions
    text = text.replace(/```[a-z]*\n/g, '').replace(/```/g, '');
    return text;
  } catch (error) {
    console.error("Code generation failed:", error);
    return "// Failed to generate code. Please check your connection.";
  }
};