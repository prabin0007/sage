"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizSyncManager = void 0;
class QuizSyncManager {
    constructor() {
        this.quizSyncs = new Map();
        this.questionTimers = new Map();
    }
    initializeQuizSync(quizId) {
        const sync = {
            quizId,
            currentQuestion: null,
            isActive: false,
            startedAt: 0
        };
        this.quizSyncs.set(quizId, sync);
        return sync;
    }
    startQuestion(quizId, questionIndex, questionId, totalQuestions) {
        const now = Date.now();
        const duration = 15000; // 15 seconds in milliseconds
        const endTime = now + duration;
        const questionState = {
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
    getQuestionState(quizId) {
        const sync = this.quizSyncs.get(quizId);
        return (sync === null || sync === void 0 ? void 0 : sync.currentQuestion) || null;
    }
    getTimeRemaining(quizId) {
        const state = this.getQuestionState(quizId);
        if (!state)
            return 0;
        const now = Date.now();
        const remaining = state.endTime - now;
        return remaining > 0 ? remaining : 0;
    }
    isQuestionExpired(quizId) {
        const remaining = this.getTimeRemaining(quizId);
        return remaining <= 0;
    }
    endQuestion(quizId) {
        const sync = this.quizSyncs.get(quizId);
        if (sync) {
            sync.currentQuestion = null;
        }
    }
    clearQuizSync(quizId) {
        const timerId = this.questionTimers.get(quizId);
        if (timerId) {
            clearInterval(timerId);
            this.questionTimers.delete(quizId);
        }
        this.quizSyncs.delete(quizId);
    }
}
exports.quizSyncManager = new QuizSyncManager();
