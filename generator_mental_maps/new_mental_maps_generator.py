import spacy
import re
from collections import Counter
from titlecase import titlecase
import pymorphy2
import json
import os
from transformers import pipeline
from graphviz import Digraph
from IPython.display import Image

nlp = spacy.load("ru_core_news_lg")

# модель Ани
os.environ['HF_TOKEN'] = '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'
generator = pipeline('text-generation', model='EleutherAI/gpt-neo-125M')

# модель ИИ
from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="IlyaGusev/saiga_llama3_8b_gguf",
	filename="model-q8_0.gguf",
  n_ctx=8192
)
#карта
def generate_graph(main_topic, related_words):
    input_text = f"{main_topic}:\n"
    for key, values in related_words.items():
        input_text += f" - {key} -> {', '.join(values)}\n"
    dot = Digraph(comment=main_topic)


    dot.attr(
        rankdir='LR',           # Направление слева направо
        size='20,20',           # Размер изображения
        bgcolor='black',        # Цвет фона
        fontcolor='white',      # Цвет шрифта
        nodesep='0.5',          # Расстояние между узлами
        ranksep='1.0',          # Расстояние между уровнями узлов
        concentrate='true'      # Концентрация стрелок для уменьшения пересечений
    )

    dot.attr('node', shape='rectangle', style='filled', fillcolor='black', fontcolor='white', fontname='Arial', fontsize='14', penwidth='1', color='white')

    dot.attr('edge', color='white', dir='forward', arrowhead='normal', arrowsize='1.5', style='solid', splines='false')

    dot.node('A', main_topic)

    for idx, (key, values) in enumerate(related_words.items()):
        dot.node(f'B{idx}', key)
        dot.edge('A', f'B{idx}')

        for v_idx, value in enumerate(values):
            dot.node(f'C{idx}{v_idx}', value)
            dot.edge(f'B{idx}', f'C{idx}{v_idx}')

    dot.render('1_graph', format='png', cleanup=True)
    return Image('1_graph.png')

#начальная форма слов
def is_noun(word):
    morph = pymorphy2.MorphAnalyzer()
    parsed_word = morph.parse(word)
    return any('NOUN' in p.tag for p in parsed_word)

def is_adjective(word):
    morph = pymorphy2.MorphAnalyzer()
    parsed_word = morph.parse(word)
    return any('ADJF' in p.tag for p in parsed_word)

def lemma_few(listL):
    morph = pymorphy2.MorphAnalyzer()
    adjective = listL[0]
    noun = listL[1]
    # Если передано два слова (прилагательное и существительное)
    if len(listL) == 2 and is_adjective(adjective) and is_noun(noun):
        adj_parsed = morph.parse(adjective)[0]
        noun_parsed = morph.parse(noun)[0]
        noun_gender = noun_parsed.tag.gender
        # Приводим прилагательное к нужной форме в зависимости от рода существительного
        if noun_gender == 'femn':
            agreed_adjective = str(adj_parsed.inflect({'femn'})[0])  # Женский род
            if agreed_adjective[-2:] != "ая":
                agreed_adjective = agreed_adjective[:-2] + "ая"
        elif noun_gender == 'masc':
            agreed_adjective = str(adj_parsed.inflect({'masc'})[0])  # Мужской род
            if agreed_adjective[-2:] != "ый":
                agreed_adjective = agreed_adjective[:-3] + "ый"
        else:
            agreed_adjective = str(adj_parsed.inflect({'neut'})[0])  # Средний род

        return str(agreed_adjective + " " + noun_parsed.normal_form)
    # Если передано два существительных
    elif len(listL) == 2 and is_noun(adjective) or is_noun(noun):
        noun1_parsed = morph.parse(adjective)[0]
        noun2_parsed = morph.parse(noun)[0]
        return f"{noun1_parsed.normal_form} {noun}"
    return ""

def initial_form(listing):
    if listing is None: return None
    listing_theme_description_3 = []
    for item in listing:
        listing_theme_description_2 = [
            lemma_few(items.split()) if len(items.split()) > 1 else find_lemma([items])[0]
            for items in item
        ]
        listing_theme_description_3.append(listing_theme_description_2)
    return listing_theme_description_3

#главная тема текста
def morpho(doc, doc_list, list_all):
    for token in doc:
        if (token.is_alpha and token.tag_
            not in {"VERB", "PART", "PRON", "ADJ", "ADV"}
            and token.text not in doc_list):
            key = token.text
            value = token.morph
            if key in morphology_information:
                morphology_information[key].append(value)
            else:
                morphology_information[key] = [value]
    list_all.extend(item for item in morphology_information
                    if morphology_information[item][0])
    return list_all


def find_lemma(list_for_find):
    if isinstance(list_for_find, str):
        list_for_find = [list_for_find]
    return [token.lemma_ for doc in list_for_find if doc for token in nlp(doc)]



def count_lemma(list_for_count):
    top = Counter(list_for_count).most_common(5)
    list_end.extend(word for word, _ in top)


#дополнение перечислений
def find_connections_and_dependencies(text, target_noun):
    doc = nlp(text)
    target_noun_lower = target_noun.lower()

    for token in doc:
        if token.pos_ == 'NOUN' and token.text.lower() == target_noun_lower:
            my_dict = {child.dep_: child.text for child in token.children}
            return my_dict.get("nmod") or my_dict.get("appos") or my_dict.get("amod")

def listings(listing,text):
    print("\n\n\n")
    print("listing: ", listing)
    listing_description = []
    for item in listing:
        pats_new = []
        print("item: ", item)
        for parts in item:
            target_noun = parts
            connection = find_connections_and_dependencies(text, target_noun)
            print("target_noun: ", target_noun, "connection: ", connection)
            formatted_part = titlecase(parts) if parts not in text else parts
            if connection:
                if text.index(formatted_part) > text.index(connection):
                    pats_new.append(f"{connection} {target_noun}")
                else:
                    pats_new.append(f"{target_noun} {connection}")
            else:
                pats_new.append(target_noun)
        listing_description.append(pats_new)
    print("return to: ",listing_description, "\n\n\n")
    return listing_description


def check_list(listing):
  no_duplicates = []
  for i in range (len(listing)):
    count = 0
    for j in range (len(listing)):
      if (listing[i] or listing[i].upper() or listing[i].lower() or titlecase(listing[i])) not in listing[j] or listing[i]==listing[j]:
        count +=1
    if count == len(listing):
      no_duplicates.append(listing[i])
  return no_duplicates

#получение перечислений из текста
def find_connection(text):
  doc = nlp(text)
  listing = []

  for token in doc:
      new = []
      if token.pos_!="VERB":
        for child in token.children:
            if child.dep_ == "conj":
                if not str(token) in new: new.append(str(token))
                new.append(str(child.text))
                if not new in listing: listing += [new]
  if listing:
    print("Найденные перечисления: \n",*listing)
    return listing
  return None

#json
def json_loads(answer):
  print("in json_loads: ", answer)
  #answer = json.loads(answer)
  answer_f = []
  for item in answer:
      answer_f.append(answer[item])
  print("in json_loads answer_f: ", answer_f)
  return answer_f

#Функции для запроса модели

#контекст к модели
def context_model(text, additional_info):
  context = {
    "text": text,
    "additional_info": additional_info,
  }
  return context

#для обработка запроса модели на неправильный вывод
def query_model_error(answer, count):
    if len(answer)==0: return None
    answer = answer[7:-3]
    print("answer query_model_error: ", answer)
    try:
      #answer = str(answer)
      #if "'" in answer:
      #  answer = answer.replace("'", '"')
      result = json.loads(answer)
      print("result query_model_error: ", result)
      print("count query_model_error: ", count)
      if len(result)==count:
        return result
    except json.JSONDecodeError as e:
      print("Ошибка декодирования JSON:", e)
      return None


#для выполнения запроса к модели
def query_model(prompt, count):
    prompt1 = prompt
    count1 = count
    response = llm.create_chat_completion(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    print(count1)
    if count1>0:
      answer_query_model = query_model_error(response["choices"][0]["message"]["content"], count1)
      print("answer_query_model: ", answer_query_model)
      if answer_query_model is None:
        print("again")
        answer_query_model = query_model(prompt1, count1)
      else:
        print("not again")
        print("return not again answer_query_model: ", answer_query_model)
        return answer_query_model
    else: return response["choices"][0]["message"]["content"]


#генерирование текста ментальной карты
def mental_map_text(text, morphology_information, list_all, doc_list, list_end, kolvo, rel, ll, listing_theme_description, listing_else_description, listing_main_words, listing_else_words):

  #нахождение галавной темы текста
  doc = nlp(text)
  for ent in doc.ents:
    doc_list.append(ent.text)
  list_all = morpho(doc, doc_list, list_all)
  list_all = find_lemma(list_all)
  doc_list = [titlecase(word) for word in find_lemma(doc_list)]
  count_lemma(list_all)
  count_lemma(doc_list)
  print("list_end_1: ", list_end)
  list_end = check_list(listings([list_end], text)[0])
  print("list_end_2: ", list_end)

  # запрос модели для выбора главной темы текста
  #context = context_model(text, f"Ответ должен быть в формате json под ключом main_theme")
  #query = f"Выбери главную тему текста из предложенного списка. Ответ выбери из списка. Список: {list_end}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
  #answer_main_theme = query_model(query, 1)

  #получение ответа от модели в список для главной темы
  #answer_main_theme = str(answer_main_theme)
  #if "'" in answer_main_theme:
  #  answer_main_theme = answer_main_theme.replace("'", '"')
  #answer_main_theme = json.loads(answer_main_theme)["main_theme"]
  #if len(answer_main_theme[0].split(" "))>=2:
  #  answer_main_theme = answer_main_theme.split(" ")[:2]
  #  answer_main_theme = titlecase(answer_main_theme[0])+" "+answer_main_theme[1]
  #else:
  #  answer_main_theme = titlecase(answer_main_theme)
  #answer_main_theme = "Взаимодействие"

  #нахождение перечислений или переделка текста
  #listing = find_connection(text)
  #if listing is None:
    # запрос модели для переделывания текста
    #query = f"Перепиши текст так, чтобы в нем были перечисления. Текст: {text}"
    #text = query_model(query,0)

  #для запроса модели для перечислений
  print("ПЕРЕЧИСЛЕНИЯ")
  #str_zapros = ""
  #for item in listing:
  #  str_zapros += "Перечисление, для которого нужно подобрать определяемое слово: " + str(item) + ". "
  #запрос модели для перечислений
  #context = context_model(text, f"Вывод сделай в формате json. Ключей должно быть {len(listing)}, вид - нумерованный список. Значений должно быть {len(listing)}.")
  #query = f"Определяемое слово это существительное, от которого зависит задаваемое перечисление. Само определяемое слово не является словом из перечисления. Подбери такое определяемое слово. {str_zapros}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
  #answer_few = query_model(query,len(listing))
  #print("answer_few: ", answer_few)
  #получение ответа от модели в список
  #answer_few = json_loads(answer_few)
  #answer_few = ["Земля", "процессы", "услуги", "исследования"]

  #формирование списков перечислений, связанных с главным словом и нет
  #listing_theme = [listing[i] for i in range(len(answer_few)) if answer_few[i].lower() in answer_main_theme.lower()]
  #listing_else = [listing[i] for i in range(len(answer_few)) if answer_few[i].lower() not in answer_main_theme.lower()]
  #listing_else_words = [answer_few[i] for i in range(len(answer_few)) if answer_few[i].lower() not in answer_main_theme.lower()]

  #print("listing_theme", listing_theme)
  #print("listing_else", listing_else)
  #print("listing_else_words", listing_else_words)

  #дополнение полученных списков
  #listing_theme_description = listings(listing_theme, text)
  #listing_else_description = listings(listing_else, text)
  #print("listing_theme_description", listing_theme_description)
  #print("listing_else_description",listing_else_description)

  #для запроса модели если список слов, связаных с главной темой, не пустой
  #print("ДЛЯ ГЛАВНОЙ ТЕМЫ")
  #if (listing_theme_description):
  #  str_zapros = ""
  #  count = 0
  #  for item in listing_theme_description:
  #    count +=1
  #    str_zapros += "Перечисление для которого нужно подобрать обобщающее слово: " + str(item) + ". "
    #запрос модели если список слов, связаных с главной темой, не пустой
  #  context = context_model(text, f"Вывод сделай



  #  query = f"Обощающее слово - слово, которое обощает задаваемое перечисление. {str_zapros}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
  #  answer_few_main = query_model(query, count)
  #  print("answer_few_main: ", answer_few_main)
    #получение ответа от модели в список
  #  listing_main_words = json_loads(answer_few_main)
  #listing_main_words = [""]

  #запрос модели для перечислений непосредственно не связаны с главным словом
  #print("НЕ ДЛЯ ГЛАВНОЙ ТЕМЫ")
  #if (listing_else_words):
    #запрос модели для перечислений непосредственно не связаны с главным словом
   # context = context_model(text, f"Вывод сделай в формате json в виде ответов да/нет. Ключей и значений должно быть {len(listing_else_words)}")
   # query = f"Связаны ли слова {listing_else_words} с термином {answer_main_theme} в тексте?. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
   # answer_2 = query_model(query, len(listing_else_words))
    #получение ответа от модели в список
   # listing_answers = json_loads(answer_2)
   # for i in range(len(listing_answers)):
    #  if listing_answers[i]=='нет':
    #    listing_else_words.pop(i)
  #listing_else_words = ["да", "да", "да", "да"]

  #работа с начальными формами
  #listing_theme_description = initial_form(listing_theme_description)
  #listing_else_description = initial_form(listing_else_description)
  #listing_main_words = initial_form([listing_main_words])[0]
  #listing_else_words = initial_form([listing_else_words])[0]

  #print(listing_theme_description, " and ", listing_main_words)
  #print(listing_else_description, " and ",listing_else_words)

  #формирование итогового списка
  #if listing_theme_description and listing_main_words:
  #  for i in range(len(listing_main_words)):
  #    rel[titlecase(listing_main_words[i])] = listing_theme_description[i]
  #print("rel: ", rel)
  #if listing_else_description and listing_else_words:
  #  for i in range(len(listing_else_words)):
  #    rel[titlecase(listing_else_words[i])] = listing_else_description[i]
  #print("rel: ", rel)
  answer_main_theme = "Планета Земля"
  rel = {'Экосистема': ['геологическая структура', 'живая природа', 'природный ресурс'], 'Процесс': ['географический', 'биогеохимический'], 'Услуга': ['регулирование климата', 'обеспечение ресурсами', 'предоставление услуг'], 'Исследование': ['жизнь', 'научного исследование']}

  return answer_main_theme, rel

def mental_map_map(main_topic, rel):
  #карта
  main_topic = main_topic
  related_words = rel
  image = generate_graph(main_topic, related_words)


from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import asyncio
import uuid
from datetime import datetime, timedelta
import os
import logging
import sys
import traceback


path_way_all = "C:/lab2_SAI/generator_mental_maps/"

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('debug.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(debug=True)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


main_topic_res = ""
rel_res = {}
text = ""
#входные данные
morphology_information = {}
listing_main_words = []
list_all = []
doc_list = []
list_end = []
kolvo = []
rel = {}
ll = []
listing_theme_description = []
listing_else_description = []
listing_main_words = []
listing_else_words= []

class TextInput(BaseModel):
    content: str

class TaskStatus(BaseModel):
    status: str
    message: str = ""
    started_at: datetime
    file_ready: bool = False

# Глобальные переменные
task_queue = asyncio.Queue(maxsize=100)
task_statuses = {}

# Middleware для логирования всех запросов
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.debug(f"Request headers: {request.headers}")
    
    try:
        response = await call_next(request)
        logger.info(f"Response status code: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise

async def process_queue():
    while True:
        try:
            task = await task_queue.get()
            task_id = task['id']
            logger.info(f"Processing task {task_id}")
            
            try:
                await handle_task(task)
                logger.info(f"Task {task_id} completed successfully")
            except Exception as e:
                logger.error(f"Task {task_id} failed: {str(e)}")
                logger.error(traceback.format_exc())
                task_statuses[task_id].status = 'error'
                task_statuses[task_id].message = str(e)
            finally:
                task_queue.task_done()
        except Exception as e:
            logger.error(f"Critical error in process_queue: {str(e)}")
            logger.error(traceback.format_exc())
            await asyncio.sleep(1)

async def handle_task(task: dict):
    task_id = task['id']
    input_content = task['input']
    
    try:
        logger.info(f"Starting text processing for task {task_id}")
        task_statuses[task_id].status = 'processing'
        task_statuses[task_id].message = 'Обработка текста...'

        # Генерация текста карты
        main_topic_res, rel_res = mental_map_text(
            input_content,
            morphology_information,
            list_all,
            doc_list,
            list_end,
            kolvo,
            rel,
            ll,
            listing_theme_description,
            listing_else_description,
            listing_main_words,
            listing_else_words
        )

        logger.info(f"Text processing completed for task {task_id}")
        task_statuses[task_id].message = 'Генерация изображения...'

        # Генерация изображения
        image_path = os.path.join(path_way_all, "1_graph.png")
        mental_map_map(main_topic_res, rel_res)

        # Проверка файла
        if os.path.exists(image_path):
            file_size = os.path.getsize(image_path)
            logger.info(f"Image generated successfully: {image_path}, size: {file_size} bytes")
            task_statuses[task_id].file_ready = True
        else:
            logger.error(f"Image file not found at: {image_path}")
            raise Exception("Файл изображения не был создан")

        task_statuses[task_id].status = 'completed'
        task_statuses[task_id].message = 'Карта готова'

    except Exception as e:
        logger.error(f"Error in handle_task: {str(e)}")
        logger.error(traceback.format_exc())
        raise "/mental_map_generate"
async def mental_map(input: TextInput):
    logger.info("Received generate request")
    logger.debug(f"Input content length: {len(input.content)}")

    try:
        if task_queue.full():
            logger.warning("Task queue is full")
            raise HTTPException(status_code=503, detail="Сервер перегружен")

        task_id = str(uuid.uuid4())
        logger.info(f"Created task with ID: {task_id}")

        task_statuses[task_id] = TaskStatus(
            status='queued',
            message='В очереди',
            started_at=datetime.now()
        )

        await task_queue.put({
            'id': task_id,
            'input': input.content
        })

        return JSONResponse({
            "message": "Задача добавлена в очередь",
            "task_id": task_id
        })

    except Exception as e:
        logger.error(f"Error in mental_map: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mental_map_status/{task_id}")
async def get_task_status(task_id: str):
    logger.info(f"Status request for task {task_id}")

    try:
        if task_id not in task_statuses:
            logger.warning(f"Task {task_id} not found")
            raise HTTPException(status_code=404, detail="Задача не найдена")

        status = task_statuses[task_id]
        logger.info(f"Task {task_id} status: {status.status}")
        return status

    except Exception as e:
        logger.error(f"Error in get_task_status: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@app.get("/mental_map_get/{image_name}")
async def get_image(image_name: str):
    logger.info(f"Image request for {image_name}")

    try:
        # Проверка безопасности пути
        if '..' in image_name or '/' in image_name:
            logger.warning(f"Invalid filename requested: {image_name}")
            raise HTTPException(status_code=400, detail="Некорректное имя файла")

        image_path = os.path.join(path_way_all, image_name)
        logger.debug(f"Full image path: {image_path}")

        # Проверка существования директории
        if not os.path.exists(path_way_all):
            logger.error(f"Directory not found: {path_way_all}")
            raise HTTPException(status_code=500, detail="Директория не существует")

        # Проверка существования файла
        if not os.path.exists(image_path):
            logger.warning(f"Image not found: {image_path}")
            raise HTTPException(status_code=404, detail="Изображение не найдено")

        # Проверка прав доступа
        if not os.access(image_path, os.R_OK):
            logger.error(f"No read permission for file: {image_path}")
            raise HTTPException(status_code=500, detail="Нет прав на чтение файла")

        # Проверка размера файла
        file_size = os.path.getsize(image_path)
        logger.info(f"Sending file: {image_path}, size: {file_size} bytes")

        return FileResponse(
            image_path,
            media_type="image/png",
            filename=image_name,
            headers={
                "Content-Disposition": f"inline; filename={image_name}",
                "Content-Length": str(file_size)
            }
        )

    except Exception as e:
        logger.error(f"Error in get_image: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")
    asyncio.create_task(process_queue())
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

