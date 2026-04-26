# Battleship Game - Bug Tracking

This document tracks bugs discovered during QA testing and their fixes.

## Bug #1: AI Target Queue Contains Duplicate Cells

**Symptom:** The AI sometimes fires at the same cell twice when in target mode, even though the cell was already tried.

**Root Cause:** In `gameReducer.ts`, when the AI hits a ship, adjacent cells are added to the target queue without checking if they're already in the queue or have been tried before.

**Fix:** Modified the `AI_SHOT` case in `gameReducer.ts` to filter out already-tried cells when adding adjacent cells to the target queue, and to remove invalid cells from the queue when encountered.

---

## Bug #2: Ship Sunk Detection Not Triggering Win Condition Immediately

**Symptom:** When the last ship is sunk, the game continues for one more turn before showing the win screen.

**Root Cause:** The win condition check happens after the shot is processed, but the game status is set to the next turn before checking for win.

**Fix:** Updated the win condition logic in both `PLAYER_SHOT` and `AI_SHOT` cases to immediately set the game status to the appropriate win state when all ships are sunk.

---

## Bug #3: AI Target Mode Gets Stuck on Board Edges

**Symptom:** When a ship is hit near the board edge, the AI's target mode sometimes gets stuck trying to fire at invalid positions outside the board.

**Root Cause:** The adjacent cell calculation in `gameReducer.ts` doesn't properly filter out cells that would be outside the 10x10 board boundaries.

**Fix:** Added proper boundary checks (r >= 0 && r < 10 && c >= 0 && c < 10) when calculating adjacent cells for the AI target queue.

---

## Bug #4: Ship Placement Fails on Very Rare Occasions

**Symptom:** In extremely rare cases, ship placement fails with an error "Failed to place ship after 100 attempts".

**Root Cause:** The random ship placement algorithm can get into situations where the remaining space cannot accommodate the remaining ships due to previous placements.

**Fix:** Increased the maximum attempts from 100 to 1000 and added better error handling. Also improved the placement algorithm to try different orientations more systematically.

---

## Bug #5: Click Handler Fires After Game End

**Symptom:** After the game ends, clicking on the AI grid still triggers the click handler and shows console errors.

**Root Cause:** The `isClickable` prop in the Board component only checks for `playerTurn` status, not for game over states.

**Fix:** Updated the `isClickable` condition in `App.tsx` to also exclude game over states: `gameState.gameStatus === 'playerTurn' && !isGameOver`.

---

## Bug #6: AI Hunt Mode Not Optimal on Small Boards

**Symptom:** The AI's hunt mode sometimes wastes shots by not using a checkerboard pattern, reducing its efficiency.

**Root Cause:** The original hunt mode picked completely random cells, which is less efficient than a systematic pattern.

**Fix:** Modified the `getAIShot` function in `aiPlayer.ts` to prefer checkerboard pattern cells first (where row + col is even), which guarantees finding any ship in fewer shots.

---

## Bug #7: Visual Feedback Delay on Ship Sunk

**Symptom:** When a ship is sunk, the visual feedback (all cells turning red) doesn't happen immediately, only after the next turn.

**Root Cause:** The ship sunk detection and visual update were separated in the reducer logic.

**Fix:** Consolidated the ship sunk detection and visual update in the same reducer action, so all cells of a sunk ship immediately turn to 'sunk' status when the last hit is registered.
