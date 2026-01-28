
import React, { useState } from 'react';
import { UserProfile, GameRoom, Difficulty, Player } from '../types.ts';

interface LobbyProps {
  user: UserProfile;
  onJoinRoom: (room: GameRoom) => void;
  onStartLocal: (colors: { [key in Player]: string }, starter: Player) => void;
  onStartAI: (diff: Difficulty, colors: { [key in Player]: string }, starter: Player) => void;
}

const COLOR_PALETTE = [
  { name: 'فحمي', hex: '#1a1a1a' }, { name: 'ثلجي', hex: '#f9fafb' },
  { name: 'ياقوتي', hex: '#991b1b' }, { name: 'زمردي', hex: '#065f46' },
  { name: 'لازوردي', hex: '#1e40af' }, { name: 'كهرماني', hex: '#92400e' },
];

const Lobby: React.FC<LobbyProps> = ({ user, onStartLocal, onStartAI }) => {
  const [showAi, setShowAi] = useState(false);
  const [starter, setStarter] = useState<Player>(Player.BLACK);
  const [colors, setColors] = useState({ [Player.BLACK]: '#1a1a1a', [Player.WHITE]: '#f9fafb' });

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 animate-slide-up">
      <div className="glass-card p-8 rounded-[3rem] border-t-8 border-amber-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
        
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-700 to-amber-900 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl animate-float">👤</div>
          <div>
            <h2 className="text-3xl font-black aref text-amber-950 mb-2">{user.username}</h2>
            <div className="flex gap-4 text-[11px] font-black uppercase tracking-widest text-amber-800/60 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <span className="text-green-600">فوز: {user.stats.wins}</span>
              <span className="w-px h-3 bg-amber-200" />
              <span className="text-red-600">هزيمة: {user.stats.losses}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest px-2">من يبدأ النزال؟</p>
            <div className="flex gap-2 p-1 bg-amber-50 rounded-2xl border border-amber-100">
              <button 
                onClick={() => setStarter(Player.BLACK)} 
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${starter === Player.BLACK ? 'bg-white text-amber-900 shadow-md border-amber-200' : 'text-amber-900/40 hover:text-amber-900'}`}
              >أنا</button>
              <button 
                onClick={() => setStarter(Player.WHITE)} 
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${starter === Player.WHITE ? 'bg-white text-amber-900 shadow-md border-amber-200' : 'text-amber-900/40 hover:text-amber-900'}`}
              >الخصم</button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest px-2">ألوان الرخام</p>
            <div className="flex items-center justify-around p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full shadow-lg border-2 border-white ring-2 ring-amber-100" style={{backgroundColor: colors[Player.BLACK]}} />
                <span className="text-[10px] font-bold text-amber-800/40">أنت</span>
              </div>
              <div className="w-px h-8 bg-amber-200" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full shadow-lg border-2 border-white ring-2 ring-amber-100" style={{backgroundColor: colors[Player.WHITE]}} />
                <span className="text-[10px] font-bold text-amber-800/40">الخصم</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest px-2">اختر طابعك الخاص</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {COLOR_PALETTE.map(c => (
              <button 
                key={c.hex} 
                onClick={() => setColors({[Player.BLACK]: c.hex, [Player.WHITE]: colors[Player.WHITE]})} 
                className={`w-10 h-10 rounded-2xl border-2 transition-all hover:scale-110 active:scale-90 ${colors[Player.BLACK] === c.hex ? 'border-amber-800 shadow-lg scale-110' : 'border-transparent shadow-sm'}`} 
                style={{backgroundColor: c.hex}}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!showAi ? (
          <button 
            onClick={() => setShowAi(true)} 
            className="group glass-card p-8 rounded-[3rem] text-center transition-all hover:scale-[1.02] active:scale-[0.98] border-b-8 border-amber-700 hover:bg-amber-900"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-2xl font-black aref text-amber-950 group-hover:text-white transition-colors">ضد الحاسوب</h3>
            <p className="text-sm text-amber-800/60 group-hover:text-white/60 font-bold transition-colors">تحدَّ الذكاء الاصطناعي بمستويات مختلفة</p>
          </button>
        ) : (
          <div className="glass-card p-6 rounded-[3rem] space-y-3 animate-fade-in border-b-8 border-amber-900">
            <h3 className="text-center font-black aref text-amber-900 mb-2">اختر الصعوبة</h3>
            <button onClick={() => onStartAI(Difficulty.EASY, colors, starter)} className="w-full py-3 bg-green-500 text-white rounded-2xl font-black shadow-lg hover:brightness-110 transition-all">سهل (صديق)</button>
            <button onClick={() => onStartAI(Difficulty.MEDIUM, colors, starter)} className="w-full py-3 bg-amber-600 text-white rounded-2xl font-black shadow-lg hover:brightness-110 transition-all">متوسط (منافس)</button>
            <button onClick={() => onStartAI(Difficulty.HARD, colors, starter)} className="w-full py-3 bg-red-800 text-white rounded-2xl font-black shadow-lg hover:brightness-110 transition-all">صعب (سلطان)</button>
            <button onClick={() => setShowAi(false)} className="w-full py-2 text-slate-400 text-xs font-bold hover:text-amber-800 transition-colors">إلغاء</button>
          </div>
        )}

        <button 
          onClick={() => onStartLocal(colors, starter)} 
          className="group glass-card p-8 rounded-[3rem] text-center transition-all hover:scale-[1.02] active:scale-[0.98] border-b-8 border-slate-700 hover:bg-slate-900"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👥</div>
          <h3 className="text-2xl font-black aref text-amber-950 group-hover:text-white transition-colors">لعب محلي</h3>
          <p className="text-sm text-amber-800/60 group-hover:text-white/60 font-bold transition-colors">واجه صديقك على نفس الجهاز</p>
        </button>
      </div>

      <footer className="text-center mt-4">
        <p className="text-[9px] text-amber-800/30 font-black uppercase tracking-[0.3em]">الظامة الموريتانية • تراث خالد وفكر متجدد</p>
      </footer>
    </div>
  );
};

export default Lobby;
