import os
import dotenv
from google import genai
from google.genai import types
from PIL import Image

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

    def request(self, text_prompt, image_pil=None):
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

        # Call the model. Adjust the model name if needed (e.g., "gemini-2.0-flash" or "gemini-pro-vision")
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents
        )
        return response.text
