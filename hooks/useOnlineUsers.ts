
import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export interface OnlineUser {
    id: string;
    username: string;
    avatar?: string;
    role: string;
}

export const useOnlineUsers = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        if (socket) {
            socket.on('onlineUsers', (users: OnlineUser[]) => {
                setOnlineUsers(users);
            });
        }

        return () => {
            if (socket) {
                socket.off('onlineUsers');
            }
        };
    }, [socket]);

    return { onlineUsers };
};
