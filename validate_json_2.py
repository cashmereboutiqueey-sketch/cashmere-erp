
import json
import sys

def check_json(path):
    print(f"Checking {path}...")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            json.loads(content)
        print(f"SUCCESS: {path} is valid JSON.")
    except json.JSONDecodeError as e:
        print(f"ERROR: {path} is invalid.")
        print(f"Message: {e.msg}")
        print(f"Line: {e.lineno}, Column: {e.colno}")

check_json(r"c:/Users/abdel/OneDrive/Desktop/CASHMERE-ERP/frontend/src/locales/ar.json")
check_json(r"c:/Users/abdel/OneDrive/Desktop/CASHMERE-ERP/frontend/src/locales/en.json")
