import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useShoutbox } from '../hooks/useShoutbox';

const Shoutbox: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const { messages, sendMessage } = useShoutbox();
    const [newMessage, setNewMessage] = useState<string>('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && currentUser) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="shoutbox-container bg-gray-800 p-4 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">Shoutbox</h2>
            <div className="shoutbox-messages h-64 overflow-y-auto bg-gray-900 p-3 rounded-md mb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {messages.length === 0 ? (
                    <p className="text-gray-400 text-sm">No messages yet. Be the first to shout!</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="mb-2 flex items-center">
                            <span className={`font-semibold text-blue-400 mr-2 ${msg.role}`}>{msg.username}: </span>
                            <span className="text-gray-200 flex-grow">{msg.message}</span>
                            <span className="text-gray-500 text-xs ml-2">
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
            {currentUser ? (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your shout message..."
                        className="flex-grow p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                        Shout
                    </button>
                </form>
            ) : (
                <p className="text-gray-400 text-sm text-center">Log in to participate in the shoutbox.</p>
            )}
        </div>
    );
};

export default Shoutbox;

