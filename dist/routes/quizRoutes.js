"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quizController_1 = require("../controllers/quizController");
const router = express_1.default.Router();
const quizController = new quizController_1.QuizController();
router.post('/create', (req, res) => quizController.createQuiz(req, res));
router.get('/:quizId', (req, res) => quizController.getQuiz(req, res));
router.post('/submit-answer', (req, res) => quizController.submitAnswer(req, res));
exports.default = router;
