import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Smart Reply Endpoint
  app.post("/api/ai/suggest-reply", async (req, res) => {
    const { emailSubject, emailBody, sender, tone = "professional", intent = "reply" } = req.body;

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You are a high-level executive assistant drafting an email response for an online business.
Sender: ${sender || "Client"}
Subject: ${emailSubject || "No Subject"}
Incoming Message:
${emailBody || "N/A"}

Goal: Generate a concise, effective ${tone} response focusing on ${intent}.
Format: Return only the body of the response ready to send, including a placeholder for sender name if needed, without extra meta commentary.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const reply = response.text?.trim();
        if (reply) {
          return res.json({ reply, generatedBy: "gemini-3.8-flash" });
        }
      } catch (error: any) {
        console.error("Gemini API suggestion failed, falling back to heuristic:", error?.message);
      }
    }

    // Heuristic fallbacks for offline / without API key
    let fallbackReply = "";
    if (tone === "quick") {
      fallbackReply = `Hi ${sender ? sender.split("@")[0] : "there"},\n\nThank you for reaching out. I've received your email regarding "${emailSubject || "our conversation"}" and am currently reviewing the details. I will get back to you with an update shortly.\n\nBest regards,\nExecutive Team`;
    } else if (tone === "meeting") {
      fallbackReply = `Hi ${sender ? sender.split("@")[0] : "there"},\n\nThanks for your note! I would be delighted to connect and discuss "${emailSubject || "the project"}" further. \n\nAre you available for a brief 20-minute discussion this Tuesday at 10:00 AM or Thursday at 2:00 PM? Alternatively, feel free to pick a time directly on our scheduling calendar.\n\nLooking forward to speaking,\nBusiness Development`;
    } else if (tone === "quote") {
      fallbackReply = `Hi ${sender ? sender.split("@")[0] : "there"},\n\nThank you for your interest in our business services. Based on your note regarding "${emailSubject || "your request"}", we would love to assemble a tailored proposal and scope of work.\n\nCould you briefly share your expected timeline and key objectives? We will prepare the commercial breakdown right away.\n\nWarm regards,\nClient Solutions`;
    } else {
      fallbackReply = `Hello ${sender ? sender.split("@")[0] : "there"},\n\nThank you for getting in touch regarding "${emailSubject || "your inquiry"}". We appreciate your patience and will thoroughly review the information provided.\n\nWe prioritize prompt, dedicated client communication and will follow up with actionable next steps within one business day.\n\nSincerely,\nOperations & Client Success`;
    }

    return res.json({ reply: fallbackReply, generatedBy: "rule-engine" });
  });

  // AI Lead Intelligence Endpoint
  app.post("/api/ai/analyze-lead", async (req, res) => {
    const { emailSubject, emailBody, sender } = req.body;

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `Analyze this incoming business email to extract CRM lead intelligence.
Sender: ${sender}
Subject: ${emailSubject}
Body:
${emailBody}

Output valid JSON strictly with this schema:
{
  "leadScore": <number between 1 and 100>,
  "estimatedDealValue": <number in USD>,
  "recommendedStage": "New Lead" | "Qualified" | "Proposal Sent" | "Negotiation",
  "sentiment": "Positive" | "Neutral" | "Urgent" | "Concerned",
  "keyNeeds": ["need1", "need2"],
  "suggestedNextAction": "<string concise next step>"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const text = response.text?.trim() || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ analysis: parsed, source: "gemini" });
        }
      } catch (err: any) {
        console.error("Lead analysis failed with AI:", err?.message);
      }
    }

    // Heuristic fallback analysis
    const hasPricing = /pricing|quote|cost|budget|package|deal/i.test(`${emailSubject} ${emailBody}`);
    const hasUrgent = /urgent|asap|immediately|deadline|soon/i.test(`${emailSubject} ${emailBody}`);
    const estimatedDealValue = hasPricing ? 12500 : 5000;
    const leadScore = hasUrgent ? 88 : hasPricing ? 78 : 64;

    return res.json({
      analysis: {
        leadScore,
        estimatedDealValue,
        recommendedStage: hasPricing ? "Qualified" : "New Lead",
        sentiment: hasUrgent ? "Urgent" : "Positive",
        keyNeeds: ["Solution consultation", "Commercial proposal"],
        suggestedNextAction: "Send personalized portfolio & book 15-min discovery call.",
      },
      source: "rule-engine",
    });
  });

  // Cloud Synchronization Endpoint
  app.post("/api/sync", (req, res) => {
    const { queueLength, lastSyncTimestamp } = req.body;
    res.json({
      success: true,
      syncId: "sync_" + Math.random().toString(36).substring(2, 9),
      processedItems: queueLength || 0,
      serverTime: new Date().toISOString(),
      previousSync: lastSyncTimestamp || null,
    });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Business Mail & CRM Server running on port ${PORT}`);
  });
}

startServer();
