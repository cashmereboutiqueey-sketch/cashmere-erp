import os
import re

pattern = re.compile(r"fetch\('`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'\}/`(.*?)'\s*(,|\))")

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We replace: fetch('`${...}/`some/path') 
    # With: fetch(`${...}/some/path`)
    
    # The regex captures the path in group 1, and the trailing comma or parenthesis in group 2
    new_content, count = pattern.subn(r"fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/\1`\2", content)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {count} instances in {filepath}")

def main():
    frontend_dir = r"C:\Users\abdel\OneDrive\Desktop\CASHMERE-ERP\frontend\src"
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
