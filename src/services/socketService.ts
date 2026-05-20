import { Server } from 'socket.io';

class SocketService {
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server);
        this.initializeSocketEvents();
    }

    private initializeSocketEvents() {
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

    private broadcastQuizUpdate(quizId: string, answer: any) {
        this.io.to(quizId).emit('quizUpdate', { answer });
    }
}

export default SocketService;