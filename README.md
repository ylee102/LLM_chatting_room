# LLM Chatting Room

A web application that simulates conversations between two LLMs on a given topic.

## Features

- Simulate conversations between two LLMs
- Customize roles and number of turns
- Real-time conversation display
- Modern Material-UI interface

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file from `.env.example` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a topic for the conversation
3. Define roles for both LLMs
4. Set the number of turns
5. Click "Start Simulation" to begin the conversation

## Technologies Used

- Backend: FastAPI, OpenAI API
- Frontend: React, TypeScript, Material-UI
- API Communication: Axios 
