import express, { Router } from 'express';
import { QuizController } from '../controllers/quizController';

const router: Router = express.Router();
const quizController = new QuizController();

router.post('/create', (req, res) => quizController.createQuiz(req, res));
router.get('/:quizId', (req, res) => quizController.getQuiz(req, res));
router.post('/submit-answer', (req, res) => quizController.submitAnswer(req, res));

export default router;