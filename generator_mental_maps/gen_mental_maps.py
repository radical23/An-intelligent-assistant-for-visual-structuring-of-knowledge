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
from llama_cpp import Llama

nlp = spacy.load("ru_core_news_lg")

#модель Ани
os.environ['HF_TOKEN'] = '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'
generator = pipeline('text-generation', model='EleutherAI/gpt-neo-125M')

# Загружаем модель
try:
    llm = Llama.from_pretrained(
    repo_id="IlyaGusev/saiga_llama3_8b_gguf",  # Репозиторий на Hugging Face
    filename="model-q8_0.gguf"  # Локальный файл модели
    )
    print("Модель успешно загружена!")
except Exception as e:
    print(f"Ошибка при работе с моделью: {e}")
finally:
    # Явное закрытие модели
    if 'llm' in locals():
        llm.close()    
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

def listings(listing):
    listing_description = []
    for item in listing:
        pats_new = []
        for parts in item:
            target_noun = parts
            connection = find_connections_and_dependencies(text, target_noun)
            formatted_part = titlecase(parts) if parts not in text else parts
            if connection:
                if text.index(formatted_part) > text.index(connection):
                    pats_new.append(f"{connection} {target_noun}")
                else:
                    pats_new.append(f"{target_noun} {connection}")
            else:
                pats_new.append(target_noun)
        listing_description.append(pats_new)
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
  answer = json.loads(answer)
  answer_f = []
  for item in answer:
      answer_f.append(answer[item])
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
    leng = 0
    answer = answer[7:-3]
    if json.loads(answer):
      if len(json.loads(answer))==count:
          return answer
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
    if count1>0:
      answer_query_model = query_model_error(response["choices"][0]["message"]["content"], count1)
      print(answer_query_model)
      if answer_query_model is None:
        print("again")
        query_model(prompt1, count1)
      else:
        print("not again")
        return answer_query_model
    return response["choices"][0]["message"]["content"]

#текст
with open('C:/lab2_SAI/generator_mental_maps/text.txt', 'rb') as file:
    text = file.read()

#входные данные
morphology_information = {}
listing_main_words = []
list_all = []
doc_list = []
list_end = []
kolvo = []
rel = {}
ll = []

#нахождение галавной темы текста
doc = nlp(text)
for ent in doc.ents:
  doc_list.append(ent.text)
list_all = morpho(doc, doc_list, list_all)
list_all = find_lemma(list_all)
doc_list = [titlecase(word) for word in find_lemma(doc_list)]
count_lemma(list_all)
count_lemma(doc_list)
print("Общий список:")
print(list_end)
print("\nОбщий список - дополненное:")
#list_end = check_list(listings([list_end])[0])
print(list_end)

# запрос модели для выбора главной темы текста
context = context_model(text, f"Ответ должен быть в формате json под ключом main_theme")
query = f"Выбери главную тему текста из предложенного списка. Ответ выбери из списка. Список: {list_end}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
answer_main_theme = query_model(query, 1)
print("Ответ по главному слову:\n", answer_main_theme)

#получение ответа от модели в список для главной темы
answer_main_theme = json.loads(answer_main_theme)["main_theme"]
print(len(answer_main_theme[0].split(" ")))
if len(answer_main_theme[0].split(" "))>=2:
  answer_main_theme = answer_main_theme.split(" ")[:2]
  answer_main_theme = titlecase(answer_main_theme[0])+" "+answer_main_theme[1]
else:
  answer_main_theme = answer_main_theme
print(answer_main_theme)

#нахождение перечислений/переделка текста
listing = find_connection(text)
if listing is None:
  # запрос модели для переделывания текста
  query = f"Перепиши текст так, чтобы в нем были перечисления. Текст: {text}"
  text = query_model(query,0)
  print("Полученный новый текст:\n", text)
  #нахождение перечислений/переделка текста
  listing = find_connection(text)


#для запроса модели для перечислений
str_zapros = ""
for item in listing:
  str_zapros += "Перечисление, для которого нужно подобрать определяемое слово: " + str(item) + ". "
print(str_zapros)
# запрос модели для перечислений
context = context_model(text, f"Вывод сделай в формате json, и ключей и значений должно быть {len(listing)}")
query = f"Определяемое слово - существительное, от которого зависит задаваемое перечисление. Само определяемое слово не является словом из перечисления. {str_zapros}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
answer_few = query_model(query,len(listing))
print("Ответ по перечислениям:\n", answer_few)
#получение ответа от модели в список
answer_few = json_loads(answer_few)

#формирование списков перечислений, связанных с главным словом и нет
listing_theme = [listing[i] for i in range(len(answer_few)) if answer_few[i].lower() in answer_main_theme.lower()]
listing_else = [listing[i] for i in range(len(answer_few)) if answer_few[i].lower() not in answer_main_theme.lower()]
listing_else_words = [answer_few[i] for i in range(len(answer_few)) if answer_few[i].lower() not in answer_main_theme.lower()]
print("Связаны с главной темой:", listing_theme)
print("Не связаны с главной темой: ", listing_else, "и сами слова: ", listing_else_words)

#дополенение полученных списков
listing_theme_description = listings(listing_theme)
listing_else_description = listings(listing_else)
print(listing_theme_description)
print(listing_else_description)

#для запроса модели если список слов, связаных с главной темой, не пустой
if (listing_theme_description):
  str_zapros = ""
  count = 0
  for item in listing_theme_description:
    count +=1
    str_zapros += "Перечисление для которого нужно подобрать обобщающее слово: " + str(item) + ". "
  print(str_zapros)
  print(count)
  #запрос модели если список слов, связаных с главной темой, не пустой
  context = context_model(text, f"Вывод сделай только в формате json, и ключей и значений должно быть {count}")
  query = f"Обощающее слово - слово, которое обощает задаваемое перечисление. {str_zapros}. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
  answer_few_main = query_model(query, count)
  print("Ответ:\n", answer_few_main)
  #получение ответа от модели в список
  listing_main_words = json_loads(answer_few_main)


#запрос модели для перечислений непосредственно не связаны с главным словом
if (listing_else_words):
  #запрос модели для перечислений непосредственно не связаны с главным словом
  context = context_model(text, f"Вывод сделай в формате json в виде ответов да/нет, и ключей и значений должно быть {len(listing_else_words)}")
  query = f"Связаны ли слова {listing_else_words} с термином {answer_main_theme} в тексте?. Текст: {context['text']}. Дополнительная информация: {context['additional_info']}"
  answer_2 = query_model(query, len(listing_else_words))
  print("Ответ:\n", answer_2)
  #получение ответа от модели в список
  listing_answers = json_loads(answer_2)
  for i in range(len(listing_answers)):
    if listing_answers[i]=='нет':
      listing_else_words.pop(i)
  print(listing_else_words)

#работа с начальными формами
listing_theme_description = initial_form(listing_theme_description)
listing_else_description = initial_form(listing_else_description)
listing_main_words = initial_form([listing_main_words])[0]
listing_else_words = initial_form([listing_else_words])[0]
print("listing_theme_description:", listing_theme_description)
print("listing_else_description:", listing_else_description)
print("listing_main_words:", listing_main_words)
print("listing_else_words:", listing_else_words)

#формирование итогового списка
if listing_theme_description and listing_main_words:
  for i in range(len(listing_main_words)):
    rel[titlecase(listing_main_words[i])] = listing_theme_description[i]
print("rel: ", rel)
if listing_else_description and listing_else_words:
  for i in range(len(listing_else_words)):
    rel[titlecase(listing_else_words[i])] = listing_else_description[i]
print("\n\nИТОГ rel: ", rel)

#карта
main_topic = answer_main_theme
related_words = rel
image = generate_graph(main_topic, related_words)
