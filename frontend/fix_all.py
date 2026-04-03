import os
import re

# Match ANY URL formation starting with weird tick quotes and containing NEXT_PUBLIC_API_URL
# It looks for:  (fetch(|:|let url = |const url = ... )  then any combo of `, ', " then ${process...}
# then any combo of `, ', " then api/... then any combo of `, ', " (with or without comma, semicolon, bracket)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Variant 1: double backticks at the beginning, like: ``${...}/`api/path/`; or ``${...}/`api/path/`, {
    # It starts with ``${process...}/`
    # and ends with a string of path, and some trailing backtick or quote.
    # Wait, the closing backtick for the path is ALREADY THERE! 
    # Let url = ``${...}/`api/path`;  -> notice `api/path`
    # So replacing ``${...}/` with `${...}/ is PERFECT.
    content = content.replace(
        "``${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`",
        "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/"
    )

    # Variant 2: single quote backtick at the very start of a string:
    # '`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`api/path/';
    # We replace '`${...}/` with `${...}/ AND we must drop the trailing single quote that matches it!
    # A simple regex for this variant:
    pattern2 = re.compile(r"'`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'\}/`(.*?)'")
    content = pattern2.sub(r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/\1`", content)

    # If it was modified, rewrite
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

def main():
    frontend_dir = r"C:\Users\abdel\OneDrive\Desktop\CASHMERE-ERP\frontend\src"
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
