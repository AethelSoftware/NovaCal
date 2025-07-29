from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import Boolean, create_engine, Column, Integer, String, Text, DateTime, Table, MetaData, or_
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import traceback # Import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Define the tasks table with new columns for links, files, and parent_custom_task_id
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
    Column("parent_custom_task_id", Integer, default=None, nullable=True), # New column for linkage
)

custom_tasks_table = Table(
    "custom_tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("description", Text, default=""),
    Column("links", Text, default=""),
    Column("files", Text, default=""),
    Column("overall_start_time", DateTime, nullable=False), # The 'start' from CreateTaskModal
    Column("overall_due_time", DateTime, nullable=False),   # The 'due' from CreateTaskModal
    Column("total_length_minutes", Integer, nullable=False), # The 'length' from CreateTaskModal
    Column("importance", Integer, default=2),
    Column("split_enabled", Boolean, default=False),
    Column("block_duration_minutes", Integer, default=30),
)

metadata.create_all(engine)
Session = sessionmaker(bind=engine)


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    session = Session()
    tasks = session.execute(tasks_table.select()).fetchall()
    session.close()

    def safe_load_json(text):
        return text or ""

    return jsonify(
        [
            {
                "id": task.id,
                "name": task.title,
                "start": task.start_time.isoformat(),
                "end": task.end_time.isoformat(),
                "description": task.description,
                "links": safe_load_json(task.links),
                "files": safe_load_json(task.files),
                "parentCustomTaskId": task.parent_custom_task_id,
            }
            for task in tasks
        ]
    )


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

        new_task = tasks_table.insert().values(
            title=title,
            start_time=start_time,
            end_time=end_time,
            description=description,
            links=links,
            files=files,
        )
        result = session.execute(new_task)
        new_task_id = result.inserted_primary_key[0]
        session.commit()

        # Fetch the newly created task to return its data
        created_task = session.execute(
            tasks_table.select().where(tasks_table.c.id == new_task_id)
        ).first()
        session.close()

        return (
            jsonify(
                {
                    "id": created_task.id,
                    "name": created_task.title,
                    "start": created_task.start_time.isoformat(),
                    "end": created_task.end_time.isoformat(),
                    "description": created_task.description or "",
                    "links": created_task.links or "",
                    "files": created_task.files or "",
                }
            ),
            201,
        )
    except Exception as e:
        session.rollback()
        session.close()
        print(f"Error creating task: {e}")
        traceback.print_exc() # Print traceback
        return jsonify({"error": str(e)}), 500


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    session = Session()
    try:
        data = request.json
        task = session.execute(
            tasks_table.select().where(tasks_table.c.id == task_id)
        ).first()
        if not task:
            session.close()
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

        # Validate times if both are being updated
        if "start_time" in update_values and "end_time" in update_values:
            if update_values["start_time"] >= update_values["end_time"]:
                return jsonify({"error": "Start time must be before end time"}), 400
        elif "start_time" in update_values and task.end_time and update_values["start_time"] >= task.end_time:
            return jsonify({"error": "Start time must be before existing end time"}), 400
        elif "end_time" in update_values and task.start_time and update_values["end_time"] <= task.start_time:
            return jsonify({"error": "End time must be after existing start time"}), 400


        session.execute(tasks_table.update().where(tasks_table.c.id == task_id).values(**update_values))
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
        print(f"Error updating task: {e}")
        traceback.print_exc() # Print traceback
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    session = Session()
    try:
        task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        if not task:
            session.close()
            return jsonify({"error": "Task not found"}), 404

        session.execute(tasks_table.delete().where(tasks_table.c.id == task_id))
        session.commit()
        session.close()
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        session.rollback()
        session.close()
        print(f"Error deleting task: {e}")
        traceback.print_exc() # Print traceback
        return jsonify({"error": str(e)}), 500


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

        # Insert the custom task itself
        new_custom_task = custom_tasks_table.insert().values(
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
        result = session.execute(new_custom_task)
        new_custom_task_id = result.inserted_primary_key[0]

        # Scheduling algorithm for blocks
        if split_enabled and block_duration_minutes > 0:
            remaining_length = total_length_minutes
            current_block_start = overall_start_time

            while remaining_length > 0 and current_block_start < overall_due_time:
                proposed_block_end = current_block_start + timedelta(minutes=block_duration_minutes)
                actual_block_length = block_duration_minutes

                # Adjust proposed_block_end if it goes beyond overall_due_time
                if proposed_block_end > overall_due_time:
                    proposed_block_end = overall_due_time
                    actual_block_length = (overall_due_time - current_block_start).total_seconds() / 60
                    if actual_block_length <= 0: # Block is too short or start is already past due
                        break

                # Check for conflicts with existing tasks
                conflicting_tasks = session.execute(
                    tasks_table.select().where(
                        (tasks_table.c.start_time < proposed_block_end) & (tasks_table.c.end_time > current_block_start)
                    ).order_by(tasks_table.c.end_time)
                ).fetchall()

                if conflicting_tasks:
                    latest_conflict_end = max([task.end_time for task in conflicting_tasks])
                    current_block_start = latest_conflict_end
                    continue

                # If no conflict, schedule the block
                task_block_title = f"{name} (Part {int(total_length_minutes - remaining_length) // block_duration_minutes + 1})"
                if actual_block_length < block_duration_minutes:
                    task_block_title += f" - {int(actual_block_length)}min"

                task_block = {
                    "title": task_block_title,
                    "start_time": current_block_start,
                    "end_time": proposed_block_end,
                    "description": f"{description}\n\nParent Custom Task ID: {new_custom_task_id}",
                    "links": links,
                    "files": files,
                    "parent_custom_task_id": new_custom_task_id
                }
                session.execute(tasks_table.insert().values(**task_block))
                remaining_length -= actual_block_length
                current_block_start = proposed_block_end

        print("Attempting to commit changes to database.")
        session.commit()
        print("Changes committed successfully.")


        # Fetch the newly created custom task to return
        created_custom_task = session.execute(
            custom_tasks_table.select().where(custom_tasks_table.c.id == new_custom_task_id)
        ).first()

        return (
            jsonify({
                "id": created_custom_task.id,
                "name": created_custom_task.name,
                "description": created_custom_task.description,
                "links": created_custom_task.links,
                "files": created_custom_task.files,
                "start": created_custom_task.overall_start_time.isoformat(),
                "due": created_custom_task.overall_due_time.isoformat(),
                "length": created_custom_task.total_length_minutes,
                "importance": created_custom_task.importance,
                "splitEnabled": created_custom_task.split_enabled,
                "blockDuration": created_custom_task.block_duration_minutes,
            }),
            201,
        )
    except Exception as e:
        session.rollback()
        print(f"Error creating custom task: {e}")
        traceback.print_exc() # Print the full traceback
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)