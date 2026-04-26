# Battleship Game - Bug Tracking

This document tracks bugs discovered during QA testing and their fixes.

## Bug #1: Build Fails Due to Unused TypeScript Imports

**Symptom:** Running `npm run build` fails with three `TS6133` errors — the project cannot compile or deploy.

**Root Cause:** Two source files imported symbols they never used:
- `src/components/Cell.tsx` imported `CellStatus` (unused).
- `src/gameReducer.ts` imported `ShipType` and `SHIP_SIZES` (unused).

TypeScript strict mode (`noUnusedLocals` / default tsconfig settings) treats these as errors.

**Fix:** Removed the unused imports from both files so the build completes cleanly.

---

## Bug #2: AI Target Queue Accumulates Stale Entries

**Symptom:** After the AI fires at a cell from its target queue, that cell remains in the queue. On subsequent turns the AI re-encounters the stale entry and must skip it via a recursive fallback in `getAIShot`. Over the course of a game the queue grows with dead entries, wasting cycles and making the AI slower to pick its next shot.

**Root Cause:** In `gameReducer.ts`, the `AI_SHOT` case copied the target queue (`[...state.aiTargetQueue]`) without removing the cell that was just fired at. Only on a miss was a separate filter applied, and even that only removed the position if it happened to still be in the queue.

**Fix:** Changed the queue initialization in `AI_SHOT` to immediately filter out the current shot coordinates:
```ts
let aiTargetQueue = state.aiTargetQueue.filter(([r, c]) => r !== row || c !== col);
```
This ensures every consumed cell is removed in one place, keeping the queue clean.

---

## Bug #3: AI Stays in Target Mode with Empty Queue

**Symptom:** When the AI is in target mode and all queued cells have been tried, it stays in `target` mode with an empty queue instead of reverting to `hunt` mode. This causes `getAIShot` to fall through to random hunt-mode selection anyway, but the `aiMode` state is stale.

**Root Cause:** The miss branch in `AI_SHOT` only removed the current position from the queue but never checked whether the queue was now empty. If the last target-mode shot was a miss, `aiMode` remained `'target'`.

**Fix:** After a miss in target mode, check if the queue is empty and reset to hunt mode:
```ts
if (aiMode === 'target' && aiTargetQueue.length === 0) {
  aiMode = 'hunt';
}
```

---

## Bug #4: Dead-Code Ternary in AI_SHOT State Transition

**Symptom:** No user-visible impact, but the code is misleading and could mask future regressions.

**Root Cause:** `checkWinCondition` returns `'playerTurn'`, `'playerWon'`, or `'aiWon'` — it never returns `'aiTurn'`. The original line:
```ts
gameStatus: gameStatus === 'aiTurn' ? 'playerTurn' : gameStatus
```
always evaluates to `gameStatus` (the condition is never true), making the ternary a no-op.

**Fix:** Changed the condition to match the actual return value:
```ts
gameStatus: gameStatus === 'playerTurn' ? 'playerTurn' : gameStatus
```
This makes the intent clear: if no winner, transition to `playerTurn`; otherwise use the win status.

---

## Bug #5: Clicks Accepted on Already-Shot Cells (AI Board)

**Symptom:** During the player's turn, clicking on a cell that is already `hit`, `miss`, or `sunk` on the AI board still fires the click handler. The reducer silently rejects duplicate shots, but the cursor shows a pointer and the cell has a hover effect, misleading the player into thinking they can fire there.

**Root Cause:** The `Cell` component's click guard only checked the `isClickable` prop (true whenever it's the player's turn) without considering the cell's own status.

**Fix:** Added an `isAlreadyShot` check in `Cell.tsx`:
```ts
const isAlreadyShot = cell.status === 'hit' || cell.status === 'miss' || cell.status === 'sunk';
const canClick = isClickable && !isAlreadyShot;
```
Already-shot cells now show `cursor-not-allowed` and ignore clicks.

---

## Bug #6: Favicon 404 on GitHub Pages

**Symptom:** The browser console shows a 404 for `/vite.svg` when the app is deployed to GitHub Pages at the `/Battleship-game/` subpath, because the `<link>` tag uses an absolute path that doesn't account for the base URL.

**Root Cause:** `index.html` had `<link rel="icon" href="/vite.svg" />`. On GitHub Pages, the app is served from `/Battleship-game/`, so the browser requests `/vite.svg` which doesn't exist.

**Fix:** Replaced the external SVG reference with an inline data URI using a ship emoji, which works regardless of the deployment path.

---

## Bug #7: No Grid Labels on Game Boards

**Symptom:** The 10×10 boards have no row or column labels, making it hard for players to reference specific cells or communicate positions.

**Root Cause:** The `Board` component rendered only the grid cells without any header row or row labels.

**Fix:** Added column labels (A–J) across the top and row labels (1–10) along the left side of each board in `Board.tsx`.

---

---

## Bug #8: Placement Status Messages Missing Ship Size

**Symptom:** After placing a ship during the manual placement phase, the status message said "Place your Battleship." without indicating the ship's size, while the initial message said "Place your Carrier (5 cells)." — inconsistent messaging made it harder for new players to know how many cells the next ship would occupy.

**Root Cause:** The PLACE_SHIP_MANUAL, PICK_UP_SHIP, and RESET_PLACEMENT reducer actions each built their own message strings using inline string formatting, without including the ship size. Only the initial state in App.tsx included the size.

**Fix:** Created a shared `placementMessage()` helper and `SHIP_LABELS` lookup in `gameReducer.ts` to produce consistent messages like "Place your Battleship (4 cells)." across all placement actions.

---

## Bug #9: Desktop Placement Required Two Clicks Instead of One

**Symptom:** On desktop, clicking a cell to place a ship required two clicks — one to show the preview, one to confirm — even though the hover preview was already visible via `mouseEnter`. This made the placement feel sluggish on desktop.

**Root Cause:** The initial mobile tap-to-place implementation checked if `hoverCell` matched the clicked cell before placing. On desktop, `mouseEnter` fires before `click`, so `hoverCell` was already set by the time the click arrived. However, the first click was consumed by `SET_HOVER` instead of `PLACE_SHIP_MANUAL` because the `handlePlacementClick` only dispatched `PLACE_SHIP_MANUAL` when `hoverCell` already matched, but didn't account for the desktop hover flow.

**Fix:** Updated `handlePlacementClick` to check if `hoverCell` already matches the clicked cell (desktop via mouseEnter) and place immediately. If not (mobile with no hover), it sets the hover first, requiring a second tap to confirm. This gives single-click placement on desktop and tap-to-preview on mobile.

---

## QA Pass: Manual Placement Feature (Bugs #8–#9)

**Test scenarios verified (no additional bugs found):**
- Placing ships at board edges with both horizontal and vertical orientations — preview correctly shows red when ship extends off-board
- Overlapping placement blocked — preview shows red when hovering over occupied cells
- Pick up and replace already-placed ships — board state cleans up correctly, ship returns to selection
- Auto-Place with 0, some, and all ships already placed — preserves manual placements
- Reset button clears board and resets to first ship selection
- Rotation near board edge — preview correctly marks invalid placements
- Start Game disabled until all 5 ships placed, enabled once all placed
- Play Again returns to placement phase with empty grid (not auto-start)

*Bugs #8–#9 were discovered during QA testing of the manual ship placement feature.*
