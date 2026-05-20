export class Question {
    questionText: string;
    options: string[];
    correctAnswer: string;

    constructor(questionText: string, options: string[], correctAnswer: string) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
    }

    isCorrectAnswer(answer: string): boolean {
        return this.correctAnswer === answer;
    }
}