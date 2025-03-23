from flask import Flask, jsonify, render_template, request
from chatbot import ChatBot
import os

app = Flask(__name__)

# Initialize chatbot with Gemini API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
bot = ChatBot(api_key)
bot.initialize()

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")  # Serves the chatbot UI

@app.route("/", methods=["POST"])
def send_request():
    try:
        new_query = request.get_json().get("query", "").strip()
        if not new_query:
            return jsonify({"Answer": "Please enter a valid question."}), 400

        answer = bot.request(new_query)
        return jsonify({"Answer": answer})
    except Exception as e:
        return jsonify({"Answer": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
