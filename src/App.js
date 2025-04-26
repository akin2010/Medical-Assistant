import React, { useState, useEffect } from 'react';
import './App.css';
import ChatContainer from './components/ChatContainer';
import Sidebar from './components/Sidebar';
import StorageService from './services/storageService';

// Gemini API configuration
const API_KEY = "AIzaSyDEniRVoeXbxN_veHK-JdjGSkXH441gAT0";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Load chat history on component mount
  useEffect(() => {
    const savedHistory = StorageService.getChatHistory();
    if (savedHistory.length > 0) {
      setChatHistory(savedHistory);
    }
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      StorageService.saveChatHistory(chatHistory);
    }
  }, [chatHistory]);

  const handleNewChat = () => {
    // Save current chat to history if it's not empty
    if (messages.length > 0) {
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