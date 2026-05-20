import { Quiz, Question, User } from '../types/index';

export class QuizService {
  private quizzes: Map<string, Quiz> = new Map();
  private users: Map<string, User> = new Map();

  createQuiz(id: string, title: string, questions: Question[]): Quiz {
    const quiz: Quiz = {
      id,
      title,
      questions,
      createdAt: new Date(),
      status: 'inactive'
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  getQuizDetails(id: string): Quiz | undefined {
    return this.quizzes.get(id);
  }

  startQuiz(quizId: string): void {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      quiz.status = 'active';
    }
  }

  endQuiz(quizId: string): void {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      quiz.status = 'completed';
    }
  }

  addUserToQuiz(userId: string, userName: string, quizId: string): User {
    const user: User = {
      id: userId,
      name: userName,
      quizId,
      score: 0,
      answers: new Map()
    };
    this.users.set(userId, user);
    return user;
  }

  recordAnswer(userId: string, questionId: string, answer: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.answers.set(questionId, answer);
    }
  }

  calculateLeaderboard(quizId: string): any[] {
    const quiz = this.quizzes.get(quizId);
    const users = Array.from(this.users.values()).filter(u => u.quizId === quizId);

    if (!quiz) return [];

    return users.map(user => {
      let score = 0;
      user.answers.forEach((answer, questionId) => {
        const question = quiz.questions.find(q => q.id === questionId);
        if (question && answer === question.correctAnswer) {
          score++;
        }
      });
      return { name: user.name, score, totalQuestions: quiz.questions.length };
    }).sort((a, b) => b.score - a.score);
  }

  getParticipants(quizId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.quizId === quizId);
  }
}