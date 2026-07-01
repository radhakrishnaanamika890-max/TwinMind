from groq import Groq
from core.config import settings

client = Groq(api_key=settings.groq_api_key)

class GeminiClient:
    async def chat(self, prompt: str, system_prompt: str = "") -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1000
        )
        return response.choices[0].message.content

    async def embed(self, text: str) -> list[float]:
        # Groq embedding இல்லை — simple hash embedding use பண்றோம்
        import hashlib
        import math
        hash_val = hashlib.md5(text.encode()).hexdigest()
        vector = []
        for i in range(0, min(len(hash_val), 768), 2):
            val = int(hash_val[i:i+2], 16) / 255.0
            vector.append(val)
        while len(vector) < 768:
            vector.append(0.0)
        return vector[:768]

gemini = GeminiClient()