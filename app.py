from flask import Flask, render_template, request, jsonify
from chatbot import ChatBot
import os

app = Flask(__name__)

api_key = os.getenv("AZURE_OPENAI_KEY")
api_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({'response': "Please enter a valid message."})

    # Create a temporary ChatBot instance for each request (stateless)
    bot = ChatBot(api_key, api_endpoint, "You are a helpful assistant.")
    bot.initialize()
    response = bot.request(user_input)

    return jsonify({'response': response})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
