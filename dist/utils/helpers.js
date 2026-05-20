"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQuizData = formatQuizData;
exports.validateInput = validateInput;
exports.generateUniqueId = generateUniqueId;
function formatQuizData(quiz) {
    return Object.assign(Object.assign({}, quiz), { questions: quiz.questions.map((question) => ({
            id: question.id,
            question: question.question
        })) });
}
function validateInput(input, type) {
    if (!input || input.trim() === '') {
        return false;
    }
    if (type === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }
    return true;
}
function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}
