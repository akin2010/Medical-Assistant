# Medical AI Assistant

A React-based web application that provides medical information and advice through an AI-powered chat interface. This application leverages Google's Gemini API to deliver informative responses about symptoms, treatments, medications, and lifestyle changes related to medical conditions.

## Features

- **AI-powered Medical Chat**: Get detailed information about medical conditions and symptoms
- **Chat History**: Save and browse previous conversations
- **Persistent Storage**: Conversations are saved in browser storage
- **Responsive Design**: Works on both desktop and mobile devices
- **Backup System**: Automatic backup of chat data to prevent loss
- **Markdown-style Formatting**: Responses include formatted text with headings, lists, and emphasis

## Technologies Used

- [React](https://reactjs.org/) - Frontend framework
- [Google Gemini API](https://ai.google.dev/) - AI model for generating responses
- [OpenFDA API](https://api.fda.gov/) - For medication information
- [ICD-10 API](https://www.icd10api.com/) - For medical condition codes
- localStorage/sessionStorage - For persistent data storage
- [Font Awesome](https://fontawesome.com/) - For UI icons

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your values for the following variables:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   REACT_APP_OPENFDA_API_KEY=your_openfda_api_key
   REACT_APP_ICD10_API_KEY=your_icd10_api_key
   ```
4. Start the development server:
   ```bash
    npm start
    ```

## Important Notice
This application responses are for educational purposes only. Always consult healthcare professionals for medical advice.