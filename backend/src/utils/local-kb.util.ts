/**
 * Local Knowledge Base for EcoBot
 * Intercepts common, predictable queries (greetings, FAQs) to return instant (<50ms)
 * responses without consuming Gemini API quotas or adding latency.
 */

const GREETINGS = [
  "hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste"
];

const GRATITUDE = [
  "thank you", "thanks", "tysm", "appreciate it"
];

export function getLocalResponse(message: string): string | null {
  if (!message) return null;
  const msg = message.toLowerCase().trim();

  // 1. Instant Greetings
  if (GREETINGS.includes(msg)) {
    return "Hello! I'm EcoBot. How can I help you with your waste segregation or sustainability goals today?";
  }

  // 2. Instant Gratitude
  if (GRATITUDE.includes(msg)) {
    return "You're very welcome! Keep up the great green work. 🌍 Let me know if you have more questions.";
  }

  // 3. IWIS Core Mechanics FAQs
  if (msg.includes("what is iwis") || msg.includes("how does iwis work")) {
    return "IWIS (Integrated Waste Intelligence System) helps you classify waste, track your carbon footprint, and earn Green Points. You can scan waste items, view your history, compete on the leaderboard, and trade bulk waste on the Circular Exchange marketplace!";
  }

  if (msg.includes("green points") || msg.includes("how to earn points") || msg.includes("what are green points")) {
    return "You earn Green Points on IWIS by correctly segregating and scanning your waste! Every time you scan an item, we calculate the CO₂ you saved from landfills and reward you with points. You can use these points to level up your tier on the Leaderboard.";
  }

  if (msg.includes("what is circular exchange") || msg.includes("sell waste") || msg.includes("marketplace")) {
    return "The Circular Exchange is a marketplace within IWIS. If you accumulate bulk waste (like 5kg of plastic or old electronics), you can list it on the exchange. Certified recyclers can bid on your listing and arrange a pickup, creating a circular economy!";
  }

  // 4. Common Waste Segregation FAQs
  if (msg.includes("how to compost") || msg.includes("what is composting")) {
    return "Composting is nature's recycling! You can compost fruit peels, vegetable scraps, coffee grounds, and dry leaves. Keep it moist and aerated. DO NOT compost meat, dairy, or oily foods as they attract pests.";
  }

  if (msg.includes("e-waste") || msg.includes("electronic waste") || msg.includes("how to dispose laptop") || msg.includes("old phone")) {
    return "E-waste (electronic waste) contains hazardous materials like lead and mercury, but also valuable metals like gold. NEVER throw it in normal trash. Look for certified e-waste recyclers in your city, or list bulk e-waste on the IWIS Circular Exchange for proper disposal.";
  }
  
  if (msg.includes("plastic recycling") || msg.includes("can i recycle plastic")) {
    return "Most rigid plastics (like water bottles and detergent jugs - usually types 1 and 2) are widely recycled. Soft plastics (like grocery bags or bubble wrap) usually require special drop-off points. Always rinse containers before recycling them!";
  }

  // No local match found - proceed to Gemini
  return null;
}
