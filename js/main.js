// 開機：讀回教案（沒有就開第一個內建範本）→ 各 UI 模組 init → 第一次渲染（順序同舊版 Boot 段）。
import { TEMPLATES, docFromTemplate } from './core/templates.js';
import { loadDoc } from './store/local.js';
import { initState, renderAll, hooks } from './ui/state.js';
import { initBoard } from './ui/board.js';
import { initToolbar } from './ui/toolbar.js';
import { initSteps } from './ui/steps.js';
import { initEditor } from './ui/editor.js';
import { initProps } from './ui/props.js';
import { initKeyboard } from './ui/keyboard.js';
import { initPlayer } from './ui/player.js';
import { initExporter } from './ui/exporter.js';
import { initLibrary } from './ui/library.js';
import { initSaveTpl } from './ui/savetpl.js';
import { initTouch } from './ui/touch.js';
import { initAuth } from './ui/auth.js';
import { initSharearea } from './ui/sharearea.js';
import { initFirebase } from './store/firebase.js';

initState(loadDoc() || docFromTemplate(TEMPLATES[0]));

const inits = [initBoard, initToolbar, initSteps, initEditor, initProps, initKeyboard, initPlayer, initExporter, initLibrary, initSaveTpl, initTouch, initAuth, initSharearea];
for (const init of inits) init();

hooks.syncInputs(); hooks.renderTools(); renderAll();

// 畫布第一次渲染後才背景初始化 Firebase，不阻塞開機；離線或未設定時共享區與登入列自行顯示提示（AC-27）。
initFirebase();
