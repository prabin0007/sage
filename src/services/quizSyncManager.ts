export interface QuestionState {
  questionIndex: number;
  questionId: string;
  startTime: number; // Server timestamp in ms
  duration: number; // 15 seconds
  endTime: number;
}

export interface QuizSync {
  quizId: string;
  currentQuestion: QuestionState | null;
  isActive: boolean;
  startedAt: number;
}

class QuizSyncManager {
  private quizSyncs: Map<string, QuizSync> = new Map();
  private questionTimers: Map<string, NodeJS.Timeout> = new Map();

  initializeQuizSync(quizId: string): QuizSync {
    const sync: QuizSync = {
      quizId,
      currentQuestion: null,
      isActive: false,
      startedAt: 0
    };
    this.quizSyncs.set(quizId, sync);
    return sync;
  }

  startQuestion(quizId: string, questionIndex: number, questionId: string, totalQuestions: number): QuestionState {
    const now = Date.now();
    const duration = 15000; // 15 seconds in milliseconds
    const endTime = now + duration;

    const questionState: QuestionState = {
      questionIndex,
      questionId,
      startTime: now,
      duration,
      endTime
    };

    const sync = this.quizSyncs.get(quizId);
    if (sync) {
      sync.currentQuestion = questionState;
      sync.isActive = true;
    }

    console.log(`⏱️ Question ${questionIndex + 1}/${totalQuestions} started for quiz ${quizId}`);
    console.log(`   Start time: ${now}, End time: ${endTime}`);

    return questionState;
  }

  getQuestionState(quizId: string): QuestionState | null {
    const sync = this.quizSyncs.get(quizId);
    return sync?.currentQuestion || null;
  }

  getTimeRemaining(quizId: string): number {
    const state = this.getQuestionState(quizId);
    if (!state) return 0;

    const now = Date.now();
    const remaining = state.endTime - now;

    return remaining > 0 ? remaining : 0;
  }

  isQuestionExpired(quizId: string): boolean {
    const remaining = this.getTimeRemaining(quizId);
    return remaining <= 0;
  }

  endQuestion(quizId: string): void {
    const sync = this.quizSyncs.get(quizId);
    if (sync) {
      sync.currentQuestion = null;
    }
  }

  clearQuizSync(quizId: string): void {
    const timerId = this.questionTimers.get(quizId);
    if (timerId) {
      clearInterval(timerId);
      this.questionTimers.delete(quizId);
    }
    this.quizSyncs.delete(quizId);
  }
}

export const quizSyncManager = new QuizSyncManager();