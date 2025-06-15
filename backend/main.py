from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
from services.llm_engine import call_llm
from config import OPENAI_API_KEY

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log API key status
logger.debug(f"API key found: {'Yes' if OPENAI_API_KEY else 'No'}")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

logger.debug(f"Loaded API key: {OPENAI_API_KEY[:10]}...")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    speaker: str
    message: str

class SimulationRequest(BaseModel):
    topic: str
    role_a: str
    role_b: str
    model_a: str
    model_b: str
    temperature: float
    turns: int
    conversation: Optional[List[Message]] = []

def generate_prompt(topic: str, my_role: str, previous_messages: List[Message], my_speaker: str, role_a: str, role_b: str) -> str:
    def speaker_role(speaker):
        return role_a if speaker == 'A' else role_b

    # Build conversation context with speaker roles
    context = ""
    if previous_messages:
        context = "\n".join([
            f"{msg.speaker}({speaker_role(msg.speaker)}): {msg.message}"
            for msg in previous_messages
        ])

    # Get the other speaker's last message if it exists
    other_speaker_message = ""
    if previous_messages:
        last_message = previous_messages[-1]
        if last_message.speaker != my_speaker:
            other_speaker_message = f"\nRespond to {last_message.speaker}({speaker_role(last_message.speaker)}) who said: '{last_message.message}'"

    # Create role-specific instructions
    role_instructions = (
        f"You are strictly playing the role of {my_role}. This is a crucial part of your identity.\n"
        f"1. NEVER break character - you must always act and think as {my_role}\n"
        f"2. Your responses should reflect {my_role}'s unique perspective, knowledge, and personality\n"
        f"3. Engage directly with what the other person said, but maintain your character's viewpoint\n"
        f"4. Be consistent with your character's background and expertise\n"
        f"5. If the other person says something your character would disagree with, express that disagreement naturally\n"
    )

    base_prompt = (
        f"{role_instructions}\n\n"
        f"Topic of discussion: {topic}\n\n"
        f"Previous conversation:\n{context}\n"
        f"{other_speaker_message}\n\n"
        f"Respond as {my_role}, maintaining your character's perspective while engaging with the conversation."
    )
    return base_prompt

@app.post("/simulate")
async def simulate_conversation(request: SimulationRequest):
    try:
        # 이전 대화 내용 유지
        conversation = request.conversation.copy() if request.conversation else []
        current_idx = len(conversation) % 2
        
        # 현재 턴의 화자 정보
        current_speaker = "A" if current_idx == 0 else "B"
        current_role = request.role_a if current_idx == 0 else request.role_b
        current_model = request.model_a if current_idx == 0 else request.model_b
        
        # 프롬프트 생성 및 응답 요청
        prompt = generate_prompt(
            request.topic,
            current_role,
            conversation,
            current_speaker,
            request.role_a,
            request.role_b
        )
        
        logger.info(f"Using model {current_model} for role {current_role}")
        response = call_llm(prompt, request.temperature, current_model)
        
        # 새 메시지 추가
        new_message = Message(speaker=current_speaker, message=response)
        
        return {"conversation": [new_message]}  # 새 메시지만 반환
    except Exception as e:
        logger.error(f"Error in simulate_conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
