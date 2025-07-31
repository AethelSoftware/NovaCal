from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import Boolean, create_engine, Column, Integer, String, Text, DateTime, Table, MetaData
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Tables definition
tasks_table = Table(
    "tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(255), nullable=False),
    Column("start_time", DateTime, nullable=False),
    Column("end_time", DateTime, nullable=False),
    Column("description", Text, default=""),
    Column("links", Text, default=""),  # comma separated URLs or JSON string
    Column("files", Text, default=""),  # JSON string of file info (names, paths, etc.)
    Column("parent_custom_task_id", Integer, nullable=True, default=None),
)

custom_tasks_table = Table(
    "custom_tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("description", Text, default=""),
    Column("links", Text, default=""),
    Column("files", Text, default=""),
    Column("overall_start_time", DateTime, nullable=False),
    Column("overall_due_time", DateTime, nullable=False),
    Column("total_length_minutes", Integer, nullable=False),
    Column("importance", Integer, default=2),
    Column("split_enabled", Boolean, default=False),
    Column("block_duration_minutes", Integer, default=30),
)

metadata.create_all(engine)
Session = sessionmaker(bind=engine)


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    session = Session()
    try:
        tasks = session.execute(tasks_table.select()).fetchall()
        # Return tasks as JSON list
        return jsonify([
            {
                "id": task.id,
                "name": task.title,
                "start": task.start_time.isoformat(),
                "end": task.end_time.isoformat(),
                "description": task.description or "",
                "links": task.links or "",
                "files": task.files or "",
                "parentCustomTaskId": task.parent_custom_task_id,
            }
            for task in tasks
        ])
    finally:
        session.close()


@app.route("/api/tasks", methods=["POST"])
def create_task():
    session = Session()
    try:
        data = request.json
        title = data["name"]
        start_time_str = data["start"]
        end_time_str = data["end"]
        description = data.get("description", "")
        links = data.get("links", "")
        files = data.get("files", "")

        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)

        if start_time >= end_time:
            return jsonify({"error": "Start time must be before end time"}), 400

        stmt = tasks_table.insert().values(
            title=title,
            start_time=start_time,
            end_time=end_time,
            description=description,
            links=links,
            files=files,
        )
        result = session.execute(stmt)
        new_task_id = result.inserted_primary_key[0]
        session.commit()

        # Fetch and return created task
        created_task = session.execute(tasks_table.select().where(tasks_table.c.id == new_task_id)).first()

        return jsonify({
            "id": created_task.id,
            "name": created_task.title,
            "start": created_task.start_time.isoformat(),
            "end": created_task.end_time.isoformat(),
            "description": created_task.description or "",
            "links": created_task.links or "",
            "files": created_task.files or "",
        }), 201

    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    session = Session()
    try:
        data = request.json
        task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404

        update_values = {}

        if "name" in data:
            update_values["title"] = data["name"]
        if "description" in data:
            update_values["description"] = data["description"]
        if "links" in data:
            update_values["links"] = data["links"]
        if "files" in data:
            update_values["files"] = data["files"]
        if "start" in data:
            update_values["start_time"] = datetime.fromisoformat(data["start"])
        if "end" in data:
            update_values["end_time"] = datetime.fromisoformat(data["end"])

        # Validate times if both are present or partial update
        new_start_time = update_values.get("start_time", task.start_time)
        new_end_time = update_values.get("end_time", task.end_time)

        if new_start_time >= new_end_time:
            return jsonify({"error": "Start time must be before end time"}), 400

        session.execute(tasks_table.update().where(tasks_table.c.id == task_id).values(**update_values))
        session.commit()

        updated_task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()

        return jsonify({
            "id": updated_task.id,
            "name": updated_task.title,
            "start": updated_task.start_time.isoformat(),
            "end": updated_task.end_time.isoformat(),
            "description": updated_task.description or "",
            "links": updated_task.links or "",
            "files": updated_task.files or "",
        }), 200

    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    session = Session()
    try:
        task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404

        session.execute(tasks_table.delete().where(tasks_table.c.id == task_id))
        session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/custom_tasks", methods=["POST"])
def create_custom_task():
    session = Session()
    try:
        data = request.json
        name = data["name"]
        description = data.get("description", "")
        links = data.get("links", "")
        files = data.get("files", "")
        overall_start_time_str = data["start"]
        overall_due_time_str = data["due"]
        total_length_minutes = data["length"]
        importance = data.get("importance", 2)
        split_enabled = data.get("splitEnabled", False)
        block_duration_minutes = data.get("blockDuration", 30)

        overall_start_time = datetime.fromisoformat(overall_start_time_str)
        overall_due_time = datetime.fromisoformat(overall_due_time_str)

        if overall_start_time >= overall_due_time:
            return jsonify({"error": "Overall start time must be before overall due time"}), 400
        if total_length_minutes <= 0:
            return jsonify({"error": "Total length must be positive"}), 400
        if split_enabled and block_duration_minutes <= 0:
            return jsonify({"error": "Block duration must be positive if splitting is enabled"}), 400

        # Insert custom task
        stmt = custom_tasks_table.insert().values(
            name=name,
            description=description,
            links=links,
            files=files,
            overall_start_time=overall_start_time,
            overall_due_time=overall_due_time,
            total_length_minutes=total_length_minutes,
            importance=importance,
            split_enabled=split_enabled,
            block_duration_minutes=block_duration_minutes,
        )
        result = session.execute(stmt)
        new_custom_task_id = result.inserted_primary_key[0]

        # Schedule blocks if splitting enabled
        if split_enabled:
            remaining_length = total_length_minutes
            current_block_start = overall_start_time

            while remaining_length > 0 and current_block_start < overall_due_time:
                proposed_block_end = current_block_start + timedelta(minutes=block_duration_minutes)
                actual_block_length = block_duration_minutes

                if proposed_block_end > overall_due_time:
                    proposed_block_end = overall_due_time
                    actual_block_length = (overall_due_time - current_block_start).total_seconds() / 60
                    if actual_block_length <= 0:
                        break

                # Check conflicts
                conflicts = session.execute(
                    tasks_table.select().where(
                        (tasks_table.c.start_time < proposed_block_end) & (tasks_table.c.end_time > current_block_start)
                    )
                ).fetchall()

                if conflicts:
                    latest_conflict_end = max(task.end_time for task in conflicts)
                    current_block_start = latest_conflict_end
                    continue

                task_block_title = f"{name} (Part {(total_length_minutes - remaining_length) // block_duration_minutes + 1})"
                if actual_block_length < block_duration_minutes:
                    task_block_title += f" - {int(actual_block_length)}min"

                session.execute(tasks_table.insert().values(
                    title=task_block_title,
                    start_time=current_block_start,
                    end_time=proposed_block_end,
                    description=f"{description}\n\nParent Custom Task ID: {new_custom_task_id}",
                    links=links,
                    files=files,
                    parent_custom_task_id=new_custom_task_id,
                ))

                remaining_length -= actual_block_length
                current_block_start = proposed_block_end

        session.commit()

        created_custom_task = session.execute(
            custom_tasks_table.select().where(custom_tasks_table.c.id == new_custom_task_id)
        ).first()

        return jsonify({
            "id": created_custom_task.id,
            "name": created_custom_task.name,
            "description": created_custom_task.description or "",
            "links": created_custom_task.links or "",
            "files": created_custom_task.files or "",
            "start": created_custom_task.overall_start_time.isoformat(),
            "due": created_custom_task.overall_due_time.isoformat(),
            "length": created_custom_task.total_length_minutes,
            "importance": created_custom_task.importance,
            "splitEnabled": created_custom_task.split_enabled,
            "blockDuration": created_custom_task.block_duration_minutes,
        }), 201

    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
