import React, { useState, useRef, useEffect } from 'react';
import './ChatContainer.css';

function ChatContainer({ messages, onSendMessage, isTyping }) {
  const [input, setInput] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="main-content">
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h1>Medical AI Assistant</h1>
            <p>Ask me anything about medical conditions, symptoms, or general health advice.</p>
            <p>Please note: This is for informational purposes only and not a substitute for professional medical advice.</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}-message`}>
                {message.text}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="input-container">
        <form onSubmit={handleSubmit} className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your medical question here..."
            rows={1}
          />
          <button type="submit" disabled={isTyping}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        <div className="disclaimer">
          <p>This AI assistant provides general medical information. Always consult a healthcare professional for medical advice.</p>
        </div>
      </div>
    </div>
  );
}

export default ChatContainer; 