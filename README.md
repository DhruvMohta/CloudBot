# CloudBot: A Gemini-Powered AI Chatbot Project

CloudBot is a **web-based chatbot** powered by **Google's Gemini API** (`google-generativeai`) capable of handling text and image queries. This project demonstrates building, containerizing (with **Docker**), and deploying an AI assistant to **Microsoft Azure**.

> **Motivation:** "From curiosity about Gemini-powered chatbots to learning Docker and Azure deployment—this project covers it all!"

---

## Table of Contents

1. [Overview & Features](#overview--features)
2. [Tech Stack](#tech-stack)
3. [Local Development](#local-development)
   - [Requirements](#requirements)
   - [Installation Steps](#installation-steps)
   - [Running Locally (Without Docker)](#running-locally-without-docker)
   - [Running Locally (Docker)](#running-locally-docker)
4. [Azure Deployment](#azure-deployment)
   - [Resource Setup](#resource-setup)
   - [Building & Pushing to Azure Container Registry](#building--pushing-to-azure-container-registry)
   - [Azure Web App](#azure-web-app)
   - [Setting Environment Variables](#setting-environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Project Structure](#project-structure)

---

## Overview & Features

### Overview

- Flask backend (`app.py`) serving chat UI and handling API calls.
- Integration with Gemini via `chatbot.py`.
- Frontend supports interactive text and image inputs.

### Features

- **Text & Image Processing**: Chat seamlessly using text or image uploads.
- **Dockerized Application**: Easy build and deployment.
- **Public Web Access**: Hosted publicly via Azure Web App.
- **Responsive UI**: Clean, interactive, and easy to use.

---

## Tech Stack

- **Python (Flask)**
- **HTML/CSS/JS**
- **Gemini API (`google-generativeai`)**
- **Docker**
- **Azure (ACR & Web App)**

---

## Local Development

### Requirements

- Python 3.9+
- pip package manager
- Gemini API Key ([Google MakerSuite](https://makersuite.google.com/app/apikey))
- Docker (optional)

### Installation Steps

Clone the repository:
```bash
git clone https://github.com/YourUsername/CloudBot.git
cd CloudBot
```

Set up environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

Create a `.env` file:
```env
GEMINI_API_KEY=YourRealGeminiKey
```

### Running Locally (Without Docker)

Start the Flask app:
```bash
python app.py
```
Access at: [http://localhost:5000](http://localhost:5000)

### Running Locally (Docker)

Build the Docker image:
```bash
docker build -t cloudbot:latest .
```

Run the Docker container:
```bash
docker run -p 5000:5000 -e GEMINI_API_KEY="YourRealGeminiKey" cloudbot:latest
```

Access at: [http://localhost:5000](http://localhost:5000)

---

## Azure Deployment

### Resource Setup

Login:
```bash
az login
az group create --name CloudBot --location "WestEurope"
az acr create --name CloudBot --resource-group CloudBot --sku Basic
```

### Building & Pushing to Azure Container Registry

```bash
docker build -t cloudbot:latest .
docker tag cloudbot:latest cloudbot.azurecr.io/cloudbot:latest
az acr login --name CloudBot
docker push cloudbot.azurecr.io/cloudbot:latest
```

### Azure Web App

Create App Service:
```bash
az appservice plan create --name CloudBotPlan --resource-group CloudBot --sku B1 --is-linux
```

Create Web App:
```bash
az webapp create --resource-group CloudBot --plan CloudBotPlan --name cloudbotweb --deployment-container-image-name cloudbot.azurecr.io/cloudbot:latest
```

Set Registry Credentials:
```bash
az acr update --name CloudBot --admin-enabled true
az webapp config container set --name cloudbotweb --resource-group CloudBot --container-image-name cloudbot.azurecr.io/cloudbot:latest --container-registry-url https://cloudbot.azurecr.io --container-registry-user <ACR_USERNAME> --container-registry-password "<ACR_PASSWORD>"
```

### Setting Environment Variables

```bash
az webapp config appsettings set --name cloudbotweb --resource-group CloudBot --settings GEMINI_API_KEY="YourRealGeminiKey"
az webapp restart --name cloudbotweb --resource-group CloudBot
```

Access the deployed site at:
```
https://cloudbotweb.azurewebsites.net
```

Logs:
```bash
az webapp log tail --name cloudbotweb --resource-group CloudBot
```

---

## Troubleshooting

- **ModuleNotFoundError:** Verify dependencies, Docker cache rebuild (`--no-cache`).
- **Gemini API key issues (400 Error):** Ensure a valid key from [Google MakerSuite](https://makersuite.google.com/app/apikey) and confirm the environment variable setup.
- **Azure Registry Credentials:** If credentials appear null, ensure admin access is enabled (`az acr update`). Retrieve credentials with `az acr credential show --name CloudBot`.
- **Environment Variable Null (PowerShell):** Ensure correct quoting:
  ```powershell
  az webapp config appsettings set `
    --name cloudbotweb `
    --resource-group CloudBot `
    --settings "GEMINI_API_KEY=`"YourRealGeminiKey`""
  ```

---

## Project Structure

```
.
├── app.py
├── chatbot.py
├── templates/
│   └── index.html
├── static/
│   ├── css/style.css
│   └── js/chat.js
├── Dockerfile
├── requirements.txt
├── .gitignore
└── .env
```

### Thanks for exploring CloudBot!

Feel free to customize, scale, and share your AI-powered creations!

