
import React, { useState } from 'react';
import { UserProfile } from '../types.ts';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onLogin({
      uid: 'user-' + Math.random().toString(36).substr(2, 9),
      username,
      stats: { wins: 0, losses: 0, draws: 0 }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-[#f3e5ab] via-[#fffbeb] to-[#fde68a]">
      <div className="relative w-full max-w-lg">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-orange-300/30 rounded-full blur-3xl"></div>

        <div className="glass-card p-12 rounded-[4rem] text-center border-b-[16px] border-amber-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <div className="mb-10 inline-block relative">
            <div className="text-8xl transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">👑</div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg text-xl">✨</div>
          </div>

          <h1 className="text-6xl font-bold aref text-amber-950 mb-4 tracking-tighter">الـظـامـة</h1>
          <p className="text-amber-800/60 font-bold text-lg mb-10 tracking-widest uppercase">التراث الموريتاني الأصيل</p>

          <form onSubmit={handleLogin} className="space-y-8 text-right">
            <div>
              <label className="block text-amber-950 font-black mb-3 mr-4 text-sm uppercase">اسم الفارس</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسمك المستعار..."
                className="w-full px-8 py-5 rounded-[2rem] bg-white/50 border-2 border-amber-100 focus:border-amber-600 focus:bg-white outline-none transition-all text-xl shadow-inner text-center font-bold placeholder:text-amber-900/20"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-br from-amber-700 to-amber-900 hover:from-amber-800 hover:to-black text-white font-black py-6 rounded-[2rem] text-2xl shadow-[0_15px_30px_-5px_rgba(120,53,15,0.4)] transition-all hover:translate-y-[-4px] active:translate-y-0"
            >
              دخول المجلس
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-amber-100 flex justify-center gap-8 text-xs font-black text-amber-900/40 tracking-widest">
            <span className="flex items-center gap-2">⚔️ استراتيجية</span>
            <span className="flex items-center gap-2">🏜️ أصالة</span>
            <span className="flex items-center gap-2">🧠 ذكاء</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
