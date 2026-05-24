import "./App.css";
import { useState, useRef, useEffect, useCallback } from "react";

import logo        from "./assets/logo.png";
import leftArrow   from "./assets/left.png";
import rightArrow  from "./assets/right.png";
import icon1       from "./assets/icon-1.png";
import icon2       from "./assets/icon-2.png";
import icon3       from "./assets/icon-3.png";
import icon4       from "./assets/icon-4.png";
import icon5       from "./assets/icon-5.png";
import paintSplash from "./assets/paint-splash.png";
import iconSaved   from "./assets/icon-saved.png";
import iconLogout  from "./assets/icon-logout.png";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";
const API     = "http://localhost:5000";

const LANG = {
  ru: {
    screens: [
      { number:"01", title:"ПОДБОР\nПАЛИТРЫ",    subtitle:"Введите запрос и получите идеальную палитру цветов для вашей идеи.", short:"Подбор\nпалитры" },
      { number:"02", title:"ПАЛИТРА\nИЗОБРАЖЕНИЯ",subtitle:"Загрузите изображение, мы извлечём из него цветовую палитру.",      short:"Палитра из\nизображения" },
      { number:"03", title:"СЛУЧАЙНАЯ\nПАЛИТРА",   subtitle:"Получите случайную палитру и тему, которые могут вдохновить вас.", short:"Случайная\nпалитра" },
      { number:"04", title:"ОТТЕНКИ\nПО ЦВЕТУ",    subtitle:"Выберите любой цвет и получите все его оттенки.",                  short:"Оттенки\nпо цвету" },
      { number:"05", title:"ЛИЧНЫЙ\nКАБИНЕТ",      subtitle:"Ваши сохранённые палитры и изображения.",                          short:"Личный\nкабинет" },
    ],
    searchPlaceholder: "Например: Снежный лес",
    generateBtn:  "Сгенерировать случайную тему 🎲",
    generating:   "Генерирую…",
    uploadBtn:    "↓  Загрузить изображение",
    analyzing:    "Обработка…",
    dragImage:    "Перетащите изображение",
    orClick:      "или нажмите для загрузки.",
    savePalette:  "♡  Сохранить палитру",
    themeLabel:   "Тема: ",
    emptyTitle:   "Коллекция пуста",
    emptySub:     "Сохраняйте палитры во время работы,\nчтобы они появились здесь.",
    savedPalettes:"Сохранённые палитры",
    logout:       "Выйти из аккаунта",
    aiThinking:   "AI думает…",
    pickerHint:   "Нажми, чтобы\nвыбрать цвет",
    loginTitle:   "Вход",
    registerTitle:"Регистрация",
    usernameLabel:"Имя пользователя",
    passwordLabel:"Пароль",
    loginBtn:     "Войти",
    registerBtn:  "Создать аккаунт",
    switchToReg:  "Нет аккаунта? Зарегистрироваться",
    switchToLog:  "Уже есть аккаунт? Войти",
    errUser:      "Пользователь не найден",
    errPass:      "Неверный пароль",
    errExists:    "Имя уже занято",
    errFields:    "Заполните все поля",
    errNetwork:   "Нет соединения с сервером",
    palette:      "Палитра",
    signIn:       "Войти",
    clickToCopy:  "Клик — скопировать",
    expandTitle:  "Палитра",
    close:        "✕ Закрыть",
  },
  en: {
    screens: [
      { number:"01", title:"PALETTE\nSEARCH", subtitle:"Enter a query and get the ideal color palette for your idea.", short:"Palette\nsearch" },
      { number:"02", title:"IMAGE\nPALETTE",  subtitle:"Upload an image and we'll extract its color palette.",        short:"Image\npalette" },
      { number:"03", title:"RANDOM\nPALETTE", subtitle:"Get a random palette and theme to inspire you.",              short:"Random\npalette" },
      { number:"04", title:"COLOR\nSHADES",   subtitle:"Pick any color and get all its shades.",                      short:"Color\nshades" },
      { number:"05", title:"MY\nCABINET",     subtitle:"Your saved palettes and images.",                             short:"My\ncabinet" },
    ],
    searchPlaceholder:"E.g.: Snowy Forest",
    generateBtn:  "Generate random theme 🎲",
    generating:   "Generating…",
    uploadBtn:    "↓  Upload image",
    analyzing:    "Processing…",
    dragImage:    "Drag image here",
    orClick:      "or click to upload.",
    savePalette:  "♡  Save palette",
    themeLabel:   "Theme: ",
    emptyTitle:   "Collection is empty",
    emptySub:     "Save palettes while working\nto see them here.",
    savedPalettes:"Saved palettes",
    logout:       "Log out",
    aiThinking:   "AI thinking…",
    pickerHint:   "Click to\npick a color",
    loginTitle:   "Log in",
    registerTitle:"Sign up",
    usernameLabel:"Username",
    passwordLabel:"Password",
    loginBtn:     "Log in",
    registerBtn:  "Create account",
    switchToReg:  "No account? Sign up",
    switchToLog:  "Already have one? Log in",
    errUser:      "User not found",
    errPass:      "Wrong password",
    errExists:    "Username taken",
    errFields:    "Fill in all fields",
    errNetwork:   "No server connection",
    palette:      "Palette",
    signIn:       "Sign in",
    clickToCopy:  "Click to copy",
    expandTitle:  "Palette",
    close:        "✕ Close",
  },
};

/* API helpers */
async function askClaude(p, s) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:MODEL, max_tokens:500, system:s, messages:[{role:"user",content:p}] }),
  });
  const d = await res.json();
  return d.content.map(b => b.text || "").join("");
}

function extractHex(t) {
  return [...new Set([...t.matchAll(/([0-9A-Fa-f]{6})/g)].map(m => m[1].toUpperCase()))].slice(0, 16);
}
const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, "0")).join("").toUpperCase();

const extractColorsFromImage = imgElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const MAX_SIZE = 150;
  let w = imgElement.naturalWidth, h = imgElement.naturalHeight;
  if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
  else if (h > MAX_SIZE)      { w *= MAX_SIZE / h; h = MAX_SIZE; }
  canvas.width = w; canvas.height = h;
  ctx.drawImage(imgElement, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const colorMap = new Map();
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.min(255, Math.max(0, Math.round(data[i]   / 20) * 20));
    const g = Math.min(255, Math.max(0, Math.round(data[i+1] / 20) * 20));
    const b = Math.min(255, Math.max(0, Math.round(data[i+2] / 20) * 20));
    if ((r < 20 && g < 20 && b < 20) || (r > 240 && g > 240 && b > 240)) continue;
    const hex = rgbToHex(r, g, b);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }
  const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const selected = [];
  for (let hex of sorted) {
    let tooClose = false;
    const r1 = parseInt(hex.slice(1,3), 16), g1 = parseInt(hex.slice(3,5), 16), b1 = parseInt(hex.slice(5,7), 16);
    for (let sHex of selected) {
      const r2 = parseInt(sHex.slice(1,3), 16), g2 = parseInt(sHex.slice(3,5), 16), b2 = parseInt(sHex.slice(5,7), 16);
      if (Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2) < 60) { tooClose = true; break; }
    }
    if (!tooClose) { selected.push(hex); if (selected.length === 7) break; }
  }
  if (selected.length === 0) selected.push("#888888");
  let fillIdx = 0;
  while (selected.length < 7) {
    let base = selected[fillIdx % selected.length];
    let r = Math.min(255, parseInt(base.slice(1,3), 16) + 30);
    let g = Math.min(255, parseInt(base.slice(3,5), 16) + 30);
    let b = Math.min(255, parseInt(base.slice(5,7), 16) + 30);
    selected.push(rgbToHex(r, g, b));
    fillIdx++;
  }
  return selected;
};


function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}


function BouncyText({ text }) {
  const rainbowColors = [
    "#FF3333", "#FF7700", "#FFD700",
    "#33DD44", "#00BBFF", "#7755FF", "#FF33CC"
  ];
  const timers = useRef({});

  return (
    <h1 className="title bouncy-container">
      {text.split('').map((char, i) => {
        if (char === '\n') return <div key={i} style={{ width: '100%', height: 0 }} />;
        if (char === ' ') return <span key={i}>&nbsp;</span>;
        return (
          <span
            key={i}
            className="bouncy-char"
            onMouseEnter={e => {
              if (timers.current[i]) {
                clearTimeout(timers.current[i]);
                timers.current[i] = null;
              }
              const el = e.currentTarget;
              el.style.transition = 'color 0.12s ease';
              el.style.color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              timers.current[i] = setTimeout(() => {
                el.style.transition = 'color 0.9s ease';
                el.style.color = '';
                timers.current[i] = null;
              }, 800);
            }}
          >
            {char}
          </span>
        );
      })}
    </h1>
  );
}

function ColorBox({ color }) {
  const [cp, setCp] = useState(false);
  const copy = () => { navigator.clipboard.writeText(color).then(() => { setCp(true); setTimeout(() => setCp(false), 1100); }); };
  return (
    <div className="palette-item">
      <div className="color-box" style={{ background: color }} onClick={copy} title={color}>
        {cp && <span className="copied-badge">✓</span>}
      </div>
      <span className="hex">{color.replace("#", "")}</span>
    </div>
  );
}

function VertColorBox({ color }) {
  const [cp, setCp] = useState(false);
  const copy = () => { navigator.clipboard.writeText(color).then(() => { setCp(true); setTimeout(() => setCp(false), 1100); }); };
  return (
    <div className="vert-palette-item" onClick={copy} title={color}>
      <div className="vert-color-bar" style={{ background: color }}>
        {cp && <span className="copied-badge small">✓</span>}
      </div>
      <span className="hex">{color.replace("#", "")}</span>
    </div>
  );
}

function ExpandModal({ palette, t, onClose, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(palette?.name || "");
  if (!palette) return null;

  const handleSave = () => {
    setIsEditing(false);
    if (tempName.trim() && tempName !== palette.name) onRename(tempName.trim());
    else setTempName(palette.name);
  };

  const cols = Math.min(palette.colors.length, 8);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="expand-modal" onClick={e => e.stopPropagation()}>
        <div className="expand-header">
          <div style={{ flex:1, paddingRight:"20px" }}>
            {isEditing ? (
              <input autoFocus className="expand-title-input" value={tempName}
                onChange={e => setTempName(e.target.value)}
                onBlur={handleSave} onKeyDown={e => e.key === "Enter" && handleSave()} />
            ) : (
              <div className="expand-title" onClick={() => setIsEditing(true)} title="Нажмите, чтобы изменить название">
                {palette.name} <span className="edit-icon">✎</span>
              </div>
            )}
            <div className="expand-date">{palette.date}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div
          className="expand-colors"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {palette.colors.map((c, i) => (
            <div key={i} className="expand-color-item">
              <ColorBox color={c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Auth Modal */
function AuthModal({ t, onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [un, setUn]     = useState("");
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");

  const submit = async () => {
    if (!un.trim() || !pw.trim()) { setErr(t.errFields); return; }
    const url = mode === "login" ? "/auth/login" : "/auth/register";
    try {
      const res  = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: un, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Ошибка"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      onLogin(data.username);
    } catch {
      setErr(t.errNetwork);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">{mode === "login" ? t.loginTitle : t.registerTitle}</h2>
        {err && <p className="modal-error">{err}</p>}
        <input className="modal-input" placeholder={t.usernameLabel} value={un}
          onChange={e => { setUn(e.target.value); setErr(""); }} />
        <input className="modal-input" type="password" placeholder={t.passwordLabel} value={pw}
          onChange={e => { setPw(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()} />
        <button className="modal-btn" onClick={submit}>
          {mode === "login" ? t.loginBtn : t.registerBtn}
        </button>
        <button className="modal-switch" onClick={() => { setMode(m => m === "login" ? "register" : "login"); setErr(""); }}>
          {mode === "login" ? t.switchToReg : t.switchToLog}
        </button>
      </div>
    </div>
  );
}

/* Eyedropper image */
function ImageWithEyedropper({ src, onRemove, clickToCopy }) {
  const wrapRef   = useRef(null);
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const [hoverColor, setHoverColor] = useState(null);
  const [hoverPos,   setHoverPos]   = useState({ x:0, y:0 });
  const [copied, setCopied] = useState(false);

  const draw = useCallback(() => {
    const img = imgRef.current, c = canvasRef.current;
    if (!img || !c) return;
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
  }, []);

  const getPixel = useCallback(e => {
    const wrap = wrapRef.current, img = imgRef.current, c = canvasRef.current;
    if (!wrap || !img || !c || !img.naturalWidth) return null;
    const rect = wrap.getBoundingClientRect();
    const ir = img.naturalWidth / img.naturalHeight, wr = rect.width / rect.height;
    let iw, ih, ix, iy;
    if (ir > wr) { iw = rect.width;  ih = rect.width / ir;  ix = 0;           iy = (rect.height - ih) / 2; }
    else         { ih = rect.height; iw = rect.height * ir; iy = 0;           ix = (rect.width  - iw) / 2; }
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (mx < ix || mx > ix+iw || my < iy || my > iy+ih) return null;
    const px = Math.floor((mx-ix)/iw * img.naturalWidth);
    const py = Math.floor((my-iy)/ih * img.naturalHeight);
    const [r,g,b] = c.getContext("2d").getImageData(px, py, 1, 1).data;
    return { hex: rgbToHex(r,g,b), x: mx, y: my };
  }, []);

  const onMove   = useCallback(e => { const res = getPixel(e); if (res) { setHoverColor(res.hex); setHoverPos({x:res.x,y:res.y}); } else setHoverColor(null); }, [getPixel]);
  const onClick  = useCallback(e => {
    if (e.target.closest(".img-remove-btn")) return;
    const res = getPixel(e);
    if (res) navigator.clipboard.writeText(res.hex).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); });
  }, [getPixel]);

  return (
    <div className="screen02-img-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHoverColor(null)} onClick={onClick}>
      <canvas ref={canvasRef} style={{ display:"none" }} />
      <img ref={imgRef} src={src} alt="preview" className="screen02-img" onLoad={draw} crossOrigin="anonymous" />
      <button className="img-remove-btn" onClick={e => { e.stopPropagation(); onRemove(e); }}>✕</button>
      {hoverColor && (
        <div className="eyedropper-tip" style={{ left:hoverPos.x, top:hoverPos.y }}>
          <div className="eyedropper-swatch" style={{ background:hoverColor }} />
          <span className="eyedropper-hex">{hoverColor}</span>
          <span className="eyedropper-click-hint">{clickToCopy}</span>
        </div>
      )}
      {copied && <div className="eyedropper-copied">✓ Скопировано</div>}
    </div>
  );
}

/* APP */
function App() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [toast,  setToast]  = useState("");
  const [lang,   setLang]   = useState("ru");
  const [theme,  setTheme]  = useState("dark");
  const [auth,   setAuth]   = useState({ isLoggedIn:false, username:"", showModal:false });
  const [expandPalette, setExpandPalette] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const t = LANG[lang];
  const defaultColors = ["#131A1D","#2B373D","#43535D","#68787E","#A9B2B5","#FFFFFF","#000000"];
  const [colors,       setColors]       = useState(defaultColors);
  const [loading,      setLoading]      = useState(false);
  const [searchText,   setSearchText]   = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [randomTheme,  setRandomTheme]  = useState("");
  const [baseColor,    setBaseColor]    = useState("#DFFF00");
  const [savedPalettes, setSavedPalettes] = useState([]);

  const fileInputRef = useRef(null);
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2200); };
  const isDefault = colors.every((c, i) => c === defaultColors[i]);

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "User";
    if (token) setAuth(a => ({ ...a, isLoggedIn:true, username }));
  }, []);

  useEffect(() => {
    if (!auth.isLoggedIn) return;
    fetch(`${API}/palette/my`, { headers:{ Authorization: localStorage.getItem("token") } })
      .then(r => r.json())
      .then(data => {
        setSavedPalettes(data.map(p => ({ ...p, date: new Date(p.createdAt).toLocaleDateString("ru-RU") })));
      })
      .catch(console.error);
  }, [auth.isLoggedIn]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const close = () => setShowProfileMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showProfileMenu]);

  useEffect(() => {
    const prevent = e => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop",     prevent);
    return () => { document.removeEventListener("dragover", prevent); document.removeEventListener("drop", prevent); };
  }, []);

  const computeShades = hex => {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return Array.from({length:16}, (_,i) => {
      const f = 1.8 - i*(1.8/15);
      return rgbToHex(Math.min(255,Math.max(0,Math.round(r*f))), Math.min(255,Math.max(0,Math.round(g*f))), Math.min(255,Math.max(0,Math.round(b*f))));
    });
  };

  const handleChangeScreen = i => {
    if (i === 3) setColors(computeShades(baseColor));
    else setColors(defaultColors);
    setImagePreview(null); setRandomTheme(""); setCurrentScreen(i);
    setShowProfileMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = e => {
    e.stopPropagation(); setImagePreview(null); setColors(defaultColors);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setSavedPalettes([]);
    setAuth({ isLoggedIn:false, username:"", showModal:false });
    setShowProfileMenu(false);
  };

  const saveCurrent = async name => {
    if (isDefault) return;
    if (!auth.isLoggedIn) { showToast("Сначала войдите"); setAuth(a => ({ ...a, showModal:true })); return; }

    const isDuplicate = savedPalettes.some(p => p.colors.length === colors.length && p.colors.every((c, i) => c.toUpperCase() === colors[i].toUpperCase()));
    if (isDuplicate) { showToast("Такая палитра уже сохранена"); return; }

    try {
      const res = await fetch(`${API}/palette/save`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization: localStorage.getItem("token") },
        body: JSON.stringify({ name: name || t.palette, colors }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      if (data.palette) {
        const newPaletteWithDate = {
          ...data.palette,
          date: new Date().toLocaleDateString("ru-RU")
        };
        setSavedPalettes(prev => [newPaletteWithDate, ...prev]);
      }

      showToast("✓ Сохранено");
    } catch {
      showToast("Ошибка сохранения");
    }
  };

  const deletePalette = async (id, e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/palette/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: token }
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.message || "Ошибка при удалении");
        return;
      }

      setSavedPalettes(prev => prev.filter(x => x.id !== id));
      showToast("✓ Палитра удалена");
    } catch (error) {
      console.error(error);
      showToast("Нет соединения с сервером");
    }
  };

  const updatePaletteName = (id, newName) => { setSavedPalettes(prev => prev.map(p => p.id === id ? { ...p, name:newName } : p)); };

  const processImageFile = async file => {
    if (!file || !file.type.startsWith("image/")) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result); setLoading(true);
      const img = new Image();
      img.onload = () => { setColors(extractColorsFromImage(img)); setLoading(false); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const handleDrop = e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); processImageFile(e.dataTransfer.files[0]); };

  const handleGenerateText = async () => {
    if (!searchText.trim()) return; setLoading(true);
    try {
      const raw = await askClaude(`Theme: "${searchText}". Give 7 HEX colors.`, "Return ONLY 7 hex codes without # separated by spaces.");
      const c = extractHex(raw);
      if (c.length >= 4) setColors(c.slice(0,7).map(h => "#"+h)); else throw new Error();
    } catch { setColors(Array.from({length:7}, () => "#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0").toUpperCase())); }
    finally { setLoading(false); }
  };

  const handleGenerateRandom = async () => {
    setLoading(true); setRandomTheme("");
    try {
      const raw = await askClaude("Invent a random creative theme and 7 colors.", `Return JSON: {"theme":"Theme in Russian","colors":"HEX HEX HEX HEX HEX HEX HEX"}. No extra text.`);
      const obj = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setRandomTheme(obj.theme || "Случайная тема");
      const c = extractHex(obj.colors || "");
      if (c.length >= 4) setColors(c.slice(0,7).map(h => "#"+h)); else throw new Error();
    } catch {
      const themes = ["Космический закат","Неоновый киберпанк","Снежный лес","Утренняя мята","Глубокий океан"];
      setRandomTheme(themes[Math.floor(Math.random()*themes.length)]);
      setColors(Array.from({length:7}, () => rgbToHex(Math.floor(Math.random()*256), Math.floor(Math.random()*256), Math.floor(Math.random()*256))));
    } finally { setLoading(false); }
  };

  const handleGenerateShades = hex => { setBaseColor(hex); setColors(computeShades(hex)); };

  const screens = t.screens.map((s, i) => ({ ...s, icon:[icon1,icon2,icon3,icon4,icon5][i] }));
  const sc = screens[currentScreen];

  return (
    <div className="app" data-theme={theme} data-lang={lang}>
      <Toast msg={toast} />

      {auth.showModal && (
        <AuthModal t={t}
          onClose={() => setAuth(a => ({ ...a, showModal:false }))}
          onLogin={u => setAuth({ isLoggedIn:true, username:u, showModal:false })} />
      )}
      {expandPalette && (
        <ExpandModal palette={expandPalette} t={t}
          onClose={() => setExpandPalette(null)}
          onRename={newName => { updatePaletteName(expandPalette.id, newName); setExpandPalette(prev => ({ ...prev, name:newName })); }} />
      )}

      {/* HEADER */}
      <header className="header">
        <img src={logo} alt="ColorFinder" className="logo" />
        <div className="profile-area">
          <div className="theme-toggle">
            <button className={`theme-opt${theme==="dark"?" active":""}`} onClick={() => setTheme("dark")}>🌙</button>
            <button className={`theme-opt${theme==="light"?" active":""}`} onClick={() => setTheme("light")}>☀️</button>
          </div>
          <button className="lang-btn" onClick={() => setLang(l => l==="ru"?"en":"ru")}>
            {lang==="ru" ? "EN" : "RU"}
          </button>

          <div className="avatar-area" style={{position:"relative"}}
            onClick={(e) => {
              e.stopPropagation();
              if (auth.isLoggedIn) setShowProfileMenu(m => !m);
              else setAuth(a => ({ ...a, showModal:true }));
            }}>
            <div className="avatar">
              {auth.isLoggedIn
                ? <span className="avatar-letter">{auth.username[0].toUpperCase()}</span>
                : <span className="avatar-icon">👤</span>}
            </div>
            <span className="nickname">{auth.isLoggedIn ? auth.username : t.signIn}</span>

            {auth.isLoggedIn && showProfileMenu && (
              <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
                <div className="dropdown-header">{auth.username}</div>
                <button className="dropdown-item" onClick={() => { handleChangeScreen(4); setShowProfileMenu(false); }}>
                  🎨 {t.savedPalettes}
                </button>
                <button className="dropdown-item danger" onClick={logout}>
                  🚪 {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="main">
        <button className="arrow-btn" onClick={() => handleChangeScreen(currentScreen===0 ? screens.length-1 : currentScreen-1)}>
          <img src={leftArrow} alt="<" />
        </button>

        <div className="window">
          {/* LEFT */}
          <div className="left-side">
            <div className="screen-number">{sc.number}</div>
            <BouncyText text={sc.title} />
            <p className="subtitle">{sc.subtitle}</p>

            {currentScreen===0 && (
              <div className="input-row">
                <input type="text" className="text-input" placeholder={t.searchPlaceholder}
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleGenerateText()} disabled={loading} />
                <button className="go-btn" onClick={handleGenerateText} disabled={loading}>
                  {loading ? "…" : "→"}
                </button>
              </div>
            )}

            {currentScreen===1 && (
              <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => processImageFile(e.target.files[0])} style={{ display:"none" }} />
                <button className="upload-trigger-btn" onClick={() => fileInputRef.current.click()} disabled={loading}>
                  {loading ? t.analyzing : t.uploadBtn}
                </button>
              </>
            )}

            {currentScreen===2 && (
              <div className="screen3-controls">
                {randomTheme && <div className="theme-output">{t.themeLabel}<span>{randomTheme}</span></div>}
                <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%" }}>
                  <button className="action-wide-btn" onClick={handleGenerateRandom} disabled={loading}>
                    {loading ? t.generating : t.generateBtn}
                  </button>
                  {!isDefault && (
                    <button className="save-palette-btn" onClick={() => saveCurrent(randomTheme||t.palette)}>
                      {t.savePalette}
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentScreen===3 && (
              <div className="picker-row">
                <input type="color" className="color-picker" value={baseColor} onChange={e => handleGenerateShades(e.target.value)} />
                <span className="picker-hint">{t.pickerHint}</span>
              </div>
            )}

            {currentScreen===4 && (
              <div className="cabinet-menu">
                <button className="cabinet-menu-btn active">
                  <img src={iconSaved} alt="saved" className="cabinet-btn-icon" />
                  {t.savedPalettes}
                </button>
                {auth.isLoggedIn && (
                  <button className="cabinet-menu-btn logout" onClick={logout}>
                    <img src={iconLogout} alt="logout" className="cabinet-btn-icon" />
                    {t.logout}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="side-divider" />

          {/* RIGHT */}
          <div className="right-side">
            {/* Экран 02 */}
            {currentScreen===1 && (
              <div className="screen02-layout"
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}>
                {imagePreview
                  ? <ImageWithEyedropper src={imagePreview} onRemove={handleRemoveImage} clickToCopy={t.clickToCopy} />
                  : <div className={`screen02-upload-zone${dragOver?" drag-active":""}`} onClick={() => fileInputRef.current.click()}>
                      <span className="upload-arrow">↓</span>
                      <p className="upload-title">{t.dragImage}</p>
                      <p className="upload-sub">{t.orClick}</p>
                    </div>
                }
                <div className="screen02-vert-palette">
                  {loading
                    ? <div className="loading-bar-vert"><span>{t.aiThinking}</span></div>
                    : colors.slice(0,7).map((c,i) => <VertColorBox key={i} color={c} />)
                  }
                </div>
              </div>
            )}

            {/* Экран 04 */}
            {currentScreen===3 && (
              <>
                {loading && <div className="loading-bar"><span>{t.aiThinking}</span></div>}
                <div className="palette palette-grid">
                  {colors.map((c,i) => <ColorBox key={i} color={c} />)}
                </div>
                {!isDefault && (
                  <button className="save-palette-btn" onClick={() => saveCurrent(t.palette)}>
                    {t.savePalette}
                  </button>
                )}
              </>
            )}

            {/* Экран 05 */}
            {currentScreen===4 && (
              savedPalettes.length===0
                ? <div className="cabinet-placeholder">
                    <span style={{ fontSize:48 }}>🎨</span>
                    <h2>{t.emptyTitle}</h2>
                    <p style={{ whiteSpace:"pre-line" }}>{t.emptySub}</p>
                  </div>
                : <div className="saved-grid">
                    {savedPalettes.map(p => (
                      <div key={p.id} className="saved-palette-card">
                        <button className="saved-delete-btn" onClick={e => deletePalette(p.id, e)} title="Удалить">✕</button>
                        <div className="card-colors-wrap">
                          {p.colors.map((c,j) => <div key={j} className="card-color-bar" style={{ background:c }} />)}
                        </div>
                        <div className="card-bottom-info">
                          <div className="card-text-block">
                            <span className="card-palette-name">{p.name}</span>
                            <span className="card-palette-date">{p.date}</span>
                          </div>
                          <svg className="expand-action-icon" viewBox="0 0 24 24"
                            onClick={e => { e.stopPropagation(); setExpandPalette(p); }}>
                            <path fill="currentColor" d="M21 3h-6v2h3.59l-6.79 6.79 1.41 1.41L20 6.41V10h2V3zM3 21h6v-2H5.41l6.79-6.79-1.41-1.41L4 17.59V14H2v7z"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {/* Экраны 01, 03 */}
            {[0,2].includes(currentScreen) && (
              <>
                {loading && <div className="loading-bar"><span>{t.aiThinking}</span></div>}
                <div className="palette">
                  {colors.map((c,i) => <ColorBox key={i} color={c} />)}
                </div>
              </>
            )}

            {/* Кнопка сохранить: экран 01 */}
            {currentScreen===0 && !isDefault && (
              <button className="save-palette-btn" onClick={() => saveCurrent(searchText||t.palette)}>
                {t.savePalette}
              </button>
            )}
            {/* Кнопка сохранить: экран 02 */}
            {currentScreen===1 && imagePreview && !isDefault && (
              <button className="save-palette-btn" onClick={() => saveCurrent(t.palette)}>
                {t.savePalette}
              </button>
            )}
          </div>
        </div>

        <button className="arrow-btn" onClick={() => handleChangeScreen((currentScreen+1) % screens.length)}>
          <img src={rightArrow} alt=">" />
        </button>
      </div>

      {/* NAV */}
      <nav className="bottom-nav">
        {screens.map((screen, index) => (
          <div key={index} className={`nav-item${currentScreen===index?" active":""}`}
            onClick={() => handleChangeScreen(index)}>
            <div className="nav-icon-wrapper">
              {currentScreen===index && <img src={paintSplash} alt="" className="paint-splash-bg" />}
              <img src={screen.icon} alt="" className="nav-icon-img" />
            </div>
            <div className="nav-content">
              <div className="nav-number">{screen.number}</div>
              <div className="nav-title">{screen.short}</div>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default App;