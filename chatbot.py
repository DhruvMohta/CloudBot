import os
from openai import AzureOpenAI
import dotenv

# Load environment variables from .env file
dotenv.load_dotenv()

class ChatBot():
    def __init__(self, api_key, azure_endpoint, system_prompt):
        # OPENAI authentication
        self.OPENAI_API_KEY = api_key
        self.AZURE_OPENAI_ENDPOINT = azure_endpoint

        # model parameter
        self.system_prompt = system_prompt

    def initialize(self):
        self.client = AzureOpenAI(
            azure_endpoint=self.AZURE_OPENAI_ENDPOINT,
            api_key=self.OPENAI_API_KEY,
            api_version="2025-01-01-preview"
        )

    def request(self, new_query):
        messages = [{"role": "system", "content": self.system_prompt}]

        if new_query:
            messages.append({"role": "user", "content": new_query})

        response = self.client.chat.completions.create(
            model="testprojectdhruv1",
            messages=messages
        )

        return response.choices[0].message.content