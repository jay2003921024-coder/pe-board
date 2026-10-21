// 內建範本（搬自舊版 Templates 段落，內容不變）。
import { uid } from './util.js';
import { COURTS, scaleOf } from './courts.js';

export function tplBuilder(courtId) {
  const c = COURTS[courtId], s = scaleOf(courtId);
  const P = (x, y) => ({ x: (x + c.m) * s, y: (y + c.m) * s });
  const pl = (team, label, x, y) => ({ id: uid(), type: 'player', team, label: String(label), ...P(x, y) });
  const it = (type, x, y, extra = {}) => ({ id: uid(), type, ...P(x, y), ...extra });
  const ball = (x, y) => it('ball', x, y, { color: c.ball });
  const ln = (type, a, b, ctrl, extra = {}) => {
    const p1 = P(...a), p2 = P(...b), pc = ctrl ? P(...ctrl) : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    return { id: uid(), type, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, cx: pc.x, cy: pc.y, auto: !ctrl, color: '#141414', ...extra };
  };
  return { P, pl, it, ball, ln };
}
export const TEMPLATES = [
  { title: '三人傳切上籃', grade: '國中', court: 'bb-half', build: () => {
    const { pl, it, ball, ln } = tplBuilder('bb-half');
    const wait = [pl('white', 4, 7.5, 12.4), pl('white', 5, 7.5, 13.4), it('cone', 2.2, 10.2), it('cone', 12.8, 10.2), it('teacher', 16, 4)];
    return {
      players: '每組 3 人，其餘排隊輪替（4–5 組）', equipment: '籃球每組 1 顆、三角錐 2 個', duration: '15 分鐘',
      steps: [
        { name: '傳球後切入', note: 'A1 在罰球線頂端持球，傳給左翼 A2 後，立刻從防守者前方往籃框切入。傳球時看著接球者的胸口，切入要先做一個假動作。', items: [
          pl('red', 1, 7.5, 8.5), ball(8.2, 8.0), pl('red', 2, 2.2, 6.0), pl('red', 3, 12.8, 6.0), ...wait,
          ln('pass', [7.2, 8.3], [2.7, 6.3]), ln('run', [7.8, 8.2], [6.3, 3.1], [9.4, 5.4]) ] },
        { name: '回傳上籃、補位', note: 'A2 把球回傳給切入的 A1，A1 接球後直接上籃。A3 往頂端補位，接著下一組依序輪替。上籃後要記得去搶籃板。', items: [
          pl('red', 1, 6.3, 3.1), pl('red', 2, 2.2, 6.0), ball(2.6, 6.6), pl('red', 3, 12.8, 6.0), ...wait.map(o => ({ ...o })),
          ln('pass', [2.7, 5.7], [5.9, 3.4]), ln('run', [6.6, 2.7], [7.3, 1.9]), ln('run', [12.6, 6.5], [7.9, 8.4], [12.0, 9.2]) ] },
      ] };
  } },
  { title: '躲避球分組站位與夾擊', grade: '國小高年級', court: 'dodgeball', build: () => {
    const { pl, it, ball, ln } = tplBuilder('dodgeball');
    const red = [[3, 2], [6.5, 2.5], [8, 5], [5, 5], [2.5, 7.8], [6.5, 8]], blue = red.map(([x, y]) => [20 - x, y]);
    const base = () => [
      ...red.map(([x, y], i) => pl('red', i + 1, x, y)), ...blue.map(([x, y], i) => pl('blue', i + 1, x, y)),
      pl('red', 7, 21.6, 5), pl('red', 8, 16, -1.4), pl('red', 9, 16, 11.4),
      pl('blue', 7, -1.6, 5), pl('blue', 8, 4, -1.4), pl('blue', 9, 4, 11.4), it('teacher', 10, -2.4) ];
    return {
      players: '全班分兩隊，每隊內場 6 人、外場 3 人', equipment: '躲避球 1 顆、兩色號碼衣', duration: '20 分鐘',
      steps: [
        { name: '分組站位', note: '紅隊內場在 A 區，外場站在 B 區外圍；藍隊相反。開球前內場隊員散開，不要擠在中線附近。', items: [...base(), ball(21.6, 5.9)] },
        { name: '外場傳球夾擊', note: '紅隊外場 7 號把球傳給 8 號，8 號從側邊出手攻擊藍隊 2 號。被瞄準的人往空的地方側移閃躲。只能打肩膀以下。', items: [...base(), ball(16.6, -0.9),
          ln('pass', [21.4, 4.4], [16.5, -0.8], [20.5, 0.6]), ln('pass', [15.8, -0.8], [14.2, 2.0]), ln('run', [13.4, 2.8], [12.6, 4.6], [12.6, 3.4])] },
      ] };
  } },
  { title: '排球接發球 W 站位', grade: '高中', court: 'volleyball', build: () => {
    const { pl, ball, ln } = tplBuilder('volleyball');
    const blueW = [[12.8, 1.4, 4], [12.8, 4.5, 3], [12.8, 7.6, 2], [16, 3, 5], [16, 6, 1], [9.7, 6.4, 6]];
    const red = [[7.6, 1.6, 4], [7.6, 4.5, 3], [7.6, 7.4, 2], [3.4, 2.2, 5], [3.4, 6.2, 6], [-1.2, 7.4, 1]];
    const base = () => [...blueW.map(([x, y, n]) => pl('blue', n, x, y)), ...red.map(([x, y, n]) => pl('red', n, x, y))];
    return {
      players: '每隊 6 人，其餘同學在場邊撿球', equipment: '排球每場 3 顆', duration: '20 分鐘',
      steps: [
        { name: '發球與 W 站位', note: '藍隊以 W 形接發：前排三人站在進攻線後一步，後排兩人補中間空檔，舉球員（6 號）靠網等球。紅隊 1 號在端線後發球。', items: [...base(), ball(-1.2, 8.2), ln('pass', [-0.9, 7.2], [15.6, 3.2], [7, 1.0])] },
        { name: '接球→舉球→攻擊', note: '藍隊 5 號低手接球送到 6 號頭上；6 號高手舉球到左側；4 號助跑起跳攻擊。接球目標是網前 2 公尺、偏右的位置。', items: [...base(), ball(15.6, 3.6),
          ln('pass', [15.6, 2.8], [10.0, 5.9], [13.8, 1.4]), ln('pass', [9.6, 5.9], [10.2, 1.3], [8.8, 3.2]), ln('run', [13.1, 1.6], [10.7, 1.6])] },
      ] };
  } },
  { title: '大隊接力交接區練習', grade: '國小中年級', court: 'track', build: () => {
    const { pl, it, ln } = tplBuilder('track');
    const y1 = 23.22 - (15.9 + 0.61), y3 = 23.22 - (15.9 + 2.44 + 0.61);
    return {
      players: '全班分紅藍兩隊，每隊 12 人', equipment: '接力棒 2 支、三角錐 4 個', duration: '15 分鐘',
      steps: [
        { name: '交接區內完成交棒', note: '接棒者在交接區起點前等待，看到隊友跑到三角錐時起跑；在 20 公尺交接區內喊「手！」並完成交棒。交棒後沿跑道外側離開，不要橫越跑道。', items: [
          ln('zone', [40, 3.66], [60, 7.32], null, { label: '交接區 20 m', color: '#ffffff' }),
          it('cone', 34, 8.6), it('cone', 40, 8.6), it('cone', 60, 8.6),
          pl('red', 1, 31, y1), pl('red', 2, 41.5, y1), pl('blue', 1, 28, y3), pl('blue', 2, 41.5, y3),
          ln('run', [32.6, y1], [44, y1], null, { color: '#ffffff' }), ln('run', [43.1, y1], [58, y1], null, { color: '#ffffff' }),
          ln('run', [29.6, y3], [40.5, y3], null, { color: '#ffffff' }),
          ...[3, 4, 5, 6].map((n, i) => pl('red', n, 44 + i * 2.2, 13)), ...[3, 4, 5, 6].map((n, i) => pl('blue', n, 44 + i * 2.2, 16.5)),
          it('teacher', 62, 13), it('text', 37, 11.4, { label: '起跑提示錐', size: 14, color: '#141414' }) ] },
      ] };
  } },
  { title: '二過一撞牆配合', grade: '國中', court: 'soccer', build: () => {
    const { pl, it, ball, ln } = tplBuilder('soccer');
    const base = () => [pl('blue', 'B', 81, 35.5), pl('yellow', 'GK', 103.6, 34), it('cone', 70, 18), it('cone', 70, 50), it('teacher', 66, 30)];
    return {
      players: '三人一組（2 攻 1 守）＋守門員', equipment: '足球每組 1 顆、三角錐 2 個', duration: '20 分鐘',
      steps: [
        { name: '傳球給隊友後前插', note: 'A1 帶球逼近防守者，把球傳給 A2（牆），自己立刻從防守者身後前插。傳球用腳內側，力量要平穩。', items: [...base(),
          pl('red', 1, 73, 40), ball(74.6, 41.2), pl('red', 2, 83, 22),
          ln('pass', [74, 39], [82.2, 23.5]), ln('run', [74, 41.5], [90, 40], [83, 48])] },
        { name: '回傳後射門', note: 'A2 一腳把球回傳到 A1 前方的空檔，A1 接球後直接射門。回傳要傳到隊友前面，不是腳下。', items: [...base(),
          pl('red', 1, 90, 40), pl('red', 2, 83, 22), ball(83.8, 23.6),
          ln('pass', [84, 23.2], [89.4, 38.4], [88.5, 28]), ln('pass', [91, 39.4], [104.5, 32.5])] },
      ] };
  } },
  { title: '羽球米字步法', grade: '國小高年級', court: 'badminton', build: () => {
    const { pl, it, ln } = tplBuilder('badminton');
    const pts = [[7.5, 0.8], [7.5, 5.3], [10.3, 0.6], [10.3, 5.5], [12.8, 0.8], [12.8, 5.3]];
    return {
      players: '兩人一組，一人練習一人計時', equipment: '標誌盤 6 個、碼錶', duration: '10 分鐘',
      steps: [
        { name: '中心出發、碰點回位', note: '從場地中心站好預備姿勢，依老師指的方向跨步到標誌盤、碰一下再回到中心。每回合 30 秒，強調回中心時重心放低。', items: [
          ...pts.map(([x, y]) => it('disc', x, y)), pl('red', 1, 10.3, 3.05),
          ...pts.map(([x, y]) => ln('run', [10.3 + (x - 10.3) * 0.18, 3.05 + (y - 3.05) * 0.18], [10.3 + (x - 10.3) * 0.82, 3.05 + (y - 3.05) * 0.82])),
          it('teacher', 4.5, 3.05), pl('white', 2, 13.4 + 1.1, 3.05) ] },
      ] };
  } },
  { title: '敏捷循環站', grade: '國小低年級', court: 'gym', build: () => {
    const { pl, it, ln } = tplBuilder('gym');
    return {
      players: '全班分 4 組，每站 6–7 人', equipment: '繩梯 1 組、跨欄 3 個、呼拉圈 4 個、軟墊 2 張', duration: '每站 3 分鐘，共 12 分鐘',
      steps: [
        { name: '四站輪替', note: '聽哨音換站，依箭頭方向順時針移動。站 1 繩梯小碎步、站 2 雙腳跳過跨欄、站 3 單腳跳呼拉圈、站 4 軟墊上滾翻。跳躍站要等前一位落地才出發。', items: [
          ln('zone', [1, 1], [9, 5.4], null, { label: '站 1 繩梯', color: '#1f5fbf' }), ln('zone', [11, 1], [19, 5.4], null, { label: '站 2 跨欄', color: '#d6332b' }),
          ln('zone', [11, 6.6], [19, 11], null, { label: '站 3 呼拉圈', color: '#1f5fbf' }), ln('zone', [1, 6.6], [9, 11], null, { label: '站 4 軟墊', color: '#d6332b' }),
          it('ladder', 5.5, 3.3, { rot: 90 }), it('hurdle', 13.6, 3.3, { rot: 90 }), it('hurdle', 15.4, 3.3, { rot: 90 }), it('hurdle', 17.2, 3.3, { rot: 90 }),
          it('hoop', 12.9, 9.0), it('hoop', 14.7, 9.0), it('hoop', 16.5, 9.0), it('hoop', 18.2, 9.0),
          it('mat', 4.2, 8.9, { rot: 90 }), it('mat', 6.8, 8.9, { rot: 90, label: '軟墊' }),
          pl('red', 1, 2.2, 3.3), pl('blue', 1, 12, 3.3), pl('yellow', 1, 12, 7.9), pl('green', 1, 2.2, 8.9),
          ln('run', [8.9, 4.8], [11.1, 4.8], [10, 3.9]), ln('run', [11.3, 5.1], [11.3, 6.9], [12.0, 6.0]),
          ln('run', [11.1, 7.2], [8.9, 7.2], [10, 8.1]), ln('run', [8.7, 6.9], [8.7, 5.1], [8.0, 6.0]),
          it('teacher', 10, 6) ] },
      ] };
  } },
  { title: '游泳分道打水練習', grade: '國小中年級', court: 'pool', build: () => {
    const { pl, it, ln } = tplBuilder('pool');
    const teams = ['red', 'blue', 'yellow', 'green'], s1 = [], s2 = [];
    teams.forEach((t, k) => {
      const c = 1.25 + 2.5 * k, out = c - 0.55, ret = c + 0.55;
      const kickA = it('kick', 2.4, out, { rot: 90 }), kickB = it('kick', 2.4, out, { rot: 90 });
      s1.push(pl(t, 1, 1.4, out), kickA, pl(t, 2, -0.9, c - 0.6), pl(t, 3, -0.9, c + 0.6), ln('run', [2.0, out], [22, out]));
      s2.push(pl(t, 1, 22.4, ret), { ...kickA, x: it('kick', 21.4, ret).x, y: it('kick', 21.4, ret).y }, pl(t, 2, 1.4, out), kickB, pl(t, 3, -0.9, c - 0.6),
        ln('run', [21.8, ret], [3, ret]), ln('run', [2.0, out], [12, out]));
    });
    const zone = ln('zone', [0.2, 10.2], [24.8, 14.8], null, { label: '第 5–6 水道 教學示範區', color: '#ffffff' });
    const teacher = it('teacher', 12.5, 16.3);
    return {
      players: '每水道 3 人，共 4 組', equipment: '浮板每人 1 塊', duration: '15 分鐘',
      steps: [
        { name: '第一位出發', note: '每個水道一組。第 1 位扶浮板打水到對岸，第 2、3 位在池邊坐好等待。出發前先確認前方沒有人。', items: [zone, ...s1, teacher] },
        { name: '靠右回程、下一位出發', note: '第 1 位到對岸後，從水道的另一側打水游回來。前一位游過中間 12.5 公尺，下一位才出發。老師站在池邊中段，看得到全部水道。', items: [{ ...zone }, ...s2, { ...teacher }] },
      ] };
  } },
];
export function docFromTemplate(t) {
  const b = t.build();
  return { title: t.title, grade: t.grade, court: t.court, players: b.players, equipment: b.equipment, duration: b.duration,
    iconScale: 1, cur: 0, steps: b.steps.map(s => ({ id: uid(), name: s.name, note: s.note, items: s.items })) };
}
