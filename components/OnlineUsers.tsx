import React from 'react';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { UserLink } from './UI';

const OnlineUsers: React.FC = () => {
    const { onlineUsers } = useOnlineUsers();

    return (
        <div className="online-users-container bg-gray-800 p-4 rounded-lg shadow-md mt-4">
            <h3 className="text-lg font-bold text-white mb-2">Who's Online ({onlineUsers.length})</h3>
            <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                {onlineUsers.length === 0 ? (
                    <p>No users currently online.</p>
                ) : (
                    onlineUsers.map((user) => (
                        <UserLink key={user.id} name={user.username} role={user.role} />
                    ))
                )}
            </div>
        </div>
    );
};

export default OnlineUsers;
