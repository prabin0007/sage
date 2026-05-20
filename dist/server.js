"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const quizRoutes_1 = __importDefault(require("./routes/quizRoutes"));
const userRoutes_1 = require("./routes/userRoutes");
const quizManager_1 = require("./services/quizManager");
const quizSyncManager_1 = require("./services/quizSyncManager");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Optimize Socket.io for high concurrency
const io = new socket_io_1.Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
    upgradeTimeout: 10000
});
const PORT = process.env.PORT || 3000;
// Track socket to quiz mapping for cleanup
const socketToQuizMap = new Map();
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cors_1.default)());
// Serve static files
const clientPath = path_1.default.join(__dirname, '../client');
console.log('📁 Serving static files from:', clientPath);
app.use(express_1.default.static(clientPath));
// Routes
app.use('/api/quiz', quizRoutes_1.default);
(0, userRoutes_1.setUserRoutes)(app);
// Test route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        app: 'Sage',
        timestamp: Date.now()
    });
});
// Get all active quizzes
app.get('/api/active-quizzes', (req, res) => {
    const quizzes = quizManager_1.quizManager.getAllQuizzes();
    res.json({
        success: true,
        quizzes: quizzes.map(q => ({
            id: q.id,
            title: q.title,
            status: q.status,
            participantCount: q.participants.size,
            questionCount: q.questions.length,
            createdAt: q.createdAt
        }))
    });
});
// Get specific quiz participants
app.get('/api/quiz/:quizId/participants', (req, res) => {
    const { quizId } = req.params;
    const quiz = quizManager_1.quizManager.getQuiz(quizId);
    if (!quiz) {
        return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    res.json({
        success: true,
        quizId,
        participants: quizManager_1.quizManager.getParticipants(quizId).map(p => ({
            name: p.name,
            score: p.score,
            joinedAt: p.joinedAt
        }))
    });
});
// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(clientPath, 'index.html'));
});
// Admin Panel route
app.get('/admin', (req, res) => {
    res.sendFile(path_1.default.join(clientPath, 'admin.html'));
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Socket.io connection
io.on('connection', (socket) => {
    console.log(`✅ New connection: ${socket.id}`);
    socket.on('join-admin', (data) => {
        const { quizId } = data;
        console.log(`🔐 Admin joined quiz room: ${quizId}`);
        socket.join(quizId);
        // Send all existing participants to the admin who just logged in
        const participants = quizManager_1.quizManager.getParticipants(quizId);
        const quiz = quizManager_1.quizManager.getQuiz(quizId);
        if (quiz) {
            console.log(`📊 Syncing ${participants.length} existing participants to admin`);
            socket.emit('quiz-info-updated', {
                quizId: quizId,
                participantCount: participants.length,
                participants: participants.map(p => ({ name: p.name, score: p.score })),
                quizTitle: quiz.title,
                totalQuestions: quiz.questions.length,
                status: quiz.status,
                existingParticipants: true
            });
        }
    });
    socket.on('join-quiz', (data) => {
        const { userId, userName, quizId } = data;
        console.log(`📝 Participant joining: ${userName} (${userId}) for quiz ${quizId}`);
        socket.join(quizId);
        // Map socket to quiz and user for cleanup on disconnect
        socketToQuizMap.set(socket.id, { quizId, userId, userName });
        console.log(`📌 Socket mapping stored: ${socket.id} -> ${quizId} / ${userId}`);
        const participant = quizManager_1.quizManager.joinQuiz(quizId, userId, userName, socket.id);
        if (participant) {
            const participants = quizManager_1.quizManager.getParticipants(quizId);
            const quiz = quizManager_1.quizManager.getOrCreateQuiz(quizId);
            console.log(`📢 Broadcasting to room ${quizId}. Total: ${participants.length}`);
            // Broadcast user joined to all in room (including admin)
            io.to(quizId).emit('user-joined', {
                userName: userName,
                totalUsers: participants.length,
                participants: participants.map(p => ({ name: p.name, score: p.score }))
            });
            // Update quiz info for admin
            io.to(quizId).emit('quiz-info-updated', {
                quizId: quizId,
                participantCount: participants.length,
                participants: participants.map(p => ({ name: p.name, score: p.score })),
                quizTitle: quiz.title,
                totalQuestions: quiz.questions.length,
                status: quiz.status
            });
            // If quiz is already active, send current question state to new participant
            if (quiz.status === 'active') {
                const currentQuestion = quizSyncManager_1.quizSyncManager.getQuestionState(quizId);
                if (currentQuestion) {
                    const timeRemaining = quizSyncManager_1.quizSyncManager.getTimeRemaining(quizId);
                    socket.emit('sync-question', {
                        questionIndex: currentQuestion.questionIndex,
                        timeRemaining: Math.max(0, timeRemaining),
                        serverTime: Date.now()
                    });
                }
            }
        }
    });
    socket.on('heartbeat', (data) => {
        const { quizId, userId } = data;
        quizManager_1.quizManager.updateHeartbeat(quizId, userId);
    });
    socket.on('start-quiz', (data) => {
        const { quizId, questions, title } = data;
        console.log(`▶️ Starting quiz: ${quizId}`);
        // Update quiz with questions if provided
        let quiz = quizManager_1.quizManager.getQuiz(quizId);
        if (quiz && questions && questions.length > 0) {
            quiz.questions = questions;
            quiz.title = title;
        }
        // Start the quiz
        const startedQuiz = quizManager_1.quizManager.startQuiz(quizId);
        if (startedQuiz) {
            // Start first question with synchronized timing
            const firstQuestion = quizSyncManager_1.quizSyncManager.startQuestion(quizId, 0, questions[0].id, questions.length);
            io.to(quizId).emit('quiz-started', {
                quizId: quizId,
                title: title,
                questions: questions,
                firstQuestion: {
                    questionIndex: 0,
                    questionId: questions[0].id,
                    serverTime: firstQuestion.startTime,
                    duration: firstQuestion.duration
                },
                message: 'Quiz has started!'
            });
            io.to(quizId).emit('quiz-info-updated', {
                quizId: quizId,
                status: 'active'
            });
        }
        else {
            console.error(`❌ Failed to start quiz: ${quizId}`);
        }
    });
    socket.on('question-expired', (data) => {
        const { quizId, questionIndex } = data;
        console.log(`⏱️ Question ${questionIndex} expired for quiz ${quizId}`);
        const quiz = quizManager_1.quizManager.getQuiz(quizId);
        if (quiz && questionIndex < quiz.questions.length - 1) {
            // Start next question
            const nextQuestion = quizSyncManager_1.quizSyncManager.startQuestion(quizId, questionIndex + 1, quiz.questions[questionIndex + 1].id, quiz.questions.length);
            io.to(quizId).emit('next-question', {
                questionIndex: questionIndex + 1,
                questionId: quiz.questions[questionIndex + 1].id,
                serverTime: nextQuestion.startTime,
                duration: nextQuestion.duration,
                question: quiz.questions[questionIndex + 1]
            });
        }
        else {
            // Quiz complete
            quizSyncManager_1.quizSyncManager.endQuestion(quizId);
            io.to(quizId).emit('quiz-complete', {
                message: 'All questions completed'
            });
        }
    });
    socket.on('submit-answer', (data) => {
        const { userId, questionId, answer, quizId } = data;
        console.log(`📊 Answer submitted by ${userId}`);
        quizManager_1.quizManager.recordAnswer(quizId, userId, questionId, answer);
        quizManager_1.quizManager.updateHeartbeat(quizId, userId);
        // Get updated leaderboard and broadcast to all in room
        const participants = quizManager_1.quizManager.getParticipants(quizId);
        io.to(quizId).emit('leaderboard-updated', {
            quizId: quizId,
            participants: participants.map(p => ({
                name: p.name,
                score: p.score
            }))
        });
        io.to(quizId).emit('answer-recorded', {
            userId: userId,
            questionId: questionId
        });
    });
    socket.on('end-quiz', (data) => {
        const { quizId } = data;
        console.log(`⏹️ Ending quiz: ${quizId}`);
        quizManager_1.quizManager.endQuiz(quizId);
        quizSyncManager_1.quizSyncManager.endQuestion(quizId);
        const finalLeaderboard = quizManager_1.quizManager.getLeaderboard(quizId);
        console.log(`📢 Broadcasting leaderboard to ${quizId}`);
        io.to(quizId).emit('leaderboard-published', finalLeaderboard);
    });
    socket.on('reset-quiz', (data) => {
        const { quizId } = data;
        console.log(`🔄 Resetting quiz: ${quizId}`);
        quizManager_1.quizManager.resetQuiz(quizId);
        quizSyncManager_1.quizSyncManager.clearQuizSync(quizId);
        io.to(quizId).emit('quiz-reset', {
            message: 'Quiz has been reset'
        });
    });
    socket.on('disconnect', () => {
        const quizInfo = socketToQuizMap.get(socket.id);
        if (quizInfo) {
            const { quizId, userId, userName } = quizInfo;
            console.log(`\n👋 DISCONNECT EVENT: Socket ${socket.id}`);
            console.log(`   User: ${userName} (${userId})`);
            console.log(`   Quiz: ${quizId}`);
            // Remove participant from quiz
            quizManager_1.quizManager.removeParticipant(quizId, userId);
            console.log(`   ✅ Participant removed from quiz`);
            // Get updated participants list
            const participants = quizManager_1.quizManager.getParticipants(quizId);
            console.log(`   📊 Remaining participants: ${participants.length}`);
            // Broadcast updated participant list to admin and other users
            const updatedData = {
                quizId: quizId,
                userId: userId,
                userName: userName,
                totalUsers: participants.length,
                participants: participants.map(p => ({ name: p.name, score: p.score }))
            };
            console.log(`   📢 Broadcasting update to room: ${quizId}`);
            io.to(quizId).emit('user-disconnected', updatedData);
            // Also update quiz info
            io.to(quizId).emit('quiz-info-updated', {
                quizId: quizId,
                participantCount: participants.length,
                participants: participants.map(p => ({ name: p.name, score: p.score }))
            });
            // Update leaderboard
            io.to(quizId).emit('leaderboard-updated', {
                quizId: quizId,
                participants: participants.map(p => ({
                    name: p.name,
                    score: p.score
                }))
            });
        }
        else {
            console.log(`❌ Disconnected: ${socket.id} (no quiz mapping found)`);
        }
        // Clean up the socket mapping
        socketToQuizMap.delete(socket.id);
    });
    socket.on('error', (error) => {
        console.error(`🔴 Socket error on ${socket.id}:`, error);
    });
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Shutting down gracefully...');
    quizManager_1.quizManager.destroy();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
server.listen(PORT, () => {
    console.log('\n🚀 Sage server running on http://localhost:' + PORT);
    console.log('🌱 Grow your mind, one quiz at a time.\n');
    console.log('📊 Admin Panel: http://localhost:' + PORT + '/admin\n');
    // Initialize sample quiz
    quizManager_1.quizManager.createQuiz('QUIZ-ABC123', 'General Knowledge Quiz', [
        {
            id: '1',
            question: 'What is the capital of France?',
            options: ['London', 'Paris', 'Berlin', 'Madrid'],
            correctAnswer: 'Paris'
        },
        {
            id: '2',
            question: 'Which planet is known as the Red Planet?',
            options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
            correctAnswer: 'Mars'
        },
        {
            id: '3',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4'
        }
    ]);
    // Initialize sync manager for the quiz
    quizSyncManager_1.quizSyncManager.initializeQuizSync('QUIZ-ABC123');
});
exports.default = app;
