import { io } from '../../index';
import knex from '../../knexfile.cjs';
const db = knex;
export const getShoutboxMessages = async (req, res) => {
    try {
        const messages = await db('shoutbox_messages')
            .select('shoutbox_messages.*', 'users.username', 'users.role')
            .join('users', 'shoutbox_messages.user_id', 'users.id')
            .orderBy('shoutbox_messages.created_at', 'desc')
            .limit(50);
        res.json(messages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch shoutbox messages' });
    }
};
export const postShoutboxMessage = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { message } = req.body;
        const [insertedMessage] = await db('shoutbox_messages').insert({
            user_id: req.userId,
            message: message,
        }).returning('*');
        const user = await db('users')
            .select('username', 'role')
            .where({ id: req.userId })
            .first();
        const messageToBroadcast = {
            ...insertedMessage,
            username: user.username,
            role: user.role,
        };
        io.emit('shoutMessage', messageToBroadcast);
        res.status(201).json(messageToBroadcast);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to post shoutbox message' });
    }
};
//# sourceMappingURL=shoutboxController.js.map