from graphviz import Digraph

# Создаем объект графа
dot = Digraph()

# Проверяем, какой движок используется (должно быть 'dot')
print(dot.engine)

# Добавляем узлы и ребра
dot.node('A', 'Start')
dot.node('B', 'Middle')
dot.node('C', 'End')
dot.edges(['AB', 'BC'])

# Рендерим граф и сохраняем его в PNG
output_path = dot.render('test_graph', format='png')
print(f"Граф успешно создан и сохранен в {output_path}")

