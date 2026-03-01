import { io, knexInstance as db } from '../../index.js';
export async function createNotification(userId, type, message) {
    const [notification] = await db('notifications').insert({
        user_id: userId,
        type,
        message,
    }).returning('*');
    io.to(userId.toString()).emit('newNotification', notification);
}
export const createNotificationHandler = async (req, res) => {
    try {
        const { userId, type, message } = req.body;
        await createNotification(userId, type, message);
        res.status(201).json({ message: "Notification created" });
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