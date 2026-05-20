export interface QuizData {
  id: string;
  title: string;
  questions: any[];
}

export interface Question {
  id: string;
  question: string;
}

export function formatQuizData(quiz: QuizData): QuizData {
  return {
    ...quiz,
    questions: quiz.questions.map((question: Question) => ({
      id: question.id,
      question: question.question
    }))
  };
}

export function validateInput(input: string, type: string): boolean {
  if (!input || input.trim() === '') {
    return false;
  }
  
  if (type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  }
  
  return true;
}

export function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}