
import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useForumApi } from './useForumApi';

export interface ShoutboxMessage {
    id: number;
    user_id: string;
    message: string;
    created_at: string;
    username: string;
    role: string;
}

export const useShoutbox = () => {
    const [messages, setMessages] = useState<ShoutboxMessage[]>([]);
    const { socket } = useContext(SocketContext);
    const { currentUser } = useAuth();
    const { get, post } = useForumApi();

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await get('/shoutbox');
            setMessages(response);
        };
        fetchMessages();
    }, [get]);

    useEffect(() => {
        if (socket) {
            socket.on('shoutMessage', (newMessage: ShoutboxMessage) => {
                setMessages(prevMessages => [newMessage, ...prevMessages]);
            });
        }

        return () => {
            if (socket) {
                socket.off('shoutMessage');
            }
        };
    }, [socket]);

    const sendMessage = async (message: string) => {
        if (socket && currentUser) {
            await post('/shoutbox', { message });
        }
    };

    return { messages, sendMessage };
};
