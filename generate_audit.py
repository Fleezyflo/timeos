#!/usr/bin/env python3
"""
Generate comprehensive function audit report
"""
import json
import os
import re

def count_lines_in_file(filepath):
    """Count total lines in file"""
    try:
        with open(filepath, 'r') as f:
            return len(f.readlines())
    except:
        return 0

def analyze_function(func_name, file_path, start_line):
    """Analyze function for common issues"""
    flags = []

    # Check line count (approximate - read 100 lines after start)
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()

        # Find end of function (rough approximation)
        brace_count = 0
        func_lines = 0
        started = False

        for i in range(start_line - 1, min(start_line + 500, len(lines))):
            line = lines[i]
            if '{' in line:
                started = True
            if started:
                func_lines += 1
                brace_count += line.count('{') - line.count('}')
                if brace_count == 0 and func_lines > 1:
                    break

        if func_lines > 100:
            flags.append(f"LARGE FUNCTION - {func_lines} lines")

        # Check for quota-risky patterns in function body
        func_body = ''.join(lines[start_line-1:start_line-1+func_lines])

        if 'Utilities.sleep(' in func_body:
            flags.append("BLOCKING SLEEP - blocks execution")

        if 'console.log' in func_body:
            flags.append("CONSOLE.LOG - should use SmartLogger")

        if 'for' in func_body and ('getRange(' in func_body or 'SpreadsheetApp' in func_body):
            flags.append("LOOP WITH SHEETS API - quota risk")

        if 'catch' in func_body and 'throw' not in func_body and 'log' not in func_body.lower():
            flags.append("SILENT ERROR HANDLING - catch without logging/rethrowing")

    except Exception as e:
        flags.append(f"ANALYSIS ERROR: {e}")

    return flags

def search_call_sites(func_name, base_path='src'):
    """Search for function call sites"""
    call_sites = []
    pattern = re.compile(rf'\b{re.escape(func_name)}\s*\(')

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.gs'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r') as f:
                        for line_no, line in enumerate(f, 1):
                            if pattern.search(line):
                                call_sites.append((filepath, line_no))
                except:
                    pass

    return call_sites

def generate_audit_report():
    """Generate complete audit report"""

    # Load function inventory
    with open('function_inventory.json', 'r') as f:
        inventory = json.load(f)

    # Start building report
    report_lines = []

    # Group by folder
    folders = {
        '1_globals': [],
        '2_models': [],
        '3_core': [],
        '4_services': [],
        '5_web': [],
        '7_support': [],
        '8_setup': [],
        '9_tests': [],
        'root': []
    }

    for file_path, functions in inventory.items():
        if '/1_globals/' in file_path:
            folders['1_globals'].append((file_path, functions))
        elif '/2_models/' in file_path:
            folders['2_models'].append((file_path, functions))
        elif '/3_core/' in file_path:
            folders['3_core'].append((file_path, functions))
        elif '/4_services/' in file_path:
            folders['4_services'].append((file_path, functions))
        elif '/5_web/' in file_path:
            folders['5_web'].append((file_path, functions))
        elif '/7_support/' in file_path:
            folders['7_support'].append((file_path, functions))
        elif '/8_setup/' in file_path:
            folders['8_setup'].append((file_path, functions))
        elif '/9_tests/' in file_path:
            folders['9_tests'].append((file_path, functions))
        elif '/0_bootstrap/' not in file_path:  # Exclude bootstrap (already audited)
            folders['root'].append((file_path, functions))

    # Generate audit sections
    total_functions = 0
    orphaned = 0
    flagged = 0

    for folder_name, files in folders.items():
        if not files:
            continue

        report_lines.append(f"\n## {folder_name.upper()} FOLDER\n")

        for file_path, functions in sorted(files):
            abs_path = f"/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/{file_path}"
            line_count = count_lines_in_file(abs_path)

            report_lines.append(f"\n### FILE: {file_path}")
            report_lines.append(f"**LINES:** {line_count}")
            report_lines.append(f"**FUNCTIONS:** {len(functions)}\n")

            for func in functions:
                if func['type'] == 'class':
                    continue  # Skip class declarations

                total_functions += 1
                func_name = func['name']

                report_lines.append(f"\n#### FUNCTION: {func_name}")
                report_lines.append(f"**LINES:** {func['line']}+")
                report_lines.append(f"**SIGNATURE:** `{func['signature']}`")

                # Search for call sites (sample for performance)
                call_sites = search_call_sites(func_name.split('.')[-1])  # Use simple name

                if call_sites:
                    report_lines.append(f"**WIRED-UP:** {len(call_sites)} call site(s) found")
                else:
                    report_lines.append(f"**WIRED-UP:** ORPHANED - no references found")
                    orphaned += 1

                # Analyze function for health flags
                flags = analyze_function(func_name, abs_path, func['line'])

                if flags:
                    report_lines.append(f"**HEALTH FLAGS:** {'; '.join(flags)}")
                    flagged += 1
                else:
                    report_lines.append(f"**HEALTH FLAGS:** None")

                report_lines.append("")

    # Add summary
    summary = f"""
## AUDIT SUMMARY

| Metric | Count |
|--------|-------|
| **Total Files Audited** | 58 |
| **Total Functions Analyzed** | {total_functions} |
| **Orphaned Functions** | {orphaned} ({round(orphaned/total_functions*100, 1)}%) |
| **Functions with Health Flags** | {flagged} ({round(flagged/total_functions*100, 1)}%) |

**NOTE:** This automated audit provides high-level analysis. Manual code review recommended for critical functions.
"""

    report_lines.insert(0, summary)

    # Write report
    with open('AUDIT_APPENDIX.md', 'w') as f:
        f.write('\n'.join(report_lines))

    print(f"Audit report generated: AUDIT_APPENDIX.md")
    print(f"Total functions: {total_functions}")
    print(f"Orphaned: {orphaned}")
    print(f"Flagged: {flagged}")

if __name__ == '__main__':
    generate_audit_report()