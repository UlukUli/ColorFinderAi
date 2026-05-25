import { useState, useRef, useCallback } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.REACT_APP_API_KEY;

const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

const SYSTEM_PROMPT = `You are a color palette expert. Always respond with ONLY a valid JSON array of exactly 5 hex color codes.
Format: ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"]
No explanations, no markdown, no extra text. Only the JSON array.`;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function luminance({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function textColor(hex) {
  return luminance(hexToRgb(hex)) > 140 ? "#1a1a1a" : "#f5f5f5";
}

function randomHex() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

async function askClaude(userPrompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "API error " + res.status);
  }
  const data = await res.json();
  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function imageModePalette(file) {
  const base64 = await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100; canvas.height = 100;
      canvas.getContext("2d").drawImage(img, 0, 0, 100, 100);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: "Extract the 5 most dominant and harmonious colors from this image and return them as a JSON array of hex codes." }
        ]
      }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "API error " + res.status);
  }
  const data = await res.json();
  const text = data.content.map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function PaletteDisplay({ colors, loading }) {
  const [copied, setCopied] = useState(null);
  const copy = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) return (
    <div className="palette-loading">
      <div className="loader-track">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="loader-bar" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <p className="loading-text">Generating palette…</p>
    </div>
  );

  if (!colors.length) return null;

  return (
    <div className="palette-wrap">
      <div className="palette-strips">
        {colors.map((hex, i) => (
          <div key={i} className="strip" style={{ background: hex }} onClick={() => copy(hex)}>
            <div className="strip-info" style={{ color: textColor(hex) }}>
              <span className="strip-hex">{copied === hex ? "Copied!" : hex.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="palette-hint">Click a color to copy its hex</p>
    </div>
  );
}

export default function AppDEMO1() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const generate = useCallback(async () => {
    setError(""); setLoading(true); setColors([]);
    try {
      let result;
      if (mode === "text") {
        if (!text.trim()) throw new Error("Enter a description first");
        result = await askClaude(`Create a color palette that represents: "${text}". Return exactly 5 hex colors.`);
      } else if (mode === "image") {
        if (!image) throw new Error("Upload an image first");
        result = await imageModePalette(image);
      } else {
        result = [randomHex(), randomHex(), randomHex(), randomHex(), randomHex()];
      }
      setColors(result);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [mode, text, image]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setImage(f); setImageName(f.name); setColors([]); }
  };

  const modes = [
    { id: "text", label: "Text → Palette", icon: "✦" },
    { id: "image", label: "Image → Palette", icon: "◈" },
    { id: "random", label: "Randomizer", icon: "⟳" },
  ];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0e0e0f; --surface: #17171a; --border: #2a2a2f;
          --accent: #c8ff57; --accent2: #ff6b6b; --text: #e8e8ec; --muted: #6b6b75;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; }
        .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 48px 16px 80px; }
        .header { text-align: center; margin-bottom: 48px; }
        .header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.4rem, 6vw, 4rem);
          letter-spacing: -0.02em; line-height: 1;
          background: linear-gradient(135deg, #e8e8ec 0%, #c8ff57 60%, #ff6b6b 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .header p { color: var(--muted); font-size: 0.8rem; margin-top: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
        .card { width: 100%; max-width: 620px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; }
        .mode-tabs { display: flex; gap: 6px; margin-bottom: 28px; background: var(--bg); border-radius: 12px; padding: 4px; }
        .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 8px; border: none; background: transparent; border-radius: 9px; cursor: pointer; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.04em; transition: all 0.2s; }
        .tab:hover { color: var(--text); }
        .tab.active { background: var(--surface); color: var(--accent); border: 1px solid var(--border); }
        .tab-icon { font-size: 1rem; }
        textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 0.9rem; padding: 16px; resize: none; height: 110px; outline: none; transition: border-color 0.2s; line-height: 1.6; }
        textarea:focus { border-color: var(--accent); }
        textarea::placeholder { color: var(--muted); }
        .drop-zone { border: 1.5px dashed var(--border); border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg); }
        .drop-zone:hover { border-color: var(--accent); }
        .drop-zone p { color: var(--muted); font-size: 0.8rem; margin-top: 8px; }
        .drop-zone .dz-icon { font-size: 2.5rem; display: block; margin-bottom: 6px; }
        .drop-zone .dz-name { color: var(--accent); font-size: 0.85rem; margin-top: 4px; }
        .random-info { background: var(--bg); border-radius: 12px; padding: 28px; text-align: center; }
        .random-info .big-icon { font-size: 3rem; display: block; margin-bottom: 8px; }
        .random-info p { color: var(--muted); font-size: 0.82rem; line-height: 1.6; }
        .btn { width: 100%; margin-top: 20px; padding: 16px; border: none; border-radius: 12px; background: var(--accent); color: #0e0e0f; font-family: 'DM Mono', monospace; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.18s; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(200,255,87,0.25); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .error { margin-top: 14px; color: var(--accent2); font-size: 0.78rem; text-align: center; letter-spacing: 0.04em; }
        .palette-wrap { margin-top: 36px; width: 100%; max-width: 620px; }
        .palette-strips { display: flex; border-radius: 16px; overflow: hidden; height: 220px; gap: 2px; }
        .strip { flex: 1; cursor: pointer; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 14px; transition: flex 0.3s ease; }
        .strip:hover { flex: 1.6; }
        .strip-info { text-align: center; opacity: 0; transition: opacity 0.2s; }
        .strip:hover .strip-info { opacity: 1; }
        .strip-hex { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.05em; }
        .palette-hint { text-align: center; color: var(--muted); font-size: 0.72rem; margin-top: 12px; letter-spacing: 0.06em; }
        .palette-loading { margin-top: 36px; text-align: center; }
        .loader-track { display: flex; gap: 4px; height: 220px; border-radius: 16px; overflow: hidden; }
        .loader-bar { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
        .loading-text { color: var(--muted); font-size: 0.78rem; margin-top: 14px; letter-spacing: 0.08em; }
      `}</style>

      <header className="header">
        <h1>Palettist</h1>
        <p>AI-powered color palette generator</p>
      </header>

      <div className="card">
        <div className="mode-tabs">
          {modes.map(m => (
            <button key={m.id} className={`tab ${mode === m.id ? "active" : ""}`}
              onClick={() => { setMode(m.id); setColors([]); setError(""); }}>
              <span className="tab-icon">{m.icon}</span>{m.label}
            </button>
          ))}
        </div>

        {mode === "text" && (
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Describe a mood, scene or vibe… e.g. rainy Tokyo night, cozy autumn forest, retro 80s arcade" />
        )}

        {mode === "image" && (
          <div className="drop-zone" onClick={() => fileRef.current.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) { setImage(f); setImageName(f.name); setColors([]); }}}
            onDragOver={e => e.preventDefault()}>
            <span className="dz-icon">◈</span>
            <p>Drop an image here or click to upload</p>
            {imageName && <p className="dz-name">✓ {imageName}</p>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </div>
        )}

        {mode === "random" && (
          <div className="random-info">
            <span className="big-icon">⟳</span>
            <p>Click the button below to generate<br />a completely random palette</p>
          </div>
        )}

        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : mode === "random" ? "Randomize" : "Generate Palette"}
        </button>

        {error && <p className="error">⚠ {error}</p>}
      </div>

      <PaletteDisplay colors={colors} loading={loading} />
    </div>
  );
}