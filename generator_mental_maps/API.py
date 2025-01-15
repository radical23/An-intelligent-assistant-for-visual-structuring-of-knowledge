#python -m uvicorn new_mental_maps_generator:app --host 127.0.0.1 --port 8000
#uvicorn main:app --reload
#python mental_map.py

import requests

url = 'http://127.0.0.1:8000/mental_map_generate'

# Чтение данных из текстового файла
with open("C:/lab2_SAI/generator_mental_maps/text.txt", "r") as file:
    content = file.read()

# Отправка GET-запроса с данными
response = requests.get(url, json={"content": content})

# Выводим результат
print(response.json())
