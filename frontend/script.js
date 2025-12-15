

$(function(){
  // -----------------------------
  // イベントハンドラ
  // -----------------------------
 $("#askBtn").on("click",async function () {
    const prompt =$("#prompt").val().trim();
    const temperature = parseFloat($("#temperature").val());
    const maxTokens = parseInt($("#maxTokens").val(), 10);

    if(!prompt){
        $("#statusLine").text("プロンプトが未入力です");
        console.log("入力エラー: promptが空");
        return;
    }

    $("#statusLine").text("送信中...");
    console.log("送信開始:",{prompt,temperature,maxTokens});

 Promise.all([
      callGeminiAPI(prompt, temperature, maxTokens),
      callGroqAPI(prompt, temperature, maxTokens),
      callOpenAIAPI(prompt, temperature, maxTokens)
    ]).then(() => {
      $("#statusLine").text("完了");
    }).catch(() => {
      $("#statusLine").text("エラー発生");
    });

 });

});


// -----------------------------
// Gemini呼び出し関数（修正版）
// -----------------------------
const callGeminiAPI = async (prompt, temperature, maxTokens) => {
  const start = Date.now();
  $("#status-gemini").text("running");

  try {
    const res = await axios.post("http://localhost:3000/api/gemini", {
      prompt: prompt,
      temperature: temperature,
      maxTokens: maxTokens
    });

    console.log("Gemini応答:", res.data);

    // サーバーが { text: "..."} を返す前提で受け取る
    const text = res.data.text || "(応答なし)";

    $("#text-gemini").text(text);
    $("#status-gemini").text("done");

    const duration = Date.now() - start;
    $("#duration-gemini").text(duration + " ms");
    $("#time-gemini").text(dayjs().format("YYYY-MM-DD HH:mm:ss"));



  } catch (err) {
    $("#error-gemini").text(err.message);
    $("#status-gemini").text("error");
    console.error("Geminiエラー", err);
  }
};


const callGroqAPI = async (prompt, temperature, maxTokens) => {
  const start = Date.now();
  $("#status-groq").text("running");

  try {
    const res = await axios.post("http://localhost:3000/api/groq", {
      prompt: prompt,
      temperature: temperature,
      maxTokens: maxTokens
    });

    console.log("Groq応答:", res.data);

    // GroqはOpenAI互換なので応答は choices[0].message.content に入る
    const text = res.data.choices?.[0]?.message?.content || "(応答なし)";

    $("#text-groq").text(text);
    $("#status-groq").text("done");

    const duration = Date.now() - start;
    $("#duration-groq").text(duration + " ms");
    $("#time-groq").text(dayjs().format("YYYY-MM-DD HH:mm:ss"));

  } catch (err) {
    $("#error-groq").text(err.message);
    $("#status-groq").text("error");
    console.error("Groqエラー", err);
  }
};

const callOpenAIAPI = async (prompt, temperature, maxTokens) => {
  const start = Date.now();
  $("#status-openai").text("running");

  try {
    const res = await axios.post("http://localhost:3000/api/openai", {
      prompt: prompt,
      temperature: temperature,
      maxTokens: maxTokens
    });

    console.log("OpenAI応答:", res.data);

    const text = res.data.choices?.[0]?.message?.content || "(応答なし)";

    $("#text-openai").text(text);
    $("#status-openai").text("done");

    const duration = Date.now() - start;
    $("#duration-openai").text(duration + " ms");
    $("#time-openai").text(dayjs().format("YYYY-MM-DD HH:mm:ss"));

  } catch (err) {
    $("#error-openai").text(err.message);
    $("#status-openai").text("error");
    console.error("OpenAIエラー", err);
  }
};


$(function(){

// カウント保持用オブジェクト
const reactions = {
  gemini: { like: 0, good: 0, meh: 0 },
  groq:   { like: 0, good: 0, meh: 0 },
  openai: { like: 0, good: 0, meh: 0 }
};

// Firestoreにリアクションを保存
const addReaction = async (model, type) => {
  const ref = window.docFn(window.db, "reactions", model);
  const snap = await window.getDocFn(ref);
  const data = snap.exists() ? snap.data() : { like: 0, good: 0, meh: 0 };
  const newCount = (data[type] || 0) + 1;

  await window.setDocFn(ref, { ...data, [type]: newCount }, { merge: true });
};


// Firestoreからリアルタイム購読して画面に反映
const bindRealtimeCounts = (model) => {
  const ref = window.docFn(window.db, "reactions", model);
  window.onSnapshotFn(ref, (snap) => {
    const d = snap.exists() ? snap.data() : { like: 0, good: 0, meh: 0 };
    $("#count-" + model + "-like").text(d.like);
    $("#count-" + model + "-good").text(d.good);
    $("#count-" + model + "-meh").text(d.meh);
  });
};


// イベント登録（Gemini）
$("#btn-gemini-like").on("click", () => addReaction("gemini", "like"));
$("#btn-gemini-good").on("click", () => addReaction("gemini", "good"));
$("#btn-gemini-meh").on("click", () => addReaction("gemini", "meh"));

// イベント登録（Groq）
$("#btn-groq-like").on("click", () => addReaction("groq", "like"));
$("#btn-groq-good").on("click", () => addReaction("groq", "good"));
$("#btn-groq-meh").on("click", () => addReaction("groq", "meh"));

// イベント登録（OpenAI）
$("#btn-openai-like").on("click", () => addReaction("openai", "like"));
$("#btn-openai-good").on("click", () => addReaction("openai", "good"));
$("#btn-openai-meh").on("click", () => addReaction("openai", "meh"));

// ページ読み込み時にリアルタイム購読開始
bindRealtimeCounts("gemini");
bindRealtimeCounts("groq");
bindRealtimeCounts("openai");


});
