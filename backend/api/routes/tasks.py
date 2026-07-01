from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import uuid, time
from core.gemini_client import gemini

router = APIRouter()

tasks_db = {}

class TaskUpdate(BaseModel):
    done: Optional[bool] = None
    text: Optional[str] = None

class VoiceTaskRequest(BaseModel):
    user_id: str
    transcript: str

EXTRACT_TASKS_PROMPT = '''
Extract actionable tasks from this voice note. Return ONLY a JSON array of strings, each being one clear task.
If there are no tasks, return [].

Voice note: {transcript}

Example output: ["Buy milk", "Call John tomorrow", "Finish report by Friday"]
'''

@router.get('/')
async def get_tasks(user_id: str):
    user_tasks = [t for t in tasks_db.values() if t['user_id'] == user_id]
    user_tasks.sort(key=lambda x: x['created_at'], reverse=True)
    return {'tasks': user_tasks}

@router.post('/from-voice')
async def create_from_voice(req: VoiceTaskRequest):
    prompt = EXTRACT_TASKS_PROMPT.format(transcript=req.transcript)
    result = await gemini.chat(prompt)

    import json, re
    try:
        match = re.search(r'\[.*\]', result, re.DOTALL)
        task_texts = json.loads(match.group()) if match else []
    except Exception:
        task_texts = []

    new_tasks = []
    for text in task_texts:
        task_id = str(uuid.uuid4())
        task = {
            'id': task_id,
            'user_id': req.user_id,
            'text': text,
            'done': False,
            'source': 'voice',
            'created_at': time.time(),
        }
        tasks_db[task_id] = task
        new_tasks.append(task)

    return {'tasks': new_tasks}

@router.post('/')
async def create_task(req: dict):
    task_id = str(uuid.uuid4())
    task = {
        'id': task_id,
        'user_id': req.get('user_id', 'guest'),
        'text': req.get('text', ''),
        'done': False,
        'source': req.get('source', 'manual'),
        'created_at': time.time(),
    }
    tasks_db[task_id] = task
    return task

@router.patch('/{task_id}')
async def update_task(task_id: str, update: TaskUpdate, user_id: str):
    task = tasks_db.get(task_id)
    if not task:
        return {'error': 'Task not found'}
    if update.done is not None:
        task['done'] = update.done
    if update.text is not None:
        task['text'] = update.text
    return task

@router.delete('/{task_id}')
async def delete_task(task_id: str, user_id: str):
    if task_id in tasks_db:
        del tasks_db[task_id]
    return {'status': 'deleted'}
