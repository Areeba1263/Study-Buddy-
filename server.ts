import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // Helper function to get Gemini instance safely
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Route 1: Explain Simply
  app.post("/api/explain", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({
          error: "Arey bhai! Pehle koi topic, notes ya paragraph to paste karo! 📝",
        });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are "Senior Buddy", an experienced, extremely friendly, encouraging senior university student in Pakistan.
Your mission is to explain complex academic concepts to junior students who are struggling before exams.

Guidelines for explanation style:
1. Explain in clear, simple language mixing standard English with common Roman Urdu phrases used by Pakistani university students (e.g. "Suno bhai...", "Bohot simple baat hai...", "Basically hota yeh hai ke...", "Exam point of view se yeh bohot important hai", "Tension bilkul nahi lena!", "Example ke tor par...", "Samajh aayi baat?").
2. Keep the tone warm, approachable, confident, and empathetic like a senior sitting next to a junior in the university library or canteen with a cup of chai.
3. Structure the explanation logically so it is ultra easy to digest quickly before exams.

Format requirements:
Return strictly JSON matching the required schema. Include:
- title: Short descriptive topic name
- oneLineSummary: A punchy 1-sentence quick summary
- explanation: Detailed simple explanation divided into clear paragraphs/steps with Roman Urdu touches
- realLifeAnalogy: A relatable real-life example or Pakistani context analogy (e.g., canteen biryani line, local traffic, WhatsApp group admins, cricket overs)
- seniorTips: 1-2 practical tips for exam scoring or common traps to avoid
- keyTakeaways: 3 to 4 quick bullet points for final revision`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Please explain this topic/notes like a friendly senior student:\n\n${topic.trim()}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              oneLineSummary: { type: Type.STRING },
              explanation: { type: Type.STRING },
              realLifeAnalogy: { type: Type.STRING },
              seniorTips: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "title",
              "oneLineSummary",
              "explanation",
              "realLifeAnalogy",
              "seniorTips",
              "keyTakeaways",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content generated from Gemini.");
      }

      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);
    } catch (err: any) {
      console.error("Error in /api/explain:", err);
      const errorMessage =
        err?.message?.includes("GEMINI_API_KEY")
          ? "API Key error: GEMINI_API_KEY is not properly configured."
          : "Koi masala ho gaya AI response generate karte huay. Please check your text and try again! ⚠️";
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Route 2: Generate Quiz
  app.post("/api/quiz", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({
          error: "Arey bhai! Pehle koi topic, notes ya paragraph to paste karo! 📝",
        });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a university exam question paper setter in Pakistan.
Based on the provided topic or lecture notes, construct exactly 5 high-quality, relevant Multiple-Choice Questions (MCQs) for university students preparing for midterms/finals.

Guidelines for Quiz generation:
1. Generate exactly 5 questions that directly test key concepts from the input text.
2. Provide exactly 4 options per question.
3. Mark the zero-based index (0, 1, 2, or 3) of the correct option in "correctAnswerIndex".
4. Provide a helpful, clear 1-2 sentence explanation of why the correct option is right, written in simple English with a friendly Roman Urdu encouragement (e.g. "Sahi jawab! Because...", "Exam point of view: ...").

Return strictly JSON matching the specified schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Generate a 5-question MCQ practice quiz based on this study topic/notes:\n\n${topic.trim()}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: [
                    "id",
                    "question",
                    "options",
                    "correctAnswerIndex",
                    "explanation",
                  ],
                },
              },
            },
            required: ["topicTitle", "questions"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content generated from Gemini.");
      }

      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);
    } catch (err: any) {
      console.error("Error in /api/quiz:", err);
      const errorMessage =
        err?.message?.includes("GEMINI_API_KEY")
          ? "API Key error: GEMINI_API_KEY is not properly configured."
          : "Quiz generate karte waqt error aaya. Please try again! ⚠️";
      return res.status(500).json({ error: errorMessage });
    }
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Study Buddy server running on http://localhost:${PORT}`);
  });
}

startServer();
