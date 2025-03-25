import os
import dotenv
from google import genai
from google.genai import types
from PIL import Image
import time
dotenv.load_dotenv()

class ChatBot:
    def __init__(self, api_key, system_prompt="You are a generic chatbot and helpful like Wall-E"):
        self.api_key = api_key
        self.system_prompt = system_prompt
        self.client = None  # We'll use this client for all requests

    def initialize(self):
        # Instead of calling genai.configure(), we simply create the client directly.
        self.client = genai.Client(api_key=self.api_key)
        # (Optional) You could also pre-load a conversation or system prompt via the client if desired.

    def request(self, text_prompt, image_pil=None, max_retries=3):
        """
        Sends a request to Gemini.
        If image_pil is None, sends text-only.
        If image_pil is provided (a PIL.Image), sends text+image.
        """
        if not self.client:
            raise Exception("ChatBot not initialized. Call initialize() first.")

        # Build the contents list: always start with the text prompt.
        contents = [text_prompt]
        if image_pil is not None:
            contents.append(image_pil)

        # Implement retry logic with exponential backoff
        retry_count = 0
        last_exception = None

        while retry_count < max_retries:
            try:
                # Call the model
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=contents
                )
                return response.text
            except Exception as e:
                last_exception = e
                # Check if it's a 503 error
                if '503' in str(e):
                    # Exponential backoff: wait 2^retry_count seconds
                    import time
                    wait_time = 2 ** retry_count
                    print(f"Service unavailable. Retrying in {wait_time} seconds... (Attempt {retry_count+1}/{max_retries})")
                    time.sleep(wait_time)
                    retry_count += 1
                else:
                    # For other errors, don't retry
                    raise e
        
        # If we've exhausted retries, raise the last exception
        raise last_exception
    def request_with_history(self, conversation_history, current_query, system_prompt=None, image_pil=None, max_retries=3):
        """
        Sends a request to Gemini with conversation history and retry logic.
        conversation_history: String containing the formatted conversation history
        current_query: The current user query
        system_prompt: Optional system prompt to guide the model
        image_pil: Optional image to include with the query
        """
        if not self.client:
            raise Exception("ChatBot not initialized. Call initialize() first.")
        
        # Build the final prompt with context and system instructions
        full_prompt = ""
        if system_prompt:
            full_prompt += f"{system_prompt}\n\n"
        
        full_prompt += f"{conversation_history}\n\nUser: {current_query}\n\nAI: "
        
        # Call the standard request method with the full context
        return self.request(full_prompt, image_pil, max_retries)
