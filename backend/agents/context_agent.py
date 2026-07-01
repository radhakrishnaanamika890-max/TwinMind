from datetime import datetime
import pytz

class ContextAgent:
    def get_current_context(self, timezone: str = "Asia/Kolkata") -> dict:
        tz = pytz.timezone(timezone)
        now = datetime.now(tz)
        return {
            "current_time": now.strftime("%I:%M %p"),
            "current_date": now.strftime("%A, %B %d %Y"),
            "day_of_week": now.strftime("%A"),
            "timezone": timezone
        }

    def format_context(self, timezone: str = "Asia/Kolkata") -> str:
        ctx = self.get_current_context(timezone)
        return (
            f"Current time: {ctx['current_time']}\n"
            f"Date: {ctx['current_date']}\n"
            f"Timezone: {ctx['timezone']}"
        )

context_agent = ContextAgent()