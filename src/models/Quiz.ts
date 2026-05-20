export class Quiz {
    title: string;
    questions: Question[];

    constructor(title: string) {
        this.title = title;
        this.questions = [];
    }

    addQuestion(question: Question): void {
        this.questions.push(question);
    }

    getQuestions(): Question[] {
        return this.questions;
    }
}

export class Question {
    questionText: string;
    options: string[];
    correctAnswer: string;

    constructor(questionText: string, options: string[], correctAnswer: string) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
    }
}