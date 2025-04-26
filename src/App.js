import React, { useState, useEffect } from 'react';
import './App.css';
import ChatContainer from './components/ChatContainer';
import Sidebar from './components/Sidebar';

// Gemini API configuration
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = process.env.REACT_APP_GEMINI_API_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading chat history:', error);
        localStorage.removeItem('chatHistory');
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
      // If storage is full, remove oldest chats
      if (error.name === 'QuotaExceededError') {
        const reducedHistory = chatHistory.slice(0, Math.floor(chatHistory.length / 2));
        localStorage.setItem('chatHistory', JSON.stringify(reducedHistory));
        setChatHistory(reducedHistory);
      }
    }
  }, [chatHistory]);

  const handleNewChat = () => {
    // Only save current chat to history if it's not empty and not already saved
    if (messages.length > 0 && !chatHistory.some(chat => 
      chat.messages.length === messages.length && 
      chat.messages.every((msg, i) => msg.text === messages[i].text)
    )) {
      const newChat = {
        id: Date.now(),
        title: messages[0].text.substring(0, 30) + '...',
        messages: [...messages],
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [newChat, ...prev]);
    }
    setMessages([]);
  };

  const handleSendMessage = async (message) => {
    // Add user message
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a medical AI assistant. Please provide helpful and accurate medical information about: ${message}. 
              Always include a disclaimer that this is not medical advice and users should consult healthcare professionals.
              Format your response in a clear, easy-to-read way with bullet points or numbered lists when appropriate.`
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const assistantMessage = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { text: assistantMessage, sender: 'assistant' }]);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'assistant' 
      }]);
      console.error('Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(chat => chat.id === chatId);
    if (chat) {
      setMessages(chat.messages);
    }
  };

  const deleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
  };

  return (
    <div className="app">
      <Sidebar 
        onNewChat={handleNewChat} 
        chatHistory={chatHistory}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
      />
      <ChatContainer 
        messages={messages} 
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
      />
    </div>
  );
}

export default App; 