import { QuizService } from '../src/services/quizService';
import { Quiz } from '../src/models/Quiz';

describe('Quiz Service', () => {
    let quizService: QuizService;

    beforeEach(() => {
        quizService = new QuizService();
    });

    it('should create a new quiz', () => {
        const quizData = {
            title: 'Sample Quiz',
            questions: []
        };
        const quiz = quizService.createQuiz(quizData);
        expect(quiz.title).toBe(quizData.title);
        expect(quiz.questions).toEqual(quizData.questions);
    });

    it('should fetch quizzes', () => {
        const quizzes = quizService.fetchQuizzes();
        expect(Array.isArray(quizzes)).toBe(true);
    });

    it('should save a quiz', () => {
        const quiz = new Quiz('Test Quiz', []);
        quizService.saveQuiz(quiz);
        const fetchedQuizzes = quizService.fetchQuizzes();
        expect(fetchedQuizzes).toContain(quiz);
    });
});