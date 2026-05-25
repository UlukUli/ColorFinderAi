// routes/ai.js
const express = require("express");
const router  = express.Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // убираем хардкод
const MODEL = "claude-sonnet-4-6";
console.log("KEY:", ANTHROPIC_API_KEY ? "есть" : "UNDEFINED");

router.post("/ask", async (req, res) => {
  const { prompt, system } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "prompt is required" });
  }

  console.log("=== AI REQUEST ===");
  console.log("Prompt:", prompt);
  console.log("System:", system);

  try {
    const body = {
      model:     MODEL,
      max_tokens: 500,
      messages:  [{ role: "user", content: prompt }],
    };

    // Добавляем system только если он не пустой
    if (system && system.trim()) {
      body.system = system;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("=== AI RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("AI API error:", data);
      return res.status(response.status).json({ message: data.error?.message || "AI error" });
    }

    const text = data.content.map(b => b.text || "").join("");
    console.log("=== EXTRACTED TEXT ===");
    console.log(text);

    res.json({ text });

  } catch (err) {
    console.error("AI proxy error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;