import requests
import logging
from config import OPENAI_API_KEY

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_llm(prompt: str, temperature: float = 0.7, model: str = "gpt-3.5-turbo") -> str:
    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LLM Chatting Room",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an AI that maintains consistent character roles in conversations. Always stay in character and respond naturally to the ongoing discussion."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2000,
            "temperature": temperature,
            "presence_penalty": 0.6,  # Encourage new topics
            "frequency_penalty": 0.5   # Discourage repetition
        }
        
        logger.info(f"Sending request to model: {model}")
        logger.info(f"Prompt: {prompt}")
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            error_msg = f"API request failed with status {response.status_code}: {response.text}"
            logger.error(error_msg)
            if response.status_code == 401:
                logger.error("Authentication error. Please check your API key and headers.")
            raise Exception(error_msg)
            
        result = response.json()
        response_text = result["choices"][0]["message"]["content"].strip()
        
        # Log the response
        logger.info(f"Model {model} response: {response_text}")
        
        return response_text
        
    except requests.exceptions.Timeout:
        error_msg = "Request timed out. Please try again."
        logger.error(error_msg)
        raise Exception(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error occurred: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"OpenRouter API request failed: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)
