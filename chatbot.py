import os
import dotenv
import google.generativeai as genai

# Load environment variables from .env file
dotenv.load_dotenv()

class ChatBot:
    def __init__(self, api_key, system_prompt="You are a generic chatbot and helpful like Wall-E"):
        # Store the API key and prompt
        self.api_key = api_key
        self.system_prompt = system_prompt
        self.chat = None

    def initialize(self):
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)

        # Start a new chat session with the system prompt
        self.chat = genai.GenerativeModel("gemini-2.0-flash").start_chat(
            history=[
                {"role": "user", "parts": [self.system_prompt]},
                {"role": "model", "parts": ["Okay, I'm ready to help!"]}
            ]
        )

    def request(self, new_query):
        if not self.chat:
            raise Exception("Chat not initialized. Call initialize() first.")

        # Send the user query to Gemini and get the response
        response = self.chat.send_message(new_query)

        # Return the text response from the model
        return response.text
