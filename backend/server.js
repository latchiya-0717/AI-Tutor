require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const gTTS = require("gtts");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: Missing Gemini API Key in .env file!");
    process.exit(1);
}

console.log("✅ Using API Key");

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

const genAI = new GoogleGenerativeAI(apiKey);

// ✅ Serve static files from "public" directory
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
app.use(express.static(publicDir));

/* --------------------- AI Chatbot --------------------- */
app.post("/api/ask", async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message content is required and must be a string!" });
    }
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            { contents: [{ parts: [{ text: message }] }] },
            { headers: { "Content-Type": "application/json" } }
        );
        const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
        res.json({ reply: replyText });
    } catch (error) {
        console.error("🚨 Gemini API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "❌ Unable to get a response. Please try again!" });
    }
});

/* --------------------- Extract Key Concepts --------------------- */
app.post("/api/extract-concepts", async (req, res) => {
    try {
        const { summary } = req.body;
        if (!summary) {
            return res.status(400).json({ error: "Summary is required" });
        }
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent({
            contents: [{ parts: [{ text: `Extract the key concepts from this summary:\n${summary}` }] }]
        });
        const concepts = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No concepts found.";
        res.json({ concepts });
    } catch (error) {
        console.error("❌ Error extracting concepts:", error);
        res.status(500).json({ error: "Failed to extract key concepts." });
    }
});

/* --------------------- Generate Explanation --------------------- */
app.post("/api/generate-explanation", async (req, res) => {
    try {
        const { concepts } = req.body;
        if (!concepts) {
            return res.status(400).json({ error: "Concepts are required" });
        }
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent({
            contents: [{ parts: [{ text: `Create a short spoken explanation based on these key concepts:\n${concepts}` }] }]
        });
        const explanation = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation generated.";
        res.json({ explanation });
    } catch (error) {
        console.error("❌ Error generating explanation:", error);
        res.status(500).json({ error: "Failed to generate explanation." });
    }
});

/* --------------------- Convert Text to Speech --------------------- */
app.post("/api/text-to-speech", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const filePath = path.join(publicDir, "spoken_explanation.mp3");
        const gtts = new gTTS(text, "en");
        gtts.save(filePath, (err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to generate speech." });
            }
            res.json({ audioUrl: `http://localhost:${PORT}/spoken_explanation.mp3` });
        });
    } catch (error) {
        console.error("❌ Speech generation failed:", error);
        res.status(500).json({ error: "Speech generation failed." });
    }
});

/* --------------------- Start Server --------------------- */
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
