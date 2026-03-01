import { knexInstance } from '../../index.js';
import logger from '../lib/logger.js';
const onlineUsers = new Map();
const broadcastOnlineUsers = (io) => {
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
    logger.info(`Online users updated: ${onlineUsers.size} users online.`);
};
export const handleSocketConnection = (io) => {
    io.on('connection', async (socket) => {
        logger.info('A user connected to socket.io');
        if (socket.userId) {
            try {
                const user = await knexInstance('users')
                    .select('id', 'username', 'avatarUrl as avatar', 'role')
                    .where({ id: socket.userId })
                    .first();
                if (user) {
                    socket.join(user.id);
                    onlineUsers.set(socket.userId, {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                        role: user.role,
                    });
                    broadcastOnlineUsers(io);
                    logger.info(`User ${user.username} (${user.id}) joined online.`);
                }
                else {
                    logger.warn(`Connected socket.userId ${socket.userId} not found in database.`);
                }
            }
            catch (error) {
                logger.error('Error fetching user for online tracking:', error);
            }
        }
        socket.on('disconnect', () => {
            logger.info('A user disconnected from socket.io');
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                broadcastOnlineUsers(io);
                logger.info(`User ${socket.userId} left online.`);
            }
        });
    });
};
//# sourceMappingURL=socketController.js.map