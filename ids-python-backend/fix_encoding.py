import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    # Replace any non-ASCII in print() or comment lines with safe alternatives
    new_line = ''
    for ch in line:
        if ord(ch) > 127:
            new_line += ''  # Just strip non-ASCII chars
        else:
            new_line += ch
    clean_lines.append(new_line)

with open('main.py', 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)

print('Stripped all non-ASCII characters')
