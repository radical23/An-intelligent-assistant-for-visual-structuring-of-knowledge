import json
import re

def process_and_validate_json(answer, expected_length):
    try:
        print("Original JSON:", repr(answer))

        # Удаляем обрамляющие символы
        answer = answer[7:-3].strip()
        print("Trimmed JSON:", repr(answer))

        # Исправляем ошибки с двумя двоеточиями (вложенные объекты)
        sanitized = re.sub(r'(".*?"): "(.*?)": "(.*?)"', r'\1: {"\2": "\3"}', answer)
        print("Sanitized JSON:", repr(sanitized))

        # Парсим JSON
        parsed_json = json.loads(sanitized)
        print("Parsed JSON:", parsed_json)

        # Проверяем длину
        if len(parsed_json) == expected_length:
            print(f"JSON length matches the expected count ({expected_length})")
            return parsed_json
        else:
            print(f"JSON length does not match the expected count ({expected_length})")
            return None
    except json.JSONDecodeError as e:
        print("JSON Decode Error:", e)
        return None
    except Exception as ex:
        print("Unexpected Error:", ex)
        return None

# Ваш входной JSON
answer = '```json\n{\n  "1": "структуры",\n  "2": "природы",\n  "3": "ресурсов",\n  "4": "географических": "процессов",\n  "5": "биогеохимических": "процессов"\n}\n```'
expected_length = 5

result = process_and_validate_json(answer, expected_length)
if result:
    print("Valid JSON:", result)
else:
    print("Invalid JSON or length mismatch!")
