from core.speech_service import speech_service
from agents.orchestrator import orchestrator

class VoiceAgent:
    async def handle_voice(self, user_id: str, audio_bytes: bytes) -> dict:
        text = speech_service.speech_to_text(audio_bytes)
        if not text:
            return {"text": "", "reply": "Sorry, I couldn't understand that.", "audio": b""}

        reply = await orchestrator.handle(user_id, text)
        audio = speech_service.text_to_speech(reply)

        return {"text": text, "reply": reply, "audio": audio}

voice_agent = VoiceAgent()