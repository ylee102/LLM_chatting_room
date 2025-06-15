import os

# Directly read from .env file
with open(os.path.join(os.path.dirname(__file__), '.env'), 'r') as f:
    for line in f:
        if line.startswith('OPENAI_API_KEY='):
            OPENAI_API_KEY = line.split('=')[1].strip()
            break

LLM_MODEL = "openai/gpt-4.1-2025-04-14"  # OpenRouter model name
