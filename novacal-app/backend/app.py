from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Table, MetaData
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///tasks.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Define the tasks table
tasks_table = Table(
    'tasks', metadata,
    Column('id', Integer, primary_key=True),
    Column('title', String(255), nullable=False),
    Column('start_time', DateTime, nullable=False),
    Column('end_time', DateTime, nullable=False),
    Column('description', Text, default="")
)

metadata.create_all(engine)
Session = sessionmaker(bind=engine)


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    session = Session()
    tasks = session.execute(tasks_table.select()).fetchall()
    session.close()
    return jsonify([
        {
            "id": row.id,
            "name": row.title,
            "start": row.start_time.isoformat(),
            "end": row.end_time.isoformat(),
            "description": row.description or "",
        }
        for row in tasks
    ])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json
    try:
        new_task = {
            "title": data["name"],
            "start_time": datetime.fromisoformat(data["start"]),
            "end_time": datetime.fromisoformat(data["end"]),
            "description": data.get("description", ""),
        }
    except Exception:
        return jsonify({"error": "Invalid date format or missing fields"}), 400

    session = Session()
    result = session.execute(tasks_table.insert().values(**new_task))
    session.commit()
    new_id = result.inserted_primary_key[0]
    session.close()

    return jsonify({
        "id": new_id,
        "name": new_task["title"],
        "start": new_task["start_time"].isoformat(),
        "end": new_task["end_time"].isoformat(),
        "description": new_task["description"],
    }), 201


if __name__ == "__main__":
    # Run on port 5000 by default
    app.run(debug=True)
