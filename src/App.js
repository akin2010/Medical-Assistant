import React, { useState, useEffect } from 'react';
import './App.css';
import ChatContainer from './components/ChatContainer';
import Sidebar from './components/Sidebar';
import StorageService from './services/storageService';

// OpenFDA and ICD-10 API URLs
const OPENFDA_API_URL = "https://api.fda.gov/drug/label.json";
const ICD10_API_URL = "https://www.icd10api.com/api/v1/icd10/codes/search";

// Gemini API configuration
const API_KEY = "Your-API";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Medical information templates
const MEDICAL_TEMPLATES = {
  symptoms: "Common symptoms include: {symptoms}. Additional symptoms may vary by individual.",
  treatments: "Treatment options may include: {treatments}. Always consult with a healthcare provider for personalized treatment plans.",
  medications: "Medications that may be prescribed: {medications}. Dosage and administration should be determined by a healthcare provider.",
  lifestyle: "Lifestyle changes that may help: {lifestyle}. These recommendations are general and may need to be adjusted based on individual circumstances."
};

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isNewChatProcessing, setIsNewChatProcessing] = useState(false);

  // Load chat history and current chat on component mount
  useEffect(() => {
    const savedHistory = StorageService.getChatHistory();
    if (savedHistory.length > 0) {
      setChatHistory(savedHistory);
    }

    // Try to restore current chat from sessionStorage
    const currentChat = StorageService.getCurrentChat();
    if (currentChat && currentChat.length > 0) {
      setMessages(currentChat);
    }
  }, []);

  // Save current chat to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      StorageService.saveCurrentChat(messages);
    }
  }, [messages]);

  // Save chat history whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      StorageService.saveChatHistory(chatHistory);
    }
  }, [chatHistory]);

  // Save current chat before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        StorageService.saveCurrentChat(messages);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages]);

  // Handle creating a new chat with debounce
  const handleNewChat = () => {
    // Prevent multiple clicks
    if (isNewChatProcessing) return;
    
    setIsNewChatProcessing(true);
    
    // Save current chat to history if it's not empty and not already saved
    if (messages.length > 0) {
      // Check if this chat is already in history
      const isDuplicate = chatHistory.some(chat => 
        chat.messages.length === messages.length && 
        chat.messages.every((msg, i) => 
          msg.text === messages[i].text && 
          msg.sender === messages[i].sender
        )
      );
      
      if (!isDuplicate) {
        const newChat = {
          id: Date.now(),
          title: messages[0].text.substring(0, 30) + '...',
          messages: [...messages],
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [newChat, ...prev]);
      }
    }
    
    // Clear current chat from both state and storage
    setMessages([]);
    StorageService.clearCurrentChat();
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      setIsNewChatProcessing(false);
    }, 500);
  };

  // Fetch drug data from OpenFDA API
  const fetchDrugData = async (drugName) => {
    try {
      const response = await fetch(`${OPENFDA_API_URL}?search=brand_name:"${drugName}"&limit=1`);
      const data = await response.json();
      if (data.results && data.results[0]) {
        return data.results[0];  // Return drug information
      }
      return null; // No drug data found
    } catch (error) {
      console.error("Error fetching drug data:", error);
      return null;
    }
  };

  // Fetch illness data using ICD-10 API
  const fetchIllnessData = async (symptom) => {
    try {
      const response = await fetch(`${ICD10_API_URL}?query=${symptom}`);
      const data = await response.json();
      if (data.codes && data.codes.length > 0) {
        return data.codes[0];  // Return illness code and details
      }
      return null; // No illness data found
    } catch (error) {
      console.error("Error fetching illness data:", error);
      return null;
    }
  };

  // Generate MCP context based on user input
  const generateMCPContext = async (userMessage) => {
    const symptoms = userMessage.split(','); // Assuming symptoms are separated by commas

    // Fetch relevant illness data based on symptoms
    const illnessData = [];
    for (const symptom of symptoms) {
      const illness = await fetchIllnessData(symptom.trim());
      if (illness) illnessData.push(illness);
    }

    // Fetch drug data (if applicable)
    const drugData = [];
    for (const symptom of symptoms) {
      const drug = await fetchDrugData(symptom.trim());
      if (drug) drugData.push(drug);
    }

    return {
      context: [
        {
          name: "IllnessDatabase",
          description: "Illnesses and related symptoms.",
          data: illnessData
        },
        {
          name: "DrugDatabase",
          description: "Medication information.",
          data: drugData
        },
        {
          name: "UserSymptoms",
          description: "Symptoms provided by the user.",
          data: symptoms.map(symptom => ({ symptom }))
        }
      ]
    };
  };

  // Handle sending a message
  const handleSendMessage = async (message) => {
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setIsTyping(true);

    try {
      // Generate context from chat history
      const chatContext = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the current message to context
      chatContext.push({
        role: 'user',
        content: message
      });

      const mcpContext = await generateMCPContext(message);

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a medical AI assistant. Please provide detailed medical information about the user's symptoms and potential treatments. 
              Focus on providing comprehensive information about symptoms, treatment options, medications, and lifestyle changes.
              Format your response with clear headings and bullet points for easy reading.
              Include specific details about symptoms, their severity, and how they might progress.
              For treatments, explain both conventional medical approaches and complementary options.
              Only include a brief medical disclaimer at the end of your response.
              
              Previous conversation context:
              ${JSON.stringify(chatContext)}
              
              Medical context:
              ${JSON.stringify(mcpContext)}`
            }]
          }]
        })
      });

      const data = await response.json();

      // Ensure the response is valid
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const assistantMessage = data.candidates[0].content.parts[0].text;

        // Add assistant's reply
        setMessages(prev => [
          ...prev, 
          { 
            text: assistantMessage + "\n\nNote: This information is for educational purposes only. Consult a healthcare provider for medical advice.", 
            sender: 'assistant' 
          }
        ]);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { 
          text: 'Sorry, I encountered an error. Please try again.', 
          sender: 'assistant' 
        }
      ]);
      console.error('Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Load a previous chat by ID
  const loadChat = (chatId) => {
    const chat = chatHistory.find(chat => chat.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      StorageService.saveCurrentChat(chat.messages);
    }
  };

  // Delete a chat by ID
  const deleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    // If we're deleting the current chat, clear it
    const currentChat = StorageService.getCurrentChat();
    if (currentChat && chatHistory.find(chat => chat.id === chatId)?.messages === currentChat) {
      setMessages([]);
      StorageService.clearCurrentChat();
    }
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
