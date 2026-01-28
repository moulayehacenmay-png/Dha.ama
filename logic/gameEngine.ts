
import { Player, Position, Piece, GameState, MoveRecord } from '../types.ts';

export const BOARD_SIZE = 9;

const isAdjacentStepValid = (r1: number, c1: number, r2: number, c2: number): boolean => {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) return true;
  if (dr === 1 && dc === 1) {
    const isEven = (n: number) => n % 2 === 0;
    const p1Center = !isEven(r1) && !isEven(c1);
    const p1Corner = isEven(r1) && isEven(c1);
    const p2Center = !isEven(r2) && !isEven(c2);
    const p2Corner = isEven(r2) && isEven(c2);
    return (p1Center && p2Corner) || (p1Corner && p2Center);
  }
  return false;
};

export const isValidMove = (gameState: GameState, from: Position, to: Position): boolean => {
  const piece = gameState.board[from.row][from.col];
  if (!piece) return false;
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  if (absDr === 0 && absDc === 0) return false;
  if (to.row < 0 || to.row >= BOARD_SIZE || to.col < 0 || to.col >= BOARD_SIZE) return false;
  if (gameState.board[to.row][to.col]) return false;
  if (dr !== 0 && dc !== 0 && absDr !== absDc) return false;
  const stepR = dr === 0 ? 0 : dr / absDr;
  const stepC = dc === 0 ? 0 : dc / absDc;

  if (piece.isSultan) {
    let currR = from.row, currC = from.col;
    while (currR !== to.row || currC !== to.col) {
      const nextR = currR + stepR, nextC = currC + stepC;
      if (!isAdjacentStepValid(currR, currC, nextR, nextC)) return false;
      if (gameState.board[nextR][nextC]) return false;
      currR = nextR; currC = nextC;
    }
    return true;
  } else {
    if (Math.max(absDr, absDc) !== 1) return false;
    const fwdDir = piece.player === Player.BLACK ? 1 : -1;
    if (stepR !== fwdDir) return false;
    return isAdjacentStepValid(from.row, from.col, to.row, to.col);
  }
};

export const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  let countP1 = 0, countP2 = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c] = { id: `p1-${countP1++}`, player: Player.BLACK, isSultan: false, position: { row: r, col: c } };
    }
  }
  for (let c = 0; c < 4; c++) board[4][c] = { id: `p1-${countP1++}`, player: Player.BLACK, isSultan: false, position: { row: 4, col: c } };
  for (let r = BOARD_SIZE - 1; r > 4; r--) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c] = { id: `p2-${countP2++}`, player: Player.WHITE, isSultan: false, position: { row: r, col: c } };
    }
  }
  for (let c = 5; c < BOARD_SIZE; c++) board[4][c] = { id: `p2-${countP2++}`, player: Player.WHITE, isSultan: false, position: { row: 4, col: c } };
  return board;
};

const findCapturePaths = (
  board: (Piece | null)[][],
  currentPos: Position,
  player: Player,
  isSultan: boolean,
  capturedPositions: string[] = []
): { to: Position; captured: Position[]; total: number; firstStep: Position; firstCaptured: Position }[] => {
  const paths: any[] = [];
  const dirs = [{dr:1,dc:0},{dr:-1,dc:0},{dr:0,dc:1},{dr:0,dc:-1},{dr:1,dc:1},{dr:1,dc:-1},{dr:-1,dc:1},{dr:-1,dc:-1}];

  dirs.forEach(d => {
    let enemyPos: Position | null = null;
    let r = currentPos.row + d.dr, c = currentPos.col + d.dc;
    let gridValid = true;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (!isAdjacentStepValid(r - d.dr, c - d.dc, r, c)) { gridValid = false; break; }
      const pieceAt = board[r][c];
      if (pieceAt) {
        if (pieceAt.player !== player && !capturedPositions.includes(`${r},${c}`)) enemyPos = { row: r, col: c };
        break;
      }
      if (!isSultan) break;
      r += d.dr; c += d.dc;
    }

    if (gridValid && enemyPos) {
      let lr = enemyPos.row + d.dr, lc = enemyPos.col + d.dc;
      while (lr >= 0 && lr < BOARD_SIZE && lc >= 0 && lc < BOARD_SIZE) {
        if (!isAdjacentStepValid(lr - d.dr, lc - d.dc, lr, lc)) break;
        if (board[lr][lc]) break;
        const nextCaptured = [...capturedPositions, `${enemyPos.row},${enemyPos.col}`];
        const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
        newBoard[currentPos.row][currentPos.col] = null;
        newBoard[enemyPos.row][enemyPos.col] = null;
        const subPaths = findCapturePaths(newBoard, { row: lr, col: lc }, player, isSultan, nextCaptured);
        if (subPaths.length > 0) {
          subPaths.forEach(sp => {
            paths.push({ to: sp.to, captured: [enemyPos!, ...sp.captured], total: 1 + sp.total, firstStep: { row: lr, col: lc }, firstCaptured: enemyPos! });
          });
        } else {
          paths.push({ to: { row: lr, col: lc }, captured: [enemyPos], total: 1, firstStep: { row: lr, col: lc }, firstCaptured: enemyPos });
        }
        if (!isSultan) break;
        lr += d.dr; lc += d.dc;
      }
    }
  });
  return paths;
};

export const getLegalMoves = (gameState: GameState): { from: Position; to: Position; captured?: Position; totalCaptures: number; isIntermediate?: boolean }[] => {
  let allCaptureMoves: any[] = [];
  let allRegularMoves: any[] = [];

  const piecesToProcess = gameState.jumpingPiece 
    ? [{ piece: gameState.board[gameState.jumpingPiece.row][gameState.jumpingPiece.col], r: gameState.jumpingPiece.row, c: gameState.jumpingPiece.col }]
    : gameState.board.flatMap((row, r) => row.map((piece, c) => ({ piece, r, c }))).filter(x => x.piece && x.piece.player === gameState.turn);

  piecesToProcess.forEach(({ piece, r, c }) => {
    if (!piece) return;
    const from = { row: r, col: c };
    const capturePaths = findCapturePaths(gameState.board, from, piece.player, piece.isSultan);
    capturePaths.forEach(path => {
      allCaptureMoves.push({
        from,
        to: path.firstStep, 
        captured: path.firstCaptured,
        totalCaptures: path.total, 
        isIntermediate: path.total > 1
      });
    });
  });

  if (allCaptureMoves.length > 0) {
    const maxCaptures = Math.max(...allCaptureMoves.map(m => m.totalCaptures));
    return allCaptureMoves.filter(m => m.totalCaptures === maxCaptures);
  }

  if (gameState.jumpingPiece) return []; 

  gameState.board.forEach((row, r) => {
    row.forEach((piece, c) => {
      if (!piece || piece.player !== gameState.turn) return;
      const from = { row: r, col: c };
      const dirs = [{dr:1,dc:0},{dr:-1,dc:0},{dr:0,dc:1},{dr:0,dc:-1},{dr:1,dc:1},{dr:1,dc:-1},{dr:-1,dc:1},{dr:-1,dc:-1}];
      dirs.forEach(d => {
        let tr = r + d.dr, tc = c + d.dc;
        while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
          const to = { row: tr, col: tc };
          if (isValidMove(gameState, from, to)) allRegularMoves.push({ from, to, totalCaptures: 0 });
          else break;
          if (!piece.isSultan) break;
          tr += d.dr; tc += d.dc;
        }
      });
    });
  });

  return allRegularMoves;
};

export const applyMoveSimple = (gameState: GameState, move: MoveRecord): GameState => {
  const newBoard = gameState.board.map(row => row.map(p => p ? { ...p } : null));
  const piece = newBoard[move.from.row][move.from.col];
  if (!piece) return gameState;

  newBoard[move.from.row][move.from.col] = null;
  piece.position = { ...move.to };
  newBoard[move.to.row][move.to.col] = piece;

  const newCaptures = { ...gameState.captures };
  if (move.captured) {
    newBoard[move.captured.row][move.captured.col] = null;
    newCaptures[move.player]++;
  }

  const tempStateForCheck = { ...gameState, board: newBoard, turn: gameState.turn, jumpingPiece: move.to };
  const legalNow = getLegalMoves(tempStateForCheck);
  const canContinueJumping = move.captured && legalNow.length > 0;

  if (!piece.isSultan && !canContinueJumping) {
    if ((piece.player === Player.BLACK && move.to.row === BOARD_SIZE - 1) || 
        (piece.player === Player.WHITE && move.to.row === 0)) {
      piece.isSultan = true;
    }
  }

  return {
    ...gameState,
    board: newBoard,
    captures: newCaptures,
    jumpingPiece: canContinueJumping ? move.to : null,
    turn: canContinueJumping ? gameState.turn : (gameState.turn === Player.BLACK ? Player.WHITE : Player.BLACK)
  };
};

export const applyMove = (gameState: GameState, from: Position, to: Position): GameState => {
  if (gameState.winner) return gameState;
  const legal = getLegalMoves(gameState);
  const move = legal.find(m => m.from.row === from.row && m.from.col === from.col && m.to.row === to.row && m.to.col === to.col);
  if (!move) return gameState;

  const moveRecord: MoveRecord = { from, to, captured: move.captured, player: gameState.turn };
  const nextState = applyMoveSimple(gameState, moveRecord);
  
  const blackPieces = nextState.board.flat().filter(p => p?.player === Player.BLACK).length;
  const whitePieces = nextState.board.flat().filter(p => p?.player === Player.WHITE).length;
  let winner = null;
  if (whitePieces === 0) winner = Player.BLACK;
  else if (blackPieces === 0) winner = Player.WHITE;
  
  return { ...nextState, winner, history: [...gameState.history, moveRecord] };
};
