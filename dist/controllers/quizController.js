"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizController = void 0;
const quizService_1 = require("../services/quizService");
class QuizController {
    constructor() {
        this.quizService = new quizService_1.QuizService();
    }
    createQuiz(req, res) {
        const { id, title, questions } = req.body;
        const quiz = this.quizService.createQuiz(id, title, questions);
        res.json({ success: true, quiz });
    }
    getQuiz(req, res) {
        const { quizId } = req.params;
        const quiz = this.quizService.getQuizDetails(quizId);
        if (quiz) {
            res.json({ success: true, quiz });
        }
        else {
            res.status(404).json({ success: false, message: 'Quiz not found' });
        }
    }
    submitAnswer(req, res) {
        const { userId, questionId, answer } = req.body;
        if (!userId || !questionId) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }
        res.json({ success: true, message: 'Answer submitted' });
    }
}
exports.QuizController = QuizController;
