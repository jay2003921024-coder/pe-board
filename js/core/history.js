// 復原／重做堆疊：存 JSON 快照，上限 limit 筆（舊版 pushUndo／doUndo／doRedo）。
export function createHistory({ limit = 80 } = {}) {
  let undoStack = [], redoStack = [];
  return {
    // 修改前呼叫：存下修改前的快照，並清空重做。
    push(json) { undoStack.push(json); if (undoStack.length > limit) undoStack.shift(); redoStack = []; },
    // 傳入目前的快照，回傳要還原的快照；沒有可復原時回 null。
    undo(currentJson) { if (!undoStack.length) return null; redoStack.push(currentJson); return undoStack.pop(); },
    redo(currentJson) { if (!redoStack.length) return null; undoStack.push(currentJson); return redoStack.pop(); },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    // 取消剛剛 push 的那一筆（拖曳畫出的線太短被丟掉時）。
    popLast() { undoStack.pop(); },
    clear() { undoStack = []; redoStack = []; },
  };
}
