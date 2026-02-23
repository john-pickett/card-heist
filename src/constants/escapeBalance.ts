/**
 * These settings below result in a 55% capture rate
 * Test this and see how it plays
 * Edit this message before making any changes to these settings
 * and include the capture rate you see in testing
 */
export const ESCAPE_PATH_LENGTH = 7;
export const ESCAPE_EXIT_POSITION = 1;
export const ESCAPE_PLAYER_START_POSITION = 6;
export const ESCAPE_POLICE_START_POSITION = 7;

export const ESCAPE_POLICE_AUTO_MOVE_CHANCE_BY_PLAYER_TURN = [
  0,   // after player turn 1
  50,  // after player turn 2
  100,  // after player turn 3
  100,  // after player turn 4
  100,  // after player turn 5
  100, // after player turn 6+
] as const;

export const ESCAPE_POLICE_DISCARDS_PER_EXTRA_MOVE = 2;
export const ESCAPE_POLICE_ALERT_THRESHOLD = 3;

export function getEscapePoliceAutoMoveChancePct(playerTurnsCompleted: number): number {
  if (playerTurnsCompleted <= 0) return 0;
  const idx = Math.min(
    playerTurnsCompleted - 1,
    ESCAPE_POLICE_AUTO_MOVE_CHANCE_BY_PLAYER_TURN.length - 1,
  );
  return ESCAPE_POLICE_AUTO_MOVE_CHANCE_BY_PLAYER_TURN[idx] ?? 0;
}
