# Gemini Text Bot

A simple text-based chatbot using Google's Gemini API.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the project root and add your Google API key:
```
GOOGLE_API_KEY=your_api_key_here
```

You can get your API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

## Usage

Run the bot using:
```bash
python gemini_bot.py
```

- Type your messages to chat with the bot
- Type 'quit' to exit the conversation

## Features

- Simple command-line interface
- Error handling for API issues
- Conversation history maintained during the session
- Easy to use and modify

## Note

Make sure to keep your API key secure and never share it publicly. 