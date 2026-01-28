
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, UserProfile, GameRoom, GameState, Difficulty } from './types.ts';
import { createInitialBoard, applyMove, applyMoveSimple } from './logic/gameEngine.ts';
import { getBestMove, evaluateBoard } from './logic/ai.ts';
import GameBoard from './components/GameBoard.tsx';
import Lobby from './components/Lobby.tsx';
import Auth from './components/Auth.tsx';

const TURN_TIME_LIMIT = 60;

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [isAIGame, setIsAIGame] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  
  const [previewStep, setPreviewStep] = useState<number | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_LIMIT);
  const [drawRequest, setDrawRequest] = useState<Player | null>(null);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setUser({ uid: 'demo-user-1', username: 'ضيف_الظامة', stats: { wins: 5, losses: 2, draws: 1 } });
  }, []);

  useEffect(() => {
    if (activeRoom && activeRoom.status === 'active' && !activeRoom.state.winner && previewStep === null) {
      setTimeLeft(TURN_TIME_LIMIT);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(p => p <= 1 ? (handleTimeout(), 0) : p - 1);
      }, 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeRoom?.state.turn, activeRoom?.state.jumpingPiece, activeRoom?.status, activeRoom?.state.winner, previewStep]);

  const handleTimeout = () => {
    if (!activeRoom || activeRoom.state.winner) return;
    const winner = activeRoom.state.turn === Player.BLACK ? Player.WHITE : Player.BLACK;
    setActiveRoom(prev => prev ? { ...prev, state: { ...prev.state, winner } } : null);
  };

  const gameHistoryStates = useMemo(() => {
    if (!activeRoom) return [];
    let state: GameState = {
      board: createInitialBoard(),
      turn: Player.BLACK,
      winner: null,
      history: [],
      captures: { [Player.BLACK]: 0, [Player.WHITE]: 0 },
      jumpingPiece: null
    };
    const states: GameState[] = [{ ...state }];
    activeRoom.state.history.forEach((move) => {
      state = applyMoveSimple(state, move);
      states.push({ ...state });
    });
    return states;
  }, [activeRoom?.state.history]);

  useEffect(() => {
    if (isAIGame && activeRoom && activeRoom.state.turn === Player.WHITE && !activeRoom.state.winner && !aiThinking && previewStep === null) {
      const runAi = async () => {
        setAiThinking(true);
        await new Promise(r => setTimeout(r, 300));
        const move = getBestMove(activeRoom.state, activeRoom.difficulty);
        if (move) setActiveRoom(p => p ? { ...p, state: applyMove(p.state, move.from, move.to) } : null);
        setAiThinking(false);
      };
      runAi();
    }
  }, [activeRoom?.state.turn, activeRoom?.state.jumpingPiece, isAIGame, activeRoom?.state.winner, previewStep]);

  const handleStartNewGame = (config: { aiDiff?: Difficulty, colors: { [key in Player]: string }, starter: Player }) => {
    setActiveRoom({
      id: 'g-' + Date.now(),
      players: { 
        [Player.BLACK]: user!, 
        [Player.WHITE]: { 
          uid: config.aiDiff ? 'ai' : 'p2', 
          username: config.aiDiff ? 'الذكاء الآلي' : 'الخصم', 
          stats: { wins:0, losses:0, draws:0 } 
        } 
      },
      status: 'active',
      state: { 
        board: createInitialBoard(), 
        turn: config.starter, 
        winner: null, 
        history: [], 
        captures: { [Player.BLACK]: 0, [Player.WHITE]: 0 }, 
        jumpingPiece: null 
      },
      createdAt: Date.now(),
      difficulty: config.aiDiff,
      colors: config.colors
    });
    setIsAIGame(!!config.aiDiff);
    setPreviewStep(null);
    setDrawRequest(null);
    setShowSurrenderConfirm(false);
  };

  const handleOfferDraw = () => {
    if (!activeRoom) return;
    if (isAIGame) {
      const score = evaluateBoard(activeRoom.state, Player.WHITE);
      if (Math.abs(score) < 50 || activeRoom.state.history.length > 80) {
        alert("الذكاء الاصطناعي يقبل التعادل.");
        setActiveRoom(p => p ? { ...p, state: { ...p.state, winner: Player.NONE } } : null);
      } else {
        alert("الذكاء الاصطناعي يرفض التعادل، المعركة مستمرة!");
      }
    } else {
      setDrawRequest(activeRoom.state.turn);
    }
  };

  const confirmSurrender = () => {
    if (!activeRoom || activeRoom.state.winner) return;
    const currentTurn = activeRoom.state.turn;
    const winner = currentTurn === Player.BLACK ? Player.WHITE : Player.BLACK;
    setActiveRoom(prev => prev ? { ...prev, state: { ...prev.state, winner } } : null);
    setShowSurrenderConfirm(false);
  };

  const handleAcceptDraw = () => {
    setActiveRoom(p => p ? { ...p, state: { ...p.state, winner: Player.NONE } } : null);
    setDrawRequest(null);
  };

  if (!user) return <Auth onLogin={setUser} />;

  const currentDisplayState = (previewStep !== null && gameHistoryStates[previewStep]) 
    ? gameHistoryStates[previewStep] 
    : activeRoom?.state;

  // تحديد الأدوار لعرض البيانات بشكل صحيح (المستخدم دائماً في الأسفل)
  const userRole = activeRoom?.players[Player.BLACK]?.uid === user.uid ? Player.BLACK : Player.WHITE;
  const opponentRole = userRole === Player.BLACK ? Player.WHITE : Player.BLACK;

  return (
    <div className="min-h-screen flex flex-col relative animate-fade-in">
      <nav className="glass-card sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-amber-200/50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveRoom(null)}>
          <div className="bg-amber-800 text-white w-10 h-10 flex items-center justify-center rounded-xl aref text-2xl shadow-lg">ظ</div>
          <h1 className="text-xl font-black aref text-amber-950">الظامة</h1>
        </div>
        <div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-800">{user.username}</span></div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {!activeRoom ? (
          <Lobby 
            user={user} 
            onJoinRoom={setActiveRoom} 
            onStartLocal={(colors, starter) => handleStartNewGame({ colors, starter })} 
            onStartAI={(aiDiff, colors, starter) => handleStartNewGame({ aiDiff, colors, starter })} 
          />
        ) : (
          <div className="w-full flex flex-col items-center max-w-4xl">
            {currentDisplayState && (
              <>
                {/* لوحة الخصم - دائماً في الأعلى */}
                <div className={`w-full max-w-md p-4 mb-4 rounded-3xl glass-card border-2 transition-all ${currentDisplayState.turn === opponentRole ? 'border-amber-500 scale-105 shadow-xl' : 'opacity-60 border-transparent'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: activeRoom.colors[opponentRole]}} />
                      {isAIGame ? (opponentRole === Player.WHITE ? 'الذكاء الآلي' : 'الخصم') : 'الخصم'}: {currentDisplayState.captures[opponentRole]}
                    </span>
                    {currentDisplayState.turn === opponentRole && previewStep === null && <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full animate-pulse">{timeLeft}ث</span>}
                  </div>
                </div>

                <GameBoard 
                  room={{ ...activeRoom, state: currentDisplayState }} 
                  onUpdateRoom={r => { if (previewStep === null) setActiveRoom(r); }} 
                  currentPlayerId={user.uid}
                  isReadOnly={previewStep !== null}
                  timeLeft={timeLeft}
                />

                {/* لوحة المستخدم - دائماً في الأسفل */}
                <div className={`w-full max-w-md p-4 mt-4 rounded-3xl glass-card border-2 transition-all ${currentDisplayState.turn === userRole ? 'border-amber-500 scale-105 shadow-xl' : 'opacity-60 border-transparent'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: activeRoom.colors[userRole]}} />
                      {isAIGame ? (userRole === Player.BLACK ? 'أنت' : 'اللاعب') : 'أنت'}: {currentDisplayState.captures[userRole]}
                    </span>
                    {currentDisplayState.turn === userRole && previewStep === null && <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full animate-pulse">{timeLeft}ث</span>}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowHistoryDrawer(true)} className="bg-white p-4 rounded-2xl shadow-lg border border-amber-100 hover:scale-110 transition-all" title="السجل">📜</button>
              <button onClick={handleOfferDraw} className="bg-white p-4 rounded-2xl shadow-lg border border-amber-100 hover:scale-110 transition-all" title="طلب تعادل">🤝</button>
              <button onClick={() => setShowSurrenderConfirm(true)} className="bg-red-50 p-4 rounded-2xl shadow-lg border border-red-100 hover:scale-110 transition-all" title="استسلام">🏳️</button>
            </div>
          </div>
        )}
      </main>

      {/* نافذة تأكيد الاستسلام */}
      {showSurrenderConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 rounded-[2rem] text-center max-w-xs w-full shadow-2xl border-t-8 border-red-600">
            <div className="text-5xl mb-4">🏳️</div>
            <h3 className="text-2xl font-black aref mb-4">هل تعلن الاستسلام؟</h3>
            <p className="mb-6 font-bold text-slate-600">بمجرد الاستسلام، ستعتبر خاسراً في هذه الجولة.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmSurrender} className="bg-red-600 text-white py-4 rounded-xl font-black shadow-lg">نعم، أستسلم</button>
              <button onClick={() => setShowSurrenderConfirm(false)} className="bg-slate-200 text-slate-700 py-3 rounded-xl font-bold">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {drawRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 rounded-[2rem] text-center max-w-xs w-full shadow-2xl border-t-8 border-amber-600">
            <h3 className="text-2xl font-black aref mb-4">طلب صلح؟</h3>
            <p className="mb-6 font-bold text-slate-600">يعرض الخصم إنهاء النزال بالتعادل.</p>
            <div className="flex gap-3">
              <button onClick={handleAcceptDraw} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">قبول</button>
              <button onClick={() => setDrawRequest(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold">رفض</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistoryDrawer(false)} />
          <div className="relative w-80 bg-white shadow-2xl flex flex-col animate-slide-up h-full">
            <div className="p-6 bg-amber-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">سجل النزال</h3>
              <button onClick={() => setShowHistoryDrawer(false)}>✕</button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              <button onClick={() => {setPreviewStep(0); setShowHistoryDrawer(false);}} className={`w-full p-3 rounded-xl border text-right ${previewStep === 0 ? 'bg-amber-100 border-amber-500' : ''}`}>بداية النزال</button>
              {activeRoom?.state.history.map((m, i) => (
                <button key={i} onClick={() => {setPreviewStep(i+1); setShowHistoryDrawer(false);}} className={`w-full p-3 rounded-xl border text-right flex justify-between ${previewStep === i+1 ? 'bg-amber-100 border-amber-500' : ''}`}>
                  <span>حركة #{i+1}</span>
                  <span className="aref">{String.fromCharCode(65 + m.from.col)}{m.from.row+1} ➜ {String.fromCharCode(65 + m.to.col)}{m.to.row+1}</span>
                </button>
              ))}
            </div>
            {previewStep !== null && <button onClick={() => setPreviewStep(null)} className="m-4 bg-amber-800 text-white py-3 rounded-xl font-bold">العودة للعب</button>}
          </div>
        </div>
      )}

      {activeRoom?.state.winner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-6">
          <div className="bg-white rounded-[3rem] p-10 text-center shadow-2xl border-t-8 border-amber-700 max-w-sm w-full">
            {activeRoom.state.winner === Player.NONE ? (
              <>
                <div className="text-6xl mb-4">🤝</div>
                <h2 className="text-3xl font-black aref text-amber-950 mb-2">تعادل!</h2>
                <p className="mb-8 font-bold text-slate-500">تم الصلح والاتفاق على التعادل.</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-black aref text-amber-950 mb-2">نهاية النزال</h2>
                <p className="mb-8 font-bold text-slate-500">
                  {isAIGame 
                    ? (activeRoom.state.winner === userRole ? 'لقد انتصرت في المعركة!' : 'تفوّق الذكاء الاصطناعي في هذا النزال.')
                    : (activeRoom.state.winner === Player.BLACK ? 'الفوز للاعب الأول!' : 'الفوز للاعب الثاني!')
                  }
                </p>
              </>
            )}
            <button onClick={() => setActiveRoom(null)} className="w-full bg-amber-900 text-white py-4 rounded-2xl font-black shadow-lg">العودة للمجلس</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
