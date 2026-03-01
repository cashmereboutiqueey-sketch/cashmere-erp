import os
import re

def replace_hardcoded_urls(directory):
    pattern1 = re.compile(r"(['\"])http://localhost:8000(/.*?)?\1")
    pattern2 = re.compile(r"(['\"])http://127\.0\.0\.1:8000(/.*?)?\1")
    
    # Also handle the corrupted ones from the previous powershell script
    pattern3 = re.compile(r"`\$\\`\{process\.env\.NEXT_PUBLIC_API_URL \|\|\s+`\"http://localhost:8000`\"`\}(/.*?)?")
    
    replacement = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\2`"
    replacement_corrupted = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\1`"

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Replace standard hardcodings
                content = pattern1.sub(replacement, content)
                content = pattern2.sub(replacement, content)
                
                # Replace corrupted ones
                content = pattern3.sub(replacement_corrupted, content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated: {filepath}")

if __name__ == '__main__':
    replace_hardcoded_urls('./frontend/src')
