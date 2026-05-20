import { Request, Response } from 'express';
import { QuizService } from '../services/quizService';

export class QuizController {
  private quizService = new QuizService();

  createQuiz(req: Request, res: Response): void {
    const { id, title, questions } = req.body;
    const quiz = this.quizService.createQuiz(id, title, questions);
    res.json({ success: true, quiz });
  }

  getQuiz(req: Request, res: Response): void {
    const { quizId } = req.params;
    const quiz = this.quizService.getQuizDetails(quizId);
    if (quiz) {
      res.json({ success: true, quiz });
    } else {
      res.status(404).json({ success: false, message: 'Quiz not found' });
    }
  }

  submitAnswer(req: Request, res: Response): void {
    const { userId, questionId, answer } = req.body;
    if (!userId || !questionId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    res.json({ success: true, message: 'Answer submitted' });
  }
}