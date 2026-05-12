import csv
import json
import os
import uuid
from datetime import datetime

csv_path = 'sample_tasks.csv'
json_path = 'data/tasks.json'

tasks = []
if os.path.exists(csv_path):
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            task = {
                "id": str(uuid.uuid4()),
                "createdAt": datetime.now().isoformat(),
                "completed": False,
                "userId": "owner",
                "title": row.get('Title', 'Untitled'),
                "room": row.get('Room', 'General'),
                "category": row.get('Category', 'other').lower(),
                "priority": row.get('Priority', 'medium').lower(),
                "price": float(row.get('Price', 0)),
                "difficulty": int(row.get('Difficulty', 1)),
                "time": float(row.get('Time', 1)),
                "repeat": row.get('Repeat', 'false').lower() == 'true'
            }
            tasks.append(task)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(tasks, f, indent=2)

print(f"Imported {len(tasks)} tasks from CSV to JSON.")
