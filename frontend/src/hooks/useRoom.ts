import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User } from '../types';
import { config } from '../config';

const SOCKET_URL = config.BACKEND_URL;

export const useRoom = (roomId: string, userId: string, userName: string, userLanguage: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [videoFrames, setVideoFrames] = useState<Map<string, string>>(new Map());
  const [screenFrames, setScreenFrames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Don't connect if roomId is empty
    if (!roomId || roomId.trim() === '') {
      return;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);

      // Join room
      newSocket.emit('join-room', {
        roomId,
        userId,
        name: userName,
        language: userLanguage
      });
    });

    newSocket.on('joined-room', (data: { roomId: string; userId: string; users: User[] }) => {
      const usersMap = new Map<string, User>();
      data.users.forEach(user => {
        usersMap.set(user.id, user);
      });
      setUsers(usersMap);
    });

    newSocket.on('user-joined', (data: { userId: string; name: string; language: string }) => {
      setUsers(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          id: data.userId,
          name: data.name,
          language: data.language,
          streamActive: false,
          screenShareActive: false
        });
        return next;
      });
    });

    newSocket.on('user-left', (data: { userId: string }) => {
      setUsers(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
      setVideoFrames(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    newSocket.on('video-frame', (data: { userId: string; frame: string }) => {
      setVideoFrames(prev => {
        const next = new Map(prev);
        next.set(data.userId, data.frame);
        return next;
      });
    });

    newSocket.on('screen-frame', (data: { userId: string; frame: string }) => {
      setScreenFrames(prev => {
        const next = new Map(prev);
        next.set(data.userId, data.frame);
        return next;
      });
    });

    newSocket.on('screen-share-stopped', (data: { userId: string }) => {
      setScreenFrames(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    newSocket.on('language-updated', (data: { userId: string; language: string }) => {
      setUsers(prev => {
        const next = new Map(prev);
        const user = next.get(data.userId);
        if (user) {
          next.set(data.userId, { ...user, language: data.language });
        }
        return next;
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-room', { roomId, userId });
      newSocket.disconnect();
    };
  }, [roomId, userId, userName, userLanguage]);

  return {
    socket,
    users,
    isConnected,
    videoFrames,
    screenFrames
  };
};
