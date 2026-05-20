"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = exports.Quiz = void 0;
class Quiz {
    constructor(title) {
        this.title = title;
        this.questions = [];
    }
    addQuestion(question) {
        this.questions.push(question);
    }
    getQuestions() {
        return this.questions;
    }
}
exports.Quiz = Quiz;
class Question {
    constructor(questionText, options, correctAnswer) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
    }
}
exports.Question = Question;
