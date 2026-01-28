
import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, Position, Player, Piece } from '../types.ts';
import { BOARD_SIZE, applyMove, getLegalMoves } from '../logic/gameEngine.ts';

interface GameBoardProps {
  room: GameRoom;
  onUpdateRoom: (room: GameRoom) => void;
  currentPlayerId: string;
  isReadOnly?: boolean;
  timeLeft?: number;
}

interface AnimationState {
  from: Position; to: Position; piece: Piece;
  captured?: Position; capturedPlayer?: Player;
  startTime: number; duration: number;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const GameBoard: React.FC<GameBoardProps> = ({ room, onUpdateRoom, currentPlayerId, isReadOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validTargets, setValidTargets] = useState<Position[]>([]);
  const [animatingMove, setAnimatingMove] = useState<AnimationState | null>(null);
  const lastHistoryLength = useRef(room.state.history?.length || 0);

  // جعل المستخدم دائما في الأسفل. 
  // بما أن الأسود (Player.BLACK) يبدأ في الصفوف 0-4 (الأعلى)، يجب قلب الرقعة له ليظهر في الأسفل.
  // أما الأبيض (Player.WHITE) فيبدأ في 5-8 (الأسفل)، لذا يبقى بدون قلب.
  const isFlipped = room.players[Player.BLACK]?.uid === currentPlayerId;

  useEffect(() => {
    if (room.state.jumpingPiece && !isReadOnly) {
      const jp = room.state.jumpingPiece;
      const moves = getLegalMoves(room.state);
      setSelectedPos(jp);
      setValidTargets(moves.map(m => m.to));
    }
  }, [room.state.jumpingPiece, isReadOnly]);

  const toScreen = (pos: Position): Position => {
    if (!isFlipped) return pos;
    return { row: (BOARD_SIZE - 1) - pos.row, col: (BOARD_SIZE - 1) - pos.col };
  };

  const toLogic = (row: number, col: number): Position => {
    if (!isFlipped) return { row, col };
    return { row: (BOARD_SIZE - 1) - row, col: (BOARD_SIZE - 1) - col };
  };

  useEffect(() => {
    if (isReadOnly) { 
      setAnimatingMove(null); 
      setSelectedPos(null);
      setValidTargets([]);
      return; 
    }
    const currentHistoryLen = room.state.history?.length || 0;
    if (currentHistoryLen > lastHistoryLength.current) {
      const lastMove = room.state.history[currentHistoryLen - 1];
      const piece = room.state.board[lastMove.to.row][lastMove.to.col];
      if (piece) {
        setAnimatingMove({
          from: lastMove.from, to: lastMove.to, piece: piece,
          captured: lastMove.captured, capturedPlayer: piece.player === Player.BLACK ? Player.WHITE : Player.BLACK,
          startTime: performance.now(), 
          duration: 200, 
        });
      }
    }
    lastHistoryLength.current = currentHistoryLen;
  }, [room.state.history, isReadOnly]);

  useEffect(() => {
    const animate = (time: number) => { drawBoard(time); requestAnimationFrame(animate); };
    const req = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(req);
  }, [room.state, selectedPos, validTargets, animatingMove, isFlipped, isReadOnly]);

  const drawBoard = (time: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const size = canvas.width;
    const padding = size * 0.1;
    const step = (size - 2 * padding) / (BOARD_SIZE - 1);
    if (!room.state || !room.state.board) return;
    ctx.clearRect(0, 0, size, size);
    
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#d9c077';
    ctx.beginPath(); ctx.roundRect(10, 10, size - 20, size - 20, 30); ctx.fill();
    ctx.shadowBlur = 0;

    const bg = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
    bg.addColorStop(0, '#fdfcf0'); bg.addColorStop(1, '#f3e5ab');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(padding * 0.3, padding * 0.3, size - padding * 0.6, size - padding * 0.6, 25); ctx.fill();

    ctx.lineWidth = 2.5;
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = padding + i * step;
      ctx.strokeStyle = 'rgba(60, 30, 10, 0.4)';
      ctx.beginPath(); ctx.moveTo(pos, padding); ctx.lineTo(pos, size - padding); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padding, pos); ctx.lineTo(size - padding, pos); ctx.stroke();
    }

    const blockSize = step * 2;
    ctx.lineWidth = 1.2;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x1 = padding + col * blockSize, y1 = padding + row * blockSize;
        const x2 = x1 + blockSize, y2 = y1 + blockSize;
        ctx.strokeStyle = 'rgba(60, 30, 10, 0.2)';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x1, y2); ctx.stroke();
      }
    }

    ctx.fillStyle = 'rgba(60, 30, 10, 0.7)';
    ctx.font = `bold ${size * 0.022}px Aref Ruqaa`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط'];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = padding + i * step;
      ctx.fillText(isFlipped ? arabicLetters[8-i] : arabicLetters[i], pos, size - padding * 0.5);
      ctx.fillText(isFlipped ? (i+1).toString() : (9-i).toString(), padding * 0.5, pos);
    }

    room.state.board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (!piece || (animatingMove && r === animatingMove.to.row && c === animatingMove.to.col)) return;
        const sPos = toScreen({ row: r, col: c });
        drawPiece(ctx, piece, padding + sPos.col * step, padding + sPos.row * step, step, 1);
      });
    });

    if (animatingMove) {
      const progress = Math.min(1, (time - animatingMove.startTime) / animatingMove.duration);
      const eased = easeOutCubic(progress);
      const sFrom = toScreen(animatingMove.from), sTo = toScreen(animatingMove.to);
      const startX = padding + sFrom.col * step, startY = padding + sFrom.row * step;
      const endX = padding + sTo.col * step, endY = padding + sTo.row * step;
      const currentX = startX + (endX - startX) * eased, currentY = startY + (endY - startY) * eased;
      drawPiece(ctx, animatingMove.piece, currentX, currentY, step, 1);
      if (progress >= 1) setAnimatingMove(null);
    }

    if (selectedPos && !isReadOnly) {
      const sPos = toScreen(selectedPos);
      ctx.strokeStyle = '#c5a059'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(padding + sPos.col * step, padding + sPos.row * step, step * 0.35, 0, Math.PI * 2); ctx.stroke();
      
      validTargets.forEach(t => {
        const ts = toScreen(t);
        ctx.fillStyle = 'rgba(197, 160, 89, 0.5)';
        ctx.beginPath(); ctx.arc(padding + ts.col * step, padding + ts.row * step, step * 0.15, 0, Math.PI * 2); ctx.fill();
      });
    }
  };

  const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, step: number, alpha: number) => {
    ctx.save(); ctx.globalAlpha = alpha;
    const radius = step * 0.32; 
    const color = room.colors[piece.player] || (piece.player === Player.BLACK ? '#1a1a1a' : '#f9fafb');
    
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetY = 4;
    
    const grad = ctx.createRadialGradient(x - radius/3, y - radius/3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, lightenColor(color, 40)); 
    grad.addColorStop(0.6, color); 
    grad.addColorStop(1, darkenColor(color, 30));
    
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();

    if (piece.isSultan) {
      ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.fillStyle = '#fbbf24'; ctx.font = `bold ${step*0.4}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👑', x, y);
    }
    ctx.restore();
  };

  const lightenColor = (hex: string, amt: number) => {
    let usePound = false; if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amt; if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt; if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt; if (g > 255) g = 255; else if (g < 0) g = 0;
    let res = (g | (b << 8) | (r << 16)).toString(16);
    while (res.length < 6) res = "0" + res;
    return (usePound ? "#" : "") + res;
  };
  const darkenColor = (hex: string, amt: number) => lightenColor(hex, -amt);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly || room.state.winner || animatingMove) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scale = canvas.width / rect.width;
    const x = (clientX - rect.left) * scale, y = (clientY - rect.top) * scale;
    const padding = canvas.width * 0.1, step = (canvas.width - 2 * padding) / (BOARD_SIZE - 1);
    const col = Math.round((x - padding) / step), row = Math.round((y - padding) / step);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

    const logicPos = toLogic(row, col);

    if (room.state.jumpingPiece) {
      if (selectedPos && validTargets.some(t => t.row === logicPos.row && t.col === logicPos.col)) {
        onUpdateRoom({ ...room, state: applyMove(room.state, selectedPos, logicPos) });
      }
      return;
    }

    if (selectedPos && validTargets.some(t => t.row === logicPos.row && t.col === logicPos.col)) {
      onUpdateRoom({ ...room, state: applyMove(room.state, selectedPos, logicPos) });
      setSelectedPos(null); setValidTargets([]);
    } else {
      const p = room.state.board[logicPos.row][logicPos.col];
      if (p && p.player === room.state.turn) {
        const moves = getLegalMoves(room.state).filter(m => m.from.row === logicPos.row && m.from.col === logicPos.col);
        if (moves.length > 0) { setSelectedPos(logicPos); setValidTargets(moves.map(m => m.to)); }
      }
    }
  };

  return (
    <div className="w-full max-w-[min(90vw,600px)] aspect-square relative touch-none select-none">
      <canvas ref={canvasRef} width={1000} height={1000} className="w-full h-full rounded-3xl" onClick={handleClick} onTouchStart={handleClick} />
    </div>
  );
};

export default GameBoard;
