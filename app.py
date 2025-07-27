from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# ---------- DB CONNECTION ----------
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='Bike@1535',
        database='study_buddy',
        cursorclass=pymysql.cursors.DictCursor
    )

# ---------- ROUTES FOR PAGES ----------
@app.route('/login.html')
def serve_login():
    return render_template('login.html')

@app.route('/')
def serve_index():
    return render_template('index.html')

# ---------- USER REGISTER ----------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing fields'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (username, password) VALUES (%s, %s)',
            (username, generate_password_hash(password))
        )
        conn.commit()
        return jsonify({'message': 'User registered'}), 201
    except pymysql.err.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    finally:
        conn.close()

# ---------- USER LOGIN ----------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({'username': username}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

# ---------- TASKS CRUD ----------
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    username = request.headers.get('X-Username')
    print("DEBUG: Fetching tasks for user", username)  # Debug line
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks WHERE username = %s', (username,))
    tasks = cursor.fetchall()
    conn.close()
    return jsonify(tasks)


@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    print("DEBUG: Adding task for user", data['username'])  # Debug line
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tasks (title, description, priority, deadline, is_completed, username)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            data['title'],
            data['description'],
            data['priority'],
            data['deadline'],
            data.get('is_completed', 0),
            data['username']
        ))
        conn.commit()
        return jsonify({"message": "Task added successfully"}), 201
    except Exception as e:
        print("Error while inserting task:", e)
        return jsonify({"error": "Failed to add task"}), 500
    finally:
        conn.close()

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
        conn.commit()
        return jsonify({"message": "Task deleted successfully"})
    except Exception as e:
        print("Error while deleting task:", e)
        return jsonify({"error": "Failed to delete task"}), 500
    finally:
        conn.close()

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE tasks SET
                title = %s,
                description = %s,
                priority = %s,
                deadline = %s,
                is_completed = %s
            WHERE id = %s
        ''', (
            data['title'],
            data['description'],
            data['priority'],
            data['deadline'],
            data['is_completed'],
            task_id
        ))
        conn.commit()
        return jsonify({"message": "Task updated successfully"}), 200
    except Exception as e:
        print("Error while updating task:", e)
        return jsonify({"error": "Failed to update task"}), 500
    finally:
        conn.close()

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_single_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks WHERE id = %s', (task_id,))
    task = cursor.fetchone()
    conn.close()
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)

if __name__ == "__main__":
    app.run()
