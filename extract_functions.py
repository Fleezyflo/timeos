#!/usr/bin/env python3
"""
Extract function signatures from GAS files for audit
"""
import re
import os
import json

def extract_functions_from_file(filepath):
    """Extract all function/method signatures from a GAS file"""
    functions = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        in_class = None
        for i, line in enumerate(lines, 1):
            # Class declaration
            class_match = re.match(r'^class\s+(\w+)', line)
            if class_match:
                in_class = class_match.group(1)
                functions.append({
                    'type': 'class',
                    'name': in_class,
                    'line': i,
                    'signature': line.strip()
                })
                continue

            # Constructor
            if '  constructor(' in line:
                functions.append({
                    'type': 'constructor',
                    'name': f'{in_class}.constructor' if in_class else 'constructor',
                    'line': i,
                    'signature': line.strip()
                })
                continue

            # Static method
            static_match = re.match(r'  static\s+(\w+)\s*\(', line)
            if static_match:
                functions.append({
                    'type': 'static_method',
                    'name': f'{in_class}.{static_match.group(1)}' if in_class else static_match.group(1),
                    'line': i,
                    'signature': line.strip()
                })
                continue

            # Instance method
            method_match = re.match(r'  (\w+)\s*\([^)]*\)\s*\{', line)
            if method_match and in_class:
                functions.append({
                    'type': 'method',
                    'name': f'{in_class}.{method_match.group(1)}',
                    'line': i,
                    'signature': line.strip()
                })
                continue

            # Global function
            func_match = re.match(r'^function\s+(\w+)\s*\(', line)
            if func_match:
                functions.append({
                    'type': 'function',
                    'name': func_match.group(1),
                    'line': i,
                    'signature': line.strip()
                })

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

    return functions

def main():
    base_path = 'src'
    all_functions = {}

    # Walk through all .gs files
    for root, dirs, files in os.walk(base_path):
        for file in sorted(files):
            if file.endswith('.gs'):
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath)
                functions = extract_functions_from_file(filepath)
                if functions:
                    all_functions[rel_path] = functions

    # Output as JSON
    with open('function_inventory.json', 'w') as f:
        json.dump(all_functions, f, indent=2)

    # Also output summary
    total = sum(len(funcs) for funcs in all_functions.values())
    print(f"Total functions extracted: {total}")
    print(f"Files processed: {len(all_functions)}")
    print(f"Output written to: function_inventory.json")

if __name__ == '__main__':
    main()