// 共用常數與小工具（搬自舊版前導段，不含 DOM 的 `$`）。
export const W = 1000;
export const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif';
export const uid = () => Math.random().toString(36).slice(2, 10);
export const f = n => Math.round(n * 10) / 10;
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
