"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
class QuizService {
    constructor() {
        this.quizzes = new Map();
        this.users = new Map();
    }
    createQuiz(id, title, questions) {
        const quiz = {
            id,
            title,
            questions,
            createdAt: new Date(),
            status: 'inactive'
        };
        this.quizzes.set(id, quiz);
        return quiz;
    }
    getQuizDetails(id) {
        return this.quizzes.get(id);
    }
    startQuiz(quizId) {
        const quiz = this.quizzes.get(quizId);
        if (quiz) {
            quiz.status = 'active';
        }
    }
    endQuiz(quizId) {
        const quiz = this.quizzes.get(quizId);
        if (quiz) {
            quiz.status = 'completed';
        }
    }
    addUserToQuiz(userId, userName, quizId) {
        const user = {
            id: userId,
            name: userName,
            quizId,
            score: 0,
            answers: new Map()
        };
        this.users.set(userId, user);
        return user;
    }
    recordAnswer(userId, questionId, answer) {
        const user = this.users.get(userId);
        if (user) {
            user.answers.set(questionId, answer);
        }
    }
    calculateLeaderboard(quizId) {
        const quiz = this.quizzes.get(quizId);
        const users = Array.from(this.users.values()).filter(u => u.quizId === quizId);
        if (!quiz)
            return [];
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
    getParticipants(quizId) {
        return Array.from(this.users.values()).filter(u => u.quizId === quizId);
    }
}
exports.QuizService = QuizService;
