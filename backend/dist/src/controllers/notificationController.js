import { io } from '../../index';
import knex from '../../knexfile.cjs';
const db = knex;
export const createNotification = async (req, res) => {
    try {
        const { userId, type, message } = req.body;
        const [notification] = await db('notifications').insert({
            user_id: userId,
            type,
            message,
        }).returning('*');
        io.to(userId).emit('newNotification', notification);
        res.status(201).json(notification);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await db('notifications').where({ user_id: userId });
        res.json(notifications);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};
//# sourceMappingURL=notificationController.js.map