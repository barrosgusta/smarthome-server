import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Mock states
let deviceStates: any = {
  livingRoom: {
    lights: 'off',
    tv: { state: 'off', channel: 1 },
    airConditioning: { state: 'off', temperature: 22 },
  },
  kitchen: {
    lights: 'off',
    fridge: { temperature: 3, alert: false },
    stove: { state: 'off', power: 1 },
  },
  room: {
    lights: 'off',
    fan: { state: 'off', speed: 1 },
    curtains: 'closed',
  },
};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('getInitialState', () => {
    // Send current states on connection
    socket.emit('initialState', deviceStates);
  });

  // Handle changes
  socket.on('updateDevice', (data) => {
    const { room, device, state } = data;

    if (!isStateValid(room, device, state)) return;

    console.log('old state', deviceStates[room][device]);
    deviceStates[room][device] = state;
    console.log('new state', deviceStates[room][device]);

    io.emit('stateChanged', { room, device, state });
  });
});

function isStateValid(room: string, device: string, state: any): boolean {
  if (room === 'room' && device === 'fan') {
    return isFanStateValid(state);
  }

  if (room === 'kitchen' && device === 'stove') {
    return isStoveStateValid(state);
  }

  if (room === 'livingRoom' && device === 'airConditioning') {
    return isAirConditioningStateValid(state);
  }

  return true;
}

function isFanStateValid(fanState: any): boolean {
  return fanState.speed > 0 && fanState.speed < 4;
}

function isStoveStateValid(stoveState: any): boolean {
  return stoveState.power > 0 && stoveState.power < 4;
}

function isAirConditioningStateValid(airConditioningState: any): boolean {
  return (
    airConditioningState.temperature > 16 &&
    airConditioningState.temperature < 31
  );
}

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
