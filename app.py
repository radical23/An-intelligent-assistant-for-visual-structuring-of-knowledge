from flask import Flask, jsonify, request
import sqlite3

app = Flask(__name__)

def connect_db():
    conn = sqlite3.connect('knowledge_structuring.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/graphs', methods=['GET'])
def get_graphs():
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM graphs")
    graphs = cur.fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in graphs])

@app.route('/api/graph', methods=['POST'])
def save_graph():
    new_graph = request.json
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO graphs (name, graph_data) VALUES (?, ?)",
                (new_graph['name'], new_graph['graph_data']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'Graph saved!'}), 201

if __name__ == '__main__':
    app.run(debug=True)