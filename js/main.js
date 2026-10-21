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

initState(loadDoc() || docFromTemplate(TEMPLATES[0]));

// 後續任務在此加入自己的 init（004：exporter／library／savetpl；005：touch；008：auth／sharearea）。
const inits = [initBoard, initToolbar, initSteps, initEditor, initProps, initKeyboard, initPlayer];
for (const init of inits) init();

hooks.syncInputs(); hooks.renderTools(); renderAll();
