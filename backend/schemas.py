from pydantic import BaseModel

class SimulateRequest(BaseModel):
    topic: str
    role_a: str
    role_b: str
    turns: int

class Turn(BaseModel):
    speaker: str
    message: str

class SimulateResponse(BaseModel):
    dialogue: list[Turn]
