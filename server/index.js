import express          from 'express';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import cors             from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRouter         from './routes/auth.js';
import roomsRouter        from './routes/rooms.js';
import participantsRouter from './routes/participants.js';
import expensesRouter     from './routes/expenses.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Serve static frontend from project root
app.use(express.static(join(__dirname, '..')));

// API routes
app.use('/api/auth',  authRouter());
app.use('/api/rooms', roomsRouter(io));
app.use('/api/rooms', participantsRouter(io));
app.use('/api/rooms', expensesRouter(io));

// Socket.io — room management
io.on('connection', socket => {
  socket.on('join:room',  roomId => socket.join(roomId));
  socket.on('leave:room', roomId => socket.leave(roomId));
});

httpServer.listen(PORT, () => {
  console.log(`\n✂️  Dividanselo corriendo en http://localhost:${PORT}\n`);
});
