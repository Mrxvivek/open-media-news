import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

// Real-time helper to broadcast events to all connected clients
export const emitRealtime = (event: string, payload: any) => {
  try {
    if (ioInstance) {
      ioInstance.emit(event, payload);
    }
  } catch (err) {
    console.warn(`[Socket.io] Failed to emit event ${event}:`, err);
  }
};
