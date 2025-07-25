from flask import Flask, jsonify, request
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (for development)

# Your scheduling algorithm (placeholder)
def run_scheduling_algorithm(tasks):
    # This is where your Python algorithm would process tasks
    # and return the optimized schedule
    print("Running algorithm with tasks:", tasks)
    scheduled_tasks = []
    for i, task in enumerate(tasks):
        scheduled_tasks.append({
            "id": i + 1,
            "name": task["name"],
            "duration": task["duration"],
            "start_time": f"2025-01-01T09:00:00Z" # Placeholder
        })
    return scheduled_tasks

@app.route('/')
def home():
    return "Hello from Flask Backend!"

@app.route('/api/schedule', methods=['POST'])
def schedule_tasks():
    data = request.json
    tasks = data.get('tasks', [])

    if not tasks:
        return jsonify({"error": "No tasks provided"}), 400

    scheduled_data = run_scheduling_algorithm(tasks)
    return jsonify(scheduled_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000) # Run on port 5000