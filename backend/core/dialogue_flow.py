from services.llm_engine import call_llm

def simulate_dialogue(topic, role_a, role_b, turns):
    history = []
    for i in range(turns):
        if i % 2 == 0:
            prompt = f"{role_a}로서 다음 주제에 답하라: '{topic}'. 이전 발화들: {history}"
            speaker = "A"
        else:
            prompt = f"{role_b}로서 반응하라. 이전 발화들: {history}"
            speaker = "B"
        response = call_llm(prompt)
        history.append(f"{speaker}: {response}")
    return history
