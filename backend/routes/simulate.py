from fastapi import APIRouter
from schemas import SimulateRequest, SimulateResponse, Turn
from core.dialogue_flow import simulate_dialogue

router = APIRouter()

@router.post("/", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    raw_dialogue = simulate_dialogue(
        req.topic, req.role_a, req.role_b, req.turns
    )
    parsed = [Turn(speaker=line.split(":")[0], message=":".join(line.split(":")[1:]).strip())
              for line in raw_dialogue]
    return SimulateResponse(dialogue=parsed)
