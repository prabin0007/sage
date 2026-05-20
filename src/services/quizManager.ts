export interface Participant {
  id: string;
  name: string;
  socketId: string;
  score: number;
  answers: Map<string, string>;
  lastHeartbeat: number;
  joinedAt: number;
}

export interface QuizSession {
  id: string;
  title: string;
  questions: any[];
  status: 'inactive' | 'active' | 'completed';
  participants: Map<string, Participant>;
  startTime?: Date;
  createdAt: number;
}

class QuizManager {
  private quizzes: Map<string, QuizSession> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up inactive participants every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveParticipants();
    }, 30000);
  }

  private cleanupInactiveParticipants(): void {
    const now = Date.now();
    const timeout = 120000; // 120 seconds - increased for better tolerance

    this.quizzes.forEach((quiz, quizId) => {
      const inactiveParticipants: string[] = [];

      quiz.participants.forEach((participant, participantId) => {
        if (now - participant.lastHeartbeat > timeout) {
          console.log(`⏰ Marking ${participant.name} as inactive in ${quizId}`);
          inactiveParticipants.push(participantId);
        }
      });

      inactiveParticipants.forEach(participantId => {
        const participant = quiz.participants.get(participantId);
        if (participant) {
          console.log(`🧹 Removing inactive participant: ${participant.name} from ${quizId}`);
        }
        quiz.participants.delete(participantId);
      });

      if (inactiveParticipants.length > 0) {
        console.log(`🧹 Cleaned up ${inactiveParticipants.length} inactive participants from ${quizId}`);
      }
    });
  }

  createQuiz(id: string, title: string, questions: any[]): QuizSession {
    const quiz: QuizSession = {
      id,
      title,
      questions,
      status: 'inactive',
      participants: new Map(),
      createdAt: Date.now()
    };
    this.quizzes.set(id, quiz);
    console.log(`📝 Quiz created: ${id} at ${new Date(quiz.createdAt).toISOString()}`);
    return quiz;
  }

  getQuiz(id: string): QuizSession | undefined {
    return this.quizzes.get(id);
  }

  getOrCreateQuiz(id: string, title: string = 'Quiz', questions: any[] = []): QuizSession {
    let quiz = this.quizzes.get(id);
    if (!quiz) {
      quiz = this.createQuiz(id, title, questions);
    }
    return quiz;
  }

  getAllQuizzes(): QuizSession[] {
    return Array.from(this.quizzes.values());
  }

  joinQuiz(quizId: string, participantId: string, name: string, socketId: string): Participant | null {
    let quiz = this.quizzes.get(quizId);
    
    // Auto-create quiz if it doesn't exist
    if (!quiz) {
      console.log(`⚠️ Quiz ${quizId} not found, creating it...`);
      quiz = this.createQuiz(quizId, 'Auto-created Quiz', []);
    }

    // Check if participant already exists (reconnection case)
    let participant = quiz.participants.get(participantId);
    
    if (participant) {
      // Update socket ID for reconnection
      console.log(`🔄 Participant ${name} reconnected with new socket ${socketId}`);
      participant.socketId = socketId;
      participant.lastHeartbeat = Date.now();
    } else {
      // Create new participant
      participant = {
        id: participantId,
        name,
        socketId,
        score: 0,
        answers: new Map(),
        lastHeartbeat: Date.now(),
        joinedAt: Date.now()
      };
      quiz.participants.set(participantId, participant);
      console.log(`👤 New participant joined: ${name} (${participantId}) in quiz ${quizId}`);
    }

    console.log(`📊 Total participants in ${quizId}: ${quiz.participants.size}`);
    return participant;
  }

  updateHeartbeat(quizId: string, participantId: string): void {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      const participant = quiz.participants.get(participantId);
      if (participant) {
        participant.lastHeartbeat = Date.now();
      }
    }
  }

  startQuiz(id: string): QuizSession | undefined {
    const quiz = this.quizzes.get(id);
    if (!quiz) {
      return undefined;
    }

    quiz.status = 'active';
    quiz.startTime = new Date();
    console.log(`▶️ Quiz started: ${id} with ${quiz.participants.size} participants`);
    return quiz;
  }

  recordAnswer(quizId: string, participantId: string, questionId: string, answer: string): void {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) return;

    const participant = quiz.participants.get(participantId);
    if (participant) {
      participant.answers.set(questionId, answer);
      
      const question = quiz.questions.find(q => q.id === questionId);
      if (question && answer === question.correctAnswer) {
        participant.score++;
        console.log(`✅ Correct answer: ${participant.name} now has ${participant.score} points`);
      } else {
        console.log(`❌ Wrong answer: ${participant.name}`);
      }
    }
  }

  getLeaderboard(quizId: string): any[] {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) return [];

    return Array.from(quiz.participants.values())
      .map(p => ({
        name: p.name,
        score: p.score,
        totalQuestions: quiz.questions.length
      }))
      .sort((a, b) => b.score - a.score);
  }

  getParticipants(quizId: string): Participant[] {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) return [];
    
    return Array.from(quiz.participants.values()).sort((a, b) => b.joinedAt - a.joinedAt);
  }

  getParticipantCount(quizId: string): number {
    const quiz = this.quizzes.get(quizId);
    return quiz ? quiz.participants.size : 0;
  }

  removeParticipant(quizId: string, participantId: string): void {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      const participant = quiz.participants.get(participantId);
      if (participant) {
        console.log(`👋 Removing participant: ${participant.name} from ${quizId}`);
        quiz.participants.delete(participantId);
      }
    }
  }

  endQuiz(id: string): void {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      quiz.status = 'completed';
      console.log(`⏹️ Quiz ended: ${id} with ${quiz.participants.size} participants`);
    }
  }

  resetQuiz(id: string): void {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      quiz.status = 'inactive';
      quiz.participants.clear();
      console.log(`🔄 Quiz reset: ${id}`);
    }
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

export const quizManager = new QuizManager();