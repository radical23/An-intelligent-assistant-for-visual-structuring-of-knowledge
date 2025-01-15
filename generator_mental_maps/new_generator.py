import spacy
import dash
import dash_cytoscape as cyto
from dash import html

# Загрузка модели spaCy
nlp = spacy.load("ru_core_news_sm")  # Замените на ru_core_news_sm для русского текста

def create_mental_map(text):
    doc = nlp(text)
    nodes = {}
    edges = []

    # Создание узлов и связей
    for token in doc:
        if token.is_alpha and not token.is_stop:
            # Добавляем узел для текущего токена
            if token.text not in nodes:
                nodes[token.text] = {"data": {"id": token.text, "label": token.text}}

            # Добавляем узел для родительского токена (head), если его ещё нет
            if token.head.text not in nodes:
                nodes[token.head.text] = {"data": {"id": token.head.text, "label": token.head.text}}

            # Создаём связь между токеном и его родительским токеном
            if token.head != token:
                edges.append({"data": {"source": token.head.text, "target": token.text}})
    
    # Возвращаем список узлов и связей
    return list(nodes.values()), edges


# Входной текст
input_text = """
Планета Земля представляет собой уникальное сочетание геологических структур, дикой природы и природных ресурсов, которые находятся в постоянном взаимодействии посредством различных географических и биогеохимических процессов. Эти взаимодействия играют важную роль в регулировании климата, обеспечении ресурсами и экологических услугах, что делает Землю ценным источником жизни и научных исследований. Грязная на вид земля насыщена различными микроорганизмами."""

# Создание узлов и связей
nodes, edges = create_mental_map(input_text)

# Dash-приложение
app = dash.Dash(__name__)
cyto.load_extra_layouts()

app.layout = html.Div([
    cyto.Cytoscape(
        id='cytoscape',
        elements=nodes + edges,
        layout={'name': 'cose'},
        style={'width': '100vw', 'height': '100vh'},
        stylesheet=[
    {
        'selector': 'node',
        'style': {
            'label': 'data(label)',
            'width': 90,  # Увеличенный размер узлов
            'height': 90,
            'background-color': '#0074D9',
            'color': '#ffffff',
            'text-valign': 'center',  # Текст по вертикали
            'text-halign': 'center',  # Текст по горизонтали
            'font-size': '10px',  # Увеличенный шрифт
        }
    },
    {
        'selector': 'edge',
        'style': {
            'width': 2,
            'line-color': '#7FDBFF',
            'target-arrow-color': '#7FDBFF',
            'target-arrow-shape': 'triangle',
        }
    }
]

    )
])

if __name__ == '__main__':
    app.run_server(debug=True)
