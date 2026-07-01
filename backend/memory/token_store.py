import json
import os
from threading import Lock

TOKENS_PATH = os.path.join(os.path.dirname(__file__), "..", "user_tokens.json")
_lock = Lock()


def _read_all() -> dict:
    if not os.path.exists(TOKENS_PATH):
        return {}
    with open(TOKENS_PATH, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _write_all(data: dict) -> None:
    with open(TOKENS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def save_provider_token(user_id: str, provider: str, token_data: dict) -> None:
    with _lock:
        all_tokens = _read_all()
        all_tokens.setdefault(user_id, {})
        all_tokens[user_id][provider] = token_data
        _write_all(all_tokens)


def get_provider_token(user_id: str, provider: str) -> dict | None:
    all_tokens = _read_all()
    return all_tokens.get(user_id, {}).get(provider)


def delete_provider_token(user_id: str, provider: str) -> None:
    with _lock:
        all_tokens = _read_all()
        if user_id in all_tokens and provider in all_tokens[user_id]:
            del all_tokens[user_id][provider]
            _write_all(all_tokens)