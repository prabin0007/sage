"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizManager = void 0;
class QuizManager {
    constructor() {
        this.quizzes = new Map();
        this.heartbeatInterval = null;
        // Clean up inactive participants every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.cleanupInactiveParticipants();
        }, 30000);
    }
    cleanupInactiveParticipants() {
        const now = Date.now();
        const timeout = 120000; // 120 seconds - increased for better tolerance
        this.quizzes.forEach((quiz, quizId) => {
            const inactiveParticipants = [];
            quiz.participants.forEach((participant, participantId) => {
                if (now - participant.lastHeartbeat > timeout) {
                    console.log(`⏰ Marking ${participant.name} as inactive in ${quizId}`);
                    inactiveParticipants.push(participantId);
                }
            });
            inactiveParticipants.forEach(participantId => {
                const participant = quiz.participants.get(participantId);
                if (participant) {
                    console.log(`🧹 Removing inactive participant: ${participant.name} from ${quizId}`);
                }
                quiz.participants.delete(participantId);
            });
            if (inactiveParticipants.length > 0) {
                console.log(`🧹 Cleaned up ${inactiveParticipants.length} inactive participants from ${quizId}`);
            }
        });
    }
    createQuiz(id, title, questions) {
        const quiz = {
            id,
            title,
            questions,
            status: 'inactive',
            participants: new Map(),
            createdAt: Date.now()
        };
        this.quizzes.set(id, quiz);
        console.log(`📝 Quiz created: ${id} at ${new Date(quiz.createdAt).toISOString()}`);
        return quiz;
    }
    getQuiz(id) {
        return this.quizzes.get(id);
    }
    getOrCreateQuiz(id, title = 'Quiz', questions = []) {
        let quiz = this.quizzes.get(id);
        if (!quiz) {
            quiz = this.createQuiz(id, title, questions);
        }
        return quiz;
    }
    getAllQuizzes() {
        return Array.from(this.quizzes.values());
    }
    joinQuiz(quizId, participantId, name, socketId) {
        let quiz = this.quizzes.get(quizId);
        // Auto-create quiz if it doesn't exist
        if (!quiz) {
            console.log(`⚠️ Quiz ${quizId} not found, creating it...`);
            quiz = this.createQuiz(quizId, 'Auto-created Quiz', []);
        }
        // Check if participant already exists (reconnection case)
        let participant = quiz.participants.get(participantId);
        if (participant) {
            // Update socket ID for reconnection
            console.log(`🔄 Participant ${name} reconnected with new socket ${socketId}`);
            participant.socketId = socketId;
            participant.lastHeartbeat = Date.now();
        }
        else {
            // Create new participant
            participant = {
                id: participantId,
                name,
                socketId,
                score: 0,
                answers: new Map(),
                lastHeartbeat: Date.now(),
                joinedAt: Date.now()
            };
            quiz.participants.set(participantId, participant);
            console.log(`👤 New participant joined: ${name} (${participantId}) in quiz ${quizId}`);
        }
        console.log(`📊 Total participants in ${quizId}: ${quiz.participants.size}`);
        return participant;
    }
    updateHeartbeat(quizId, participantId) {
        const quiz = this.quizzes.get(quizId);
        if (quiz) {
            const participant = quiz.participants.get(participantId);
            if (participant) {
                participant.lastHeartbeat = Date.now();
            }
        }
    }
    startQuiz(id) {
        const quiz = this.quizzes.get(id);
        if (!quiz) {
            return undefined;
        }
        quiz.status = 'active';
        quiz.startTime = new Date();
        console.log(`▶️ Quiz started: ${id} with ${quiz.participants.size} participants`);
        return quiz;
    }
    recordAnswer(quizId, participantId, questionId, answer) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz)
            return;
        const participant = quiz.participants.get(participantId);
        if (participant) {
            participant.answers.set(questionId, answer);
            const question = quiz.questions.find(q => q.id === questionId);
            if (question && answer === question.correctAnswer) {
                participant.score++;
                console.log(`✅ Correct answer: ${participant.name} now has ${participant.score} points`);
            }
            else {
                console.log(`❌ Wrong answer: ${participant.name}`);
            }
        }
    }
    getLeaderboard(quizId) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz)
            return [];
        return Array.from(quiz.participants.values())
            .map(p => ({
            name: p.name,
            score: p.score,
            totalQuestions: quiz.questions.length
        }))
            .sort((a, b) => b.score - a.score);
    }
    getParticipants(quizId) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz)
            return [];
        return Array.from(quiz.participants.values()).sort((a, b) => b.joinedAt - a.joinedAt);
    }
    getParticipantCount(quizId) {
        const quiz = this.quizzes.get(quizId);
        return quiz ? quiz.participants.size : 0;
    }
    removeParticipant(quizId, participantId) {
        const quiz = this.quizzes.get(quizId);
        if (quiz) {
            const participant = quiz.participants.get(participantId);
            if (participant) {
                console.log(`👋 Removing participant: ${participant.name} from ${quizId}`);
                quiz.participants.delete(participantId);
            }
        }
    }
    endQuiz(id) {
        const quiz = this.quizzes.get(id);
        if (quiz) {
            quiz.status = 'completed';
            console.log(`⏹️ Quiz ended: ${id} with ${quiz.participants.size} participants`);
        }
    }
    resetQuiz(id) {
        const quiz = this.quizzes.get(id);
        if (quiz) {
            quiz.status = 'inactive';
            quiz.participants.clear();
            console.log(`🔄 Quiz reset: ${id}`);
        }
    }
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }
}
exports.quizManager = new QuizManager();
