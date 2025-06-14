from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    topic: str
    role_a: str
    role_b: str
    turns: int

class Message(BaseModel):
    speaker: str
    message: str

class SimulationResponse(BaseModel):
    conversation: List[Message]

def generate_prompt(topic: str, role_a: str, role_b: str, conversation_history: List[Message]) -> str:
    if not conversation_history:
        return f"""You are {role_a}. Start a conversation about {topic} with {role_b}.
        Keep your response concise and engaging."""
    
    last_speaker = conversation_history[-1].speaker
    current_role = role_b if last_speaker == "A" else role_a
    
    history = "\n".join([f"{msg.speaker}: {msg.message}" for msg in conversation_history])
    return f"""You are {current_role}. Continue the conversation about {topic}.
    Previous conversation:
    {history}
    
    Respond naturally and keep your response concise."""

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_conversation(request: SimulationRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    conversation = []
    
    try:
        for turn in range(request.turns):
            # Determine current speaker
            current_speaker = "A" if turn % 2 == 0 else "B"
            
            # Generate prompt based on conversation history
            prompt = generate_prompt(
                request.topic,
                request.role_a,
                request.role_b,
                conversation
            )
            
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.7
            )
            
            # Extract and store the message
            message = response.choices[0].message.content.strip()
            conversation.append(Message(speaker=current_speaker, message=message))
        
        return SimulationResponse(conversation=conversation)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
