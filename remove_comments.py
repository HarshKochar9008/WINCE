
import re
import os
from pathlib import Path

def remove_python_comments(content):
    lines = content.split('\n')
    result = []
    in_multiline_string = False
    string_char = None

    for line in lines:
        new_line = ''
        i = 0
        in_string = False
        string_delim = None
        escape_next = False

        while i < len(line):
            char = line[i]

            if escape_next:
                new_line += char
                escape_next = False
                i += 1
                continue

            if char == '\\':
                escape_next = True
                new_line += char
                i += 1
                continue

            if not in_string:
                if char in ('"', "'"):
                    in_string = True
                    string_delim = char
                    new_line += char
                elif char == '#' and (i == 0 or line[i-1] not in ('"', "'")):
                    break
                else:
                    new_line += char
            else:
                if char == string_delim:
                    in_string = False
                    string_delim = None
                new_line += char

            i += 1

        stripped = new_line.rstrip()
        if stripped or not result or result[-1].strip():
            result.append(stripped)

    content = '\n'.join(result)

    content = re.sub(r'', '', content, flags=re.DOTALL)
    content = re.sub(r"", '', content, flags=re.DOTALL)

    return content

def remove_ts_js_comments(content):
    result = []
    i = 0
    in_string = False
    string_delim = None
    escape_next = False

    while i < len(content):
        char = content[i]

        if escape_next:
            result.append(char)
            escape_next = False
            i += 1
            continue

        if char == '\\':
            escape_next = True
            result.append(char)
            i += 1
            continue

        if not in_string:
            if char in ('"', "'", '`'):
                in_string = True
                string_delim = char
                result.append(char)
            elif i < len(content) - 1 and content[i:i+2] == '//':
                while i < len(content) and content[i] != '\n':
                    i += 1
                if i < len(content):
                    result.append('\n')
            elif i < len(content) - 1 and content[i:i+2] == '/*':
                i += 2
                while i < len(content) - 1:
                    if content[i:i+2] == '*/':
                        i += 2
                        break
                    i += 1
            else:
                result.append(char)
        else:
            if char == string_delim:
                in_string = False
                string_delim = None
            result.append(char)

        i += 1

    return ''.join(result)

def remove_css_comments(content):
    result = []
    i = 0

    while i < len(content):
        if i < len(content) - 1 and content[i:i+2] == '/*':
            i += 2
            while i < len(content) - 1:
                if content[i:i+2] == '*/':
                    i += 2
                    break
                i += 1
        else:
            result.append(content[i])
            i += 1

    return ''.join(result)

def remove_config_comments(content, comment_char='#'):
    lines = content.split('\n')
    result = []

    for line in lines:
        in_string = False
        string_delim = None
        escape_next = False
        new_line = ''
        i = 0

        while i < len(line):
            char = line[i]

            if escape_next:
                new_line += char
                escape_next = False
                i += 1
                continue

            if char == '\\':
                escape_next = True
                new_line += char
                i += 1
                continue

            if not in_string:
                if char in ('"', "'"):
                    in_string = True
                    string_delim = char
                    new_line += char
                elif char == comment_char:
                    break
                else:
                    new_line += char
            else:
                if char == string_delim:
                    in_string = False
                    string_delim = None
                new_line += char

            i += 1

        stripped = new_line.rstrip()
        if stripped or not result or result[-1].strip():
            result.append(stripped)

    return '\n'.join(result)

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        ext = file_path.suffix.lower()

        if ext == '.py':
            new_content = remove_python_comments(content)
        elif ext in ('.ts', '.tsx', '.js', '.jsx'):
            new_content = remove_ts_js_comments(content)
        elif ext == '.css':
            new_content = remove_css_comments(content)
        elif file_path.name in ('nginx.conf', 'Dockerfile', 'docker-entrypoint.sh') or ext in ('.yaml', '.yml', '.conf', '.sh'):
            new_content = remove_config_comments(content)
        else:
            return False

        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    base_dir = Path(__file__).parent
    
    extensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.css']
    config_files = ['nginx.conf', 'Dockerfile', 'docker-entrypoint.sh', '.yaml', '.yml', '.conf', '.sh']
    
    exclude_dirs = {'.venv', 'venv', 'env', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.next'}
    
    processed = 0
    for root, dirs, files in os.walk(base_dir):
        root_path = Path(root)
        if any(exclude_dir in root_path.parts for exclude_dir in exclude_dirs):
            dirs[:] = []
            continue

        for file in files:
            file_path = Path(root) / file
            if file_path.name == 'remove_comments.py':
                continue
            if any(file_path.suffix == ext for ext in extensions) or any(file in config_files or file_path.suffix in config_files for file in [file]):
                if process_file(file_path):
                    processed += 1
                    print(f"Processed: {file_path}")

    print(f"\nTotal files processed: {processed}")

if __name__ == '__main__':
    main()
