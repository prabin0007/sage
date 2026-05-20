export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  timer?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
  status: 'active' | 'inactive' | 'completed';
}

export interface User {
  id: string;
  name: string;
  quizId: string;
  score: number;
  answers: Map<string, string>;
}

export interface SocketMessage {
  type: string;
  payload: any;
}