import openai
from config import OPENAI_API_KEY, LLM_MODEL

openai.api_key = OPENAI_API_KEY

def call_llm(prompt: str) -> str:
    res = openai.ChatCompletion.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content.strip()
