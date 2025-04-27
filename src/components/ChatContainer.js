import React, { useState, useRef, useEffect } from 'react';
import './ChatContainer.css';

function ChatContainer({ messages, onSendMessage, isTyping }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatMessage = (text) => {
    // Replace **text** with bold
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace *text* with italic
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Replace bullet points with proper list items
    formattedText = formattedText.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    // Replace numbered lists
    formattedText = formattedText.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
    // Replace headings (## Heading)
    formattedText = formattedText.replace(/^##\s+(.*)$/gm, '<h3>$1</h3>');
    // Replace subheadings (# Subheading)
    formattedText = formattedText.replace(/^#\s+(.*)$/gm, '<h2>$1</h2>');
    // Add line breaks
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return { __html: formattedText };
  };

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
      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h1>Medical AI Assistant</h1>
              <p>Ask me anything about medical conditions, symptoms, or general health advice.</p>
              <p>I can provide detailed information about symptoms, treatments, medications, and lifestyle changes.</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    {message.sender === 'assistant' ? (
                      <div 
                        className="formatted-text"
                        dangerouslySetInnerHTML={formatMessage(message.text)}
                      />
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-container">
          <form onSubmit={handleSubmit} className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms or ask about a medical condition..."
              rows={1}
            />
            <button type="submit" disabled={isTyping}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
          <div className="disclaimer">
            <p>For educational purposes only. Consult healthcare professionals for medical advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatContainer; 