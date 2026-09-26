import os
import re

directories = ['src', 'public', 'ml_engine', 'index.html']
for directory in directories:
    if os.path.isfile(directory):
        paths_to_check = [directory]
    else:
        paths_to_check = [os.path.join(root, f) for root, _, files in os.walk(directory) for f in files]

    for filepath in paths_to_check:
        if filepath.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json', '.css', '.html')):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace('PAIMANA', 'DRISHTI').replace('Paimana', 'Drishti').replace('paimana', 'drishti')
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
