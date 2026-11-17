function getStepLogger(manager) {
    try {
        if (manager && typeof manager.getLogger === "function") {
            return manager.getLogger();
        }
    }
    catch (_error) {
        // Ignore and fall back to console logger.
    }
    return {
        info: function (message) { if (typeof console !== "undefined" && console.log) { console.log(message); } },
        warn: function (message) { if (typeof console !== "undefined" && console.warn) { console.warn(message); } },
        error: function (message) { if (typeof console !== "undefined" && console.error) { console.error(message); } },
        severe: function (message) { if (typeof console !== "undefined" && console.error) { console.error(message); } }
    };
}

/**
 * STEP Business Rule
 * Trademark: AI Labz Ltd (TM)
 * Purpose: Describe the rule intent and expected side effects.
 * Notes: Keep transactions short and avoid repeated writes in loops.
 *
 * @param {JavaUtilLoggingLogger} log - Alias for logger, provided by STEP.
 * @returns {void} Top-level business rule scripts do not return a value - effects are applied directly via node/manager writes.
 */

import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static("public"));

const prompts = {
  assistant:
    "Чи ANCLOUS AI нэртэй Монгол хэлний AI туслах. Ойлгомжтой, үнэн зөв, хэрэгтэй хариулт өг.",
  typo:
    "Өгсөн Монгол бичвэрийн зөв бичих дүрэм, үг үсэг, найруулгыг засаад зөв хувилбарыг гарга. Утгыг өөрчилж болохгүй.",
  coding:
    "Чи программчлалын багш. Кодыг алхам алхмаар тайлбарлаж, ажиллах жишээ өг.",
  learning:
    "Чи найрсаг багш. Сэдвийг энгийнээр, алхам алхмаар тайлбарлаж, жишээ ашигла.",
  design:
    "Чи UI/UX дизайнер. Өнгө, зохиомж, typography, хэрэглэгчийн туршлагын талаар тодорхой зөвлөгөө өг."
};

app.post("/api/chat", async (req, res) => {
  try {
    const { message, mode = "assistant" } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Асуултаа эхлээд бичнэ үү."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Таны бичвэр 4000 тэмдэгтээс хэтэрлээ."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY тохируулаагүй байна. .env файлаа шалгана уу."
      });
    }

    const systemPrompt = prompts[mode] || prompts.assistant;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error details:", data);
      return res.status(502).json({
        error: "AI хүсэлт амжилтгүй боллоо. API key болон тохиргоогоо шалгана уу."
      });
    }

    const answer =
      data.choices?.[0]?.message?.content || "Хариу олдсонгүй. Дахин оролдоно уу.";

    return res.json({ answer });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Сервертэй холбогдоход алдаа гарлаа."
    });
  }
});

app.listen(PORT, () => {
  console.log(`ANCLOUS AI ажиллаж байна: http://localhost:${PORT}`);
});
