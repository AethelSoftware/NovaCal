from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Table, MetaData
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Define the tasks table with new columns for links and files
tasks_table = Table(
    "tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(255), nullable=False),
    Column("start_time", DateTime, nullable=False),
    Column("end_time", DateTime, nullable=False),
    Column("description", Text, default=""),
    Column("links", Text, default=""),   # Can store comma separated URLs or JSON string
    Column("files", Text, default=""),   # Can store JSON string of file info (names, paths, etc.)
)

metadata.create_all(engine)
Session = sessionmaker(bind=engine)


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    session = Session()
    tasks = session.execute(tasks_table.select()).fetchall()
    session.close()

    def safe_load_json(text):
        # You might want to parse JSON if you store JSON string for links/files,
        # but here we just return the raw text.
        return text or ""

    return jsonify(
        [
            {
                "id": row.id,
                "name": row.title,
                "start": row.start_time.isoformat(),
                "end": row.end_time.isoformat(),
                "description": row.description or "",
                "links": safe_load_json(row.links),
                "files": safe_load_json(row.files),
            }
            for row in tasks
        ]
    )


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json
    try:
        new_task = {
            "title": data["name"],
            "start_time": datetime.fromisoformat(data["start"]),
            "end_time": datetime.fromisoformat(data["end"]),
            "description": data.get("description", ""),
            "links": data.get("links", ""),
            "files": data.get("files", ""),
        }
    except Exception:
        return jsonify({"error": "Invalid date format or missing fields"}), 400

    session = Session()
    result = session.execute(tasks_table.insert().values(**new_task))
    session.commit()
    new_id = result.inserted_primary_key[0]
    session.close()

    return (
        jsonify(
            {
                "id": new_id,
                "name": new_task["title"],
                "start": new_task["start_time"].isoformat(),
                "end": new_task["end_time"].isoformat(),
                "description": new_task["description"],
                "links": new_task["links"],
                "files": new_task["files"],
            }
        ),
        201,
    )

@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.json
    session = Session()
    try:
        # Fetch the existing task
        task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        if not task:
            session.close()
            return jsonify({"error": "Task not found"}), 404

        update_data = {}

        # Update fields if they exist in the received JSON data
        if "name" in data:
            update_data["title"] = data["name"]

        if "start" in data:
            try:
                update_data["start_time"] = datetime.fromisoformat(data["start"])
            except Exception:
                session.close()
                return jsonify({"error": "Invalid start date format"}), 400

        if "end" in data:
            try:
                update_data["end_time"] = datetime.fromisoformat(data["end"])
            except Exception:
                session.close()
                return jsonify({"error": "Invalid end date format"}), 400

        if "description" in data:
            update_data["description"] = data["description"]

        if "links" in data:
            update_data["links"] = data["links"]

        if "files" in data:
            update_data["files"] = data["files"]

        if update_data:
            session.execute(
                tasks_table.update()
                .where(tasks_table.c.id == task_id)
                .values(**update_data)
            )
            session.commit()

        # Fetch updated task to return fresh data
        updated_task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        session.close()

        return jsonify(
            {
                "id": updated_task.id,
                "name": updated_task.title,
                "start": updated_task.start_time.isoformat(),
                "end": updated_task.end_time.isoformat(),
                "description": updated_task.description or "",
                "links": updated_task.links or "",
                "files": updated_task.files or "",
            }
        )

    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    # Run on port 5000 by default
    app.run(debug=True)
