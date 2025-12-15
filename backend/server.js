
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get("/", (_req, res) => {
  res.send("OK");
});
app.get("/ping", (_req, res) => {
  res.json({ status: "ok" });
});

// Gemini呼び出し (Flash)
app.post("/api/gemini", async (req, res) => {
  const { prompt, temperature, maxTokens } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set" });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

   

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:
            typeof temperature === "number" ? temperature : 0.7,
          maxOutputTokens:
            typeof maxTokens === "number" ? maxTokens : 512
        }
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // ログ
    console.log("Geminiレスポンス:", JSON.stringify(response.data, null, 2));

    // 安全にテキスト抽出
    const candidate = response.data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts
      .map(p => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim();

    const safeText =
      text ||
      (candidate?.finishReason
        ? `[no text] finishReason=${candidate.finishReason}`
        : "[no text]");

    res.json({
      text: safeText,
      finishReason: candidate?.finishReason || null,
      usageMetadata: response.data?.usageMetadata || null,
      modelVersion: response.data?.modelVersion || null
    });
  } catch (err) {
    console.error(
      "Gemini APIエラー詳細:",
      err.response?.status,
      err.response?.data || err.message
    );
    res.status(500).json({ error: err.message });
  }
});

// Groq呼び出し
app.post("/api/groq", async (req, res) => {
  const { prompt } = req.body;

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not set" });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Groq APIエラー:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// OpenAI呼び出し
app.post("/api/openai", async (req, res) => {
  const { prompt, temperature, maxTokens } = req.body;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: typeof temperature === "number" ? temperature : 0.7,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 512
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("OpenAI APIエラー:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// 起動（ここが必ず最後に存在していること）
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 起動時の未処理例外を見逃さない
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});




// import express from "express";
// import axios from "axios";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());


// // Gemini呼び出し (Flash版)
// app.post("/api/gemini", async (req, res) => {
//   const { prompt, temperature, maxTokens } = req.body;

//   try {
//     console.log("Geminiキー:", process.env.GEMINI_API_KEY);

//     const apiKey = process.env.GEMINI_API_KEY;
//     // Flashモデルを指定
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

//     const response = await axios.post(
//       url,
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: {
//           temperature: typeof temperature === "number" ? temperature : 0.7,
//           maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 512
//         }
//       },
//       {
//         headers: { "Content-Type": "application/json" }
//       }
//     );

//     // レスポンス構造を確認用にログ出力
//     console.log("Geminiレスポンス:", JSON.stringify(response.data, null, 2));

//     // 安全にテキスト抽出
//     const candidate = response.data?.candidates?.[0];
//     const parts = candidate?.content?.parts || [];
//     const text = parts
//       .map(p => (typeof p.text === "string" ? p.text : ""))
//       .join("")
//       .trim();

//     const safeText =
//       text ||
//       (candidate?.finishReason
//         ? `[no text] finishReason=${candidate.finishReason}`
//         : "[no text]");

//     res.json({ text: safeText });
//   } catch (err) {
//     console.error(
//       "Gemini APIエラー詳細:",
//       err.response?.status,
//       err.response?.data || err.message
//     );
//     res.status(500).json({ error: err.message });
//   }
// });

// // Groq呼び出し
// // Groq用エンドポイント
// app.post("/api/groq", async (req, res) => {
//   const { prompt } = req.body;

//   try {
//     const apiKey = process.env.GROQ_API_KEY; // .envからキーを読み込む

//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/chat/completions",
//       {
//         model: "llama-3.3-70b-versatile", // Groqが提供するモデル名（例）
//         messages: [{ role: "user", content: prompt }]
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${apiKey}`, // ←ここでキーを渡す
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     // GroqはOpenAI互換なので、応答は choices[0].message.content に入っています
//     res.json(response.data);
//   } catch (err) {
//     console.error("Groq APIエラー:", err.response?.data || err.message);
//     res.status(500).json({ error: err.message });
//   }
// });


// app.post("/api/openai", async (req, res) => {
//   const { prompt, temperature, maxTokens } = req.body;

//   try {
//     const apiKey = process.env.OPENAI_API_KEY;

//     const response = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-3.5-turbo",
//         messages: [{ role: "user", content: prompt }],
//         temperature: temperature || 0.7,
//         max_tokens: maxTokens || 526
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     res.json(response.data);
//   } catch (err) {
//     console.error("OpenAI APIエラー:", err.response?.data || err.message);
//     res.status(500).json({ error: err.message });
//   }
// });