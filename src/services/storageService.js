// Storage keys
const STORAGE_KEYS = {
  CHAT_HISTORY: 'chatHistory',
  SETTINGS: 'chatSettings',
  BACKUP: 'chatBackup',  // New backup key
  CURRENT_CHAT: 'currentChat',  // New key for current chat
  LAST_MESSAGE: 'lastMessage'  // New key for last message
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 'medium',
  autoScroll: true
};

class StorageService {
  // Check if storage is available
  static isStorageAvailable(type) {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Current Chat Methods (using sessionStorage)
  static saveCurrentChat(messages) {
    if (!this.isStorageAvailable('sessionStorage')) {
      console.warn('sessionStorage is not available');
      return false;
    }

    try {
      if (messages.length > 0) {
        const currentChat = {
          messages: messages,
          timestamp: new Date().toISOString()
        };
        window.sessionStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, JSON.stringify(currentChat));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving current chat:', error);
      return false;
    }
  }

  static getCurrentChat() {
    if (!this.isStorageAvailable('sessionStorage')) {
      return [];
    }

    try {
      const currentChat = window.sessionStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
      if (!currentChat) return [];

      const parsedChat = JSON.parse(currentChat);
      if (Array.isArray(parsedChat.messages)) {
        return parsedChat.messages;
      }
      return [];
    } catch (error) {
      console.error('Error getting current chat:', error);
      return [];
    }
  }

  static clearCurrentChat() {
    if (this.isStorageAvailable('sessionStorage')) {
      window.sessionStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
    }
  }

  // Chat History Methods
  static saveChatHistory(history) {
    if (!this.isStorageAvailable('localStorage')) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      // Validate history before saving
      if (!Array.isArray(history)) {
        throw new Error('History must be an array');
      }

      // Ensure each chat has required fields
      const validatedHistory = history.map(chat => ({
        id: chat.id || Date.now(),
        title: chat.title || 'Untitled Chat',
        messages: Array.isArray(chat.messages) ? chat.messages : [],
        timestamp: chat.timestamp || new Date().toISOString()
      }));

      // Save to localStorage
      window.localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(validatedHistory));
      
      // Create backup
      this.createBackup();
      
      return true;
    } catch (error) {
      console.error('Error saving chat history:', error);
      return false;
    }
  }

  static getChatHistory() {
    if (!this.isStorageAvailable('localStorage')) {
      return [];
    }

    try {
      const history = window.localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!history) {
        // Try to restore from backup if main data is missing
        if (this.restoreFromBackup()) {
          return this.getChatHistory();
        }
        return [];
      }

      const parsedHistory = JSON.parse(history);
      
      // Validate the structure
      if (!Array.isArray(parsedHistory)) {
        throw new Error('Invalid chat history structure');
      }

      // Ensure each chat has required fields
      return parsedHistory.map(chat => ({
        id: chat.id || Date.now(),
        title: chat.title || 'Untitled Chat',
        messages: Array.isArray(chat.messages) ? chat.messages : [],
        timestamp: chat.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      // Try to restore from backup on error
      if (this.restoreFromBackup()) {
        return this.getChatHistory();
      }
      return [];
    }
  }

  static clearChatHistory() {
    if (this.isStorageAvailable('localStorage')) {
      window.localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    }
  }

  // Settings Methods
  static getSettings() {
    if (!this.isStorageAvailable('localStorage')) {
      return DEFAULT_SETTINGS;
    }

    try {
      const settings = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!settings) return DEFAULT_SETTINGS;

      const parsedSettings = JSON.parse(settings);
      // Validate settings structure
      if (typeof parsedSettings === 'object' && 
          Object.keys(DEFAULT_SETTINGS).every(key => key in parsedSettings)) {
        return { ...DEFAULT_SETTINGS, ...parsedSettings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    if (!this.isStorageAvailable('localStorage')) {
      return false;
    }

    try {
      // Validate settings before saving
      if (typeof settings !== 'object') {
        throw new Error('Settings must be an object');
      }

      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Storage Status Methods
  static getStorageStatus() {
    if (!this.isStorageAvailable('localStorage')) {
      return null;
    }

    try {
      let total = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const value = window.localStorage.getItem(key);
        total += key.length + value.length;
      }
      
      const quota = 5 * 1024 * 1024; // 5MB typical limit
      return {
        used: total,
        quota,
        percentage: (total / quota) * 100
      };
    } catch (error) {
      console.error('Error getting storage status:', error);
      return null;
    }
  }

  // Clear All Data
  static clearAll() {
    this.clearCurrentChat();
    this.clearChatHistory();
    if (this.isStorageAvailable('localStorage')) {
      window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    }
  }

  // Backup Methods
  static createBackup() {
    if (!this.isStorageAvailable('localStorage')) {
      return false;
    }

    try {
      const currentHistory = this.getChatHistory();
      const backup = {
        history: currentHistory,
        timestamp: new Date().toISOString()
      };
      window.localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }

  static restoreFromBackup() {
    if (!this.isStorageAvailable('localStorage')) {
      return false;
    }

    try {
      const backup = window.localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (!backup) return false;

      const parsedBackup = JSON.parse(backup);
      if (this.validateBackup(parsedBackup)) {
        this.saveChatHistory(parsedBackup.history);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  static validateBackup(backup) {
    return (
      backup &&
      typeof backup === 'object' &&
      Array.isArray(backup.history) &&
      typeof backup.timestamp === 'string'
    );
  }

  // Last Message Methods
  static saveLastMessage(message) {
    if (!this.isStorageAvailable('localStorage')) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      if (message) {
        const lastMessage = {
          text: message,
          timestamp: new Date().toISOString()
        };
        window.localStorage.setItem(STORAGE_KEYS.LAST_MESSAGE, JSON.stringify(lastMessage));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving last message:', error);
      return false;
    }
  }

  static getLastMessage() {
    if (!this.isStorageAvailable('localStorage')) {
      return null;
    }

    try {
      const lastMessage = window.localStorage.getItem(STORAGE_KEYS.LAST_MESSAGE);
      if (!lastMessage) return null;

      const parsedMessage = JSON.parse(lastMessage);
      if (typeof parsedMessage.text === 'string' && parsedMessage.timestamp) {
        return parsedMessage;
      }
      return null;
    } catch (error) {
      console.error('Error getting last message:', error);
      return null;
    }
  }

  static clearLastMessage() {
    if (this.isStorageAvailable('localStorage')) {
      window.localStorage.removeItem(STORAGE_KEYS.LAST_MESSAGE);
    }
  }
}

export default StorageService; 