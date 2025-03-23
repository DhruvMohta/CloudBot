from flask import Flask, jsonify, render_template, request
from chatbot import ChatBot
import os
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Load your Gemini API key from environment variables
api_key = os.getenv("GEMINI_API_KEY")
bot = ChatBot(api_key)
bot.initialize()

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")  # Renders your chat UI

@app.route("/", methods=["POST"])
def send_request():
    try:
        data = request.get_json()
        new_query = data.get("query", "").strip()
        image_base64 = data.get("image_base64", None)

        if not new_query:
            return jsonify({"Answer": "Please enter a valid question."}), 400

        # Convert base64 to a PIL image if an image was attached
        pil_image = None
        if image_base64:
            try:
                image_bytes = base64.b64decode(image_base64)
                pil_image = Image.open(BytesIO(image_bytes))
            except Exception as e:
                print("Error decoding base64 image:", e)

        # Call the ChatBot with text and optional image
        answer_text = bot.request(new_query, image_pil=pil_image)
        return jsonify({"Answer": answer_text})
    except Exception as e:
        return jsonify({"Answer": f"Error: {str(e)}"}), 500

@app.route("/upload", methods=["POST"])
def upload_files():
    if "uploaded_files" not in request.files:
        return jsonify({"summary": "No files found"}), 400

    files = request.files.getlist("uploaded_files")
    for f in files:
        filename = f.filename
        file_data = f.read()
        print("Uploaded file:", filename)
        # Process or store the file data as needed

    return jsonify({"summary": f"{len(files)} file(s) processed by AI!"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
