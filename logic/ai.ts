
import { GameState, Player, Position, Difficulty } from '../types.ts';
import { getLegalMoves, applyMove } from './gameEngine.ts';

export const evaluateBoard = (state: GameState, aiPlayer: Player): number => {
  if (state.winner === aiPlayer) return 10000;
  if (state.winner === Player.NONE) return 0;
  if (state.winner && state.winner !== aiPlayer) return -10000;

  let score = 0;
  state.board.forEach((row, r) => {
    row.forEach((piece) => {
      if (!piece) return;
      
      let val = piece.isSultan ? 80 : 15;
      
      if (piece.position.col === 0 || piece.position.col === 8) val += 2;
      
      if (!piece.isSultan) {
        const progress = piece.player === Player.BLACK ? r : (8 - r);
        val += progress * 1;
      }

      if (piece.player === aiPlayer) score += val;
      else score -= val;
    });
  });

  return score;
};

const minimax = (
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number => {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, aiPlayer);
  }

  const moves = getLegalMoves(state);
  if (moves.length === 0) return isMaximizing ? -5000 : 5000;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move.from, move.to);
      const isNextMax = nextState.turn === state.turn;
      const evaluation = minimax(nextState, isNextMax ? depth : depth - 1, alpha, beta, isNextMax, aiPlayer);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move.from, move.to);
      const isNextMax = nextState.turn !== state.turn;
      const evaluation = minimax(nextState, isNextMax ? depth - 1 : depth, alpha, beta, isNextMax, aiPlayer);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (state: GameState, difficulty: Difficulty = Difficulty.MEDIUM): { from: Position; to: Position } | null => {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;

  let depth = 2;
  if (difficulty === Difficulty.EASY) depth = 1;
  if (difficulty === Difficulty.MEDIUM) depth = 3;
  if (difficulty === Difficulty.HARD) depth = 5;

  const maxCaptures = Math.max(...moves.map(m => m.totalCaptures || 0));
  const candidateMoves = moves.filter(m => (m.totalCaptures || 0) === maxCaptures);

  let bestMove = null;
  let bestValue = -Infinity;
  const aiPlayer = state.turn;

  for (const move of candidateMoves) {
    const nextState = applyMove(state, move.from, move.to);
    const isNextMax = nextState.turn === state.turn;
    const boardValue = minimax(nextState, depth - 1, -Infinity, Infinity, isNextMax, aiPlayer);
    
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove;
};
