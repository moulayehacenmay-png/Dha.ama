
export enum Player {
  BLACK = 'BLACK', // Player 1
  WHITE = 'WHITE', // Player 2
  NONE = 'NONE'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  player: Player;
  isSultan: boolean;
  position: Position;
}

export interface GameState {
  board: (Piece | null)[][];
  turn: Player;
  winner: Player | null;
  history: MoveRecord[];
  captures: {
    [Player.BLACK]: number;
    [Player.WHITE]: number;
  };
  jumpingPiece: Position | null; // القطعة التي بدأت القنص ولم تنتهِ بعد
}

export interface MoveRecord {
  from: Position;
  to: Position;
  captured?: Position;
  player: Player;
}

export interface UserProfile {
  uid: string;
  username: string;
  photoURL?: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface GameRoom {
  id: string;
  players: {
    [Player.BLACK]?: UserProfile;
    [Player.WHITE]?: UserProfile;
  };
  status: 'waiting' | 'active' | 'finished';
  state: GameState;
  createdAt: number;
  difficulty?: Difficulty;
  colors: {
    [Player.BLACK]: string;
    [Player.WHITE]: string;
  };
}
