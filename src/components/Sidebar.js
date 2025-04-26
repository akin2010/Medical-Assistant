import React from 'react';
import './Sidebar.css';

function Sidebar({ onNewChat, chatHistory, onLoadChat, onDeleteChat }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sidebar">
      <div className="new-chat">
        <button onClick={onNewChat} className="new-chat-button">
          <i className="fas fa-plus"></i> New Chat
        </button>
      </div>
      <div className="chat-history">
        <h3>Chat History</h3>
        {chatHistory.length === 0 ? (
          <p className="no-chats">No previous chats</p>
        ) : (
          <ul>
            {chatHistory.map(chat => (
              <li key={chat.id} className="chat-item">
                <div 
                  className="chat-title"
                  onClick={() => onLoadChat(chat.id)}
                >
                  {chat.title}
                </div>
                <div className="chat-meta">
                  <span className="chat-date">{formatDate(chat.timestamp)}</span>
                  <button 
                    className="delete-chat"
                    onClick={() => onDeleteChat(chat.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Sidebar; 