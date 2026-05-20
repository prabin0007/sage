"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketService {
    constructor(server) {
        this.io = new socket_io_1.Server(server);
        this.initializeSocketEvents();
    }
    initializeSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
            socket.on('joinQuiz', (quizId) => {
                socket.join(quizId);
                console.log(`User ${socket.id} joined quiz ${quizId}`);
            });
            socket.on('submitAnswer', (data) => {
                this.broadcastQuizUpdate(data.quizId, data.answer);
            });
        });
    }
    broadcastQuizUpdate(quizId, answer) {
        this.io.to(quizId).emit('quizUpdate', { answer });
    }
}
exports.default = SocketService;
