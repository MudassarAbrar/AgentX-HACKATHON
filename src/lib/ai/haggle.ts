import { getGeminiModel } from "./gemini-client";
import { supabase } from "@/lib/supabase";

export interface HaggleResult {
  success: boolean;
  couponCode?: string;
  discount: number;
  message: string;
  reason?: string;
}

/**
 * Analyze user's haggle request and determine discount eligibility
 */
export async function analyzeHaggleRequest(
  userMessage: string
): Promise<{
  eligible: boolean;
  discountPercent: number;
  reason: string;
  sentiment: "positive" | "neutral" | "negative";
}> {
  try {
    const model = getGeminiModel("gemini-2.5-flash");
    
    if (!model) {
      // Fallback logic when Gemini is not available
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes("birthday") || lowerMessage.includes("first time") || lowerMessage.includes("bulk")) {
        return {
          eligible: true,
          discountPercent: 10,
          reason: "Special occasion",
          sentiment: "positive",
        };
      }
      return {
        eligible: false,
        discountPercent: 0,
        reason: "Request not eligible",
        sentiment: "neutral",
      };
    }
    
    const prompt = `Analyze this customer request for a discount and determine:
1. Is the request reasonable and polite? (true/false)
2. What discount percentage should be offered? (5, 10, 15, or 20)
3. What is the reason given? (extract key reason)
4. What is the sentiment? (positive, neutral, or negative)

Customer message: "${userMessage}"

Respond in JSON format only:
{
  "eligible": true/false,
  "discountPercent": number (5-20),
  "reason": "extracted reason",
  "sentiment": "positive" | "neutral" | "negative"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse JSON response
    let analysis: any = {
      eligible: false,
      discountPercent: 0,
      reason: "",
      sentiment: "neutral",
    };

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("[Haggle] Failed to parse Gemini response, using fallback");
      // Fallback: check for common good reasons
      const lowerMessage = userMessage.toLowerCase();
      if (
        lowerMessage.includes("birthday") ||
        lowerMessage.includes("first time") ||
        lowerMessage.includes("bulk") ||
        lowerMessage.includes("multiple")
      ) {
        analysis = {
          eligible: true,
          discountPercent: 10,
          reason: "Special occasion",
          sentiment: "positive",
        };
      }
    }

    // If user is rude, make them ineligible
    if (analysis.sentiment === "negative" || !analysis.eligible) {
      return {
        eligible: false,
        discountPercent: 0,
        reason: analysis.reason || "Request not eligible",
        sentiment: analysis.sentiment || "neutral",
      };
    }

    return analysis;
  } catch (error) {
    console.error("[Haggle] Error analyzing request:", error);
    return {
      eligible: false,
      discountPercent: 0,
      reason: "Unable to process request",
      sentiment: "neutral",
    };
  }
}

/**
 * Generate a unique coupon code
 */
function generateCouponCode(reason: string, discount: number): string {
  // Extract key words from reason
  const keywords = reason
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 2);

  // Create code prefix from keywords or use default
  let prefix = "SPECIAL";
  if (keywords.length > 0) {
    prefix = keywords
      .map((w) => w.substring(0, 3).toUpperCase())
      .join("");
  }

  // Common prefixes for known reasons
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes("birthday")) prefix = "BDAY";
  if (lowerReason.includes("first")) prefix = "WELCOME";
  if (lowerReason.includes("bulk")) prefix = "BULK";
  if (lowerReason.includes("love") || lowerReason.includes("valentine"))
    prefix = "LOVE";

  // Add discount and random suffix
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${discount}${suffix}`;
}

/**
 * Create coupon in database
 */
async function createCoupon(
  code: string,
  discountType: "percentage" | "fixed",
  discountValue: number,
  reason: string,
  validDays: number = 30
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const now = new Date();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  const { error } = await supabase.from("coupons").insert({
    code: code.toUpperCase(),
    discount_type: discountType,
    discount_value: discountValue,
    valid_from: now.toISOString(),
    valid_until: validUntil.toISOString(),
    usage_limit: 1, // Single use coupon
    used_count: 0,
    created_by_agent: true,
    reason,
  });

  if (error) {
    console.error("[Haggle] Error creating coupon:", error);
    return false;
  }

  return true;
}

/**
 * Main haggle function - processes discount request and generates coupon
 */
export async function processHaggle(
  userMessage: string,
  sessionId: string
): Promise<HaggleResult> {
  // Analyze the request
  const analysis = await analyzeHaggleRequest(userMessage);

  if (!analysis.eligible) {
    return {
      success: false,
      discount: 0,
      message:
        analysis.sentiment === "negative"
          ? "I appreciate your interest, but I'm not able to offer a discount at this time. Is there anything else I can help you with?"
          : "I understand your request, but I'm not able to offer a discount for this purchase. However, I'd be happy to help you find great products within your budget!",
    };
  }

  // Generate coupon code
  const couponCode = generateCouponCode(analysis.reason, analysis.discountPercent);

  // Create coupon in database
  const created = await createCoupon(
    couponCode,
    "percentage",
    analysis.discountPercent,
    analysis.reason
  );

  if (!created) {
    return {
      success: false,
      discount: 0,
      message:
        "I tried to create a discount for you, but encountered an issue. Please try again later.",
    };
  }

  // Determine friendly message based on reason
  let friendlyMessage = "";
  const lowerReason = analysis.reason.toLowerCase();
  
  if (lowerReason.includes("birthday")) {
    friendlyMessage = `Happy Birthday! 🎉 I've created a special ${analysis.discountPercent}% discount code just for you: **${couponCode}**. Use it at checkout!`;
  } else if (lowerReason.includes("first")) {
    friendlyMessage = `Welcome to TrendZone! 🎊 As a first-time customer, here's a ${analysis.discountPercent}% discount: **${couponCode}**. Enjoy your shopping!`;
  } else if (lowerReason.includes("bulk") || lowerReason.includes("multiple")) {
    friendlyMessage = `I appreciate your interest in multiple items! Here's a ${analysis.discountPercent}% discount code: **${couponCode}**. Use it at checkout!`;
  } else {
    friendlyMessage = `I'd be happy to help! I've created a ${analysis.discountPercent}% discount code for you: **${couponCode}**. Use it at checkout to save!`;
  }

  return {
    success: true,
    couponCode,
    discount: analysis.discountPercent,
    message: friendlyMessage,
    reason: analysis.reason,
  };
}
