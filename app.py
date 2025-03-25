from flask import Flask, jsonify, render_template, request, session
from chatbot import ChatBot
import os
import base64
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import uuid
import json
import time
import shutil

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your_secret_key")  # Add a secret key for session management

# Load your Gemini API key from environment variables
api_key = os.getenv("GEMINI_API_KEY")
bot = ChatBot(api_key)
bot.initialize()

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join("static", "uploads")
os.makedirs(uploads_dir, exist_ok=True)

@app.route("/", methods=["GET"])
def index():
    # Clear the session when the page is loaded (optional)
    if request.args.get('clear', 'false').lower() == 'true':
        # Get image paths before clearing the session
        image_paths = session.get('image_paths', {})
        
        # Clear session data
        session.clear()
        
        # Delete individual image files
        for image_id, image_path in image_paths.items():
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Error removing image {image_path}: {e}")
    
    return render_template("index.html")

@app.route("/clear", methods=["POST"])
def clear_conversation():
    """API endpoint to clear the conversation history and uploaded images"""
    try:
        # Get image paths before clearing the session
        image_paths = session.get('image_paths', {})
        
        # Clear session data
        session.pop('conversation_history', None)
        session.pop('image_paths', None)
        
        # Delete individual image files
        for image_id, image_path in image_paths.items():
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    print(f"Removed image: {image_path}")
                except Exception as e:
                    print(f"Error removing image {image_path}: {e}")
        
        return jsonify({"status": "conversation and images cleared"})
    except Exception as e:
        print(f"Error clearing conversation: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/", methods=["POST"])
def send_request():
    try:
        data = request.get_json()
        new_query = data.get("query", "").strip()
        image_base64 = data.get("image_base64", None)

        if not new_query:
            return jsonify({"Answer": "Please enter a valid question."}), 400

        # Initialize conversation history if it doesn't exist
        if 'conversation_history' not in session:
            session['conversation_history'] = []
            session['image_paths'] = {}

        # Process image if provided
        image_id = None
        if image_base64:
            try:
                image_bytes = base64.b64decode(image_base64)
                pil_image = Image.open(BytesIO(image_bytes))
                
                # Generate a unique ID for this image
                image_id = str(uuid.uuid4())
                
                # Save the image
                image_path = os.path.join(uploads_dir, f"{image_id}.png")
                pil_image.save(image_path)
                
                # Store image path with its ID in session
                session['image_paths'][image_id] = image_path
                
                # Add a message indicating image upload to conversation history
                image_message = {
                    "role": "user",
                    "content": f"[Uploaded an image: {image_id}]",
                    "has_image": True,
                    "image_id": image_id,
                    "timestamp": time.time()
                }
                session['conversation_history'].append(image_message)
                
            except Exception as e:
                print(f"Error processing image: {e}")
                return jsonify({"Answer": f"Error processing image: {str(e)}"}), 400
        
        # Add the new user message to conversation history
        user_message = {
            "role": "user",
            "content": new_query,
            "has_image": False,
            "timestamp": time.time()
        }
        session['conversation_history'].append(user_message)
        
        # Update session to save the latest conversation
        session.modified = True

        # Generate context for the AI by formatting the conversation history
        context = ""
        active_image_id = None
        
        for msg in session['conversation_history']:
            prefix = ""
            if msg["role"] == "user":
                prefix = "User: "
                if msg.get("has_image", False):
                    active_image_id = msg.get("image_id")
                    prefix += "[Shared an image] "
            else:
                prefix = "AI: "
            
            context += f"{prefix}{msg['content']}\n\n"

        # Get the active image if available
        active_image = None
        if active_image_id and active_image_id in session['image_paths']:
            image_path = session['image_paths'][active_image_id]
            if os.path.exists(image_path):
                active_image = Image.open(image_path)

        # Call the ChatBot with conversation context and optional image
        system_prompt = "You are a helpful assistant. Always maintain context of the conversation and reference any images that were shared."
        answer_text = bot.request_with_history(
            context, 
            new_query,
            system_prompt=system_prompt,
            image_pil=active_image
        )

        # Add the AI's response to conversation history
        ai_response = {
            "role": "assistant",
            "content": answer_text,
            "has_image": False,
            "timestamp": time.time()
        }
        session['conversation_history'].append(ai_response)
        session.modified = True

        return jsonify({"Answer": answer_text})

    except Exception as e:
        print(f"Error in send_request: {e}")
        if '503' in str(e):
            return jsonify({
                "Answer": "The service is currently unavailable. Please try again later."
            }), 503
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