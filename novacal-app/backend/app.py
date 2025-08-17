from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import Boolean, create_engine, Column, Integer, String, Text, DateTime, Table, MetaData, and_
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ---------- DATABASE ----------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# TASKS table now with due_time and importance for scheduling
tasks_table = Table(
    "tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(255), nullable=False),
    Column("start_time", DateTime, nullable=False),
    Column("end_time", DateTime, nullable=False),
    Column("due_time", DateTime, nullable=True),   # NEW - scheduling deadline 
    Column("importance", Integer, default=2),     # NEW - scheduling priority
    Column("description", Text, default=""),
    Column("links", Text, default=""),
    Column("files", Text, default=""),
    Column("parent_custom_task_id", Integer, nullable=True, default=None),
)

# CUSTOM TASKS (unchanged except for same `importance`)
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

# ---------- HELPERS ----------
def find_free_slots(existing_tasks, day_start, day_end):
    """
    Finds available time slots (as (start, end) tuples) between day_start and day_end
    given a list of tasks sorted by start_time.
    """
    slots = []
    prev_end = day_start
    for t in sorted(existing_tasks, key=lambda x: x.start_time):
        if t.start_time > prev_end:
            slots.append((prev_end, t.start_time))
        prev_end = max(prev_end, t.end_time)
    if prev_end < day_end:
        slots.append((prev_end, day_end))
    return slots

# ---------- API: AUTO SCHEDULE ----------
@app.route('/api/auto_schedule', methods=["POST"])
def auto_schedule():
    """
    Schedules tasks by IDs into the first available free slot before their due_time.
    """
    session = Session()
    try:
        data = request.json or {}
        task_ids = data.get("task_ids")
        if not task_ids:
            return jsonify({"error": "No task IDs to schedule."}), 400

        # Load target (unscheduled) tasks
        unscheduled = session.execute(
            tasks_table.select().where(tasks_table.c.id.in_(task_ids))
        ).fetchall()
        if not unscheduled:
            return jsonify({"error": "No matching tasks."}), 404

        # Determine time window
        min_start = min(t.start_time for t in unscheduled)
        max_due = max(t.due_time or t.end_time for t in unscheduled)

        # Gather existing scheduled tasks in same window
        scheduled = session.execute(
            tasks_table.select().where(
                and_(
                    tasks_table.c.start_time >= min_start.replace(hour=0, minute=0),
                    tasks_table.c.end_time <= max_due.replace(hour=23, minute=59),
                    ~tasks_table.c.id.in_(task_ids)
                )
            )
        ).fetchall()

        DAY_START = 8  # earliest scheduling hour
        DAY_END = 22   # latest scheduling hour

        # Sort unscheduled tasks by due_time, importance DESC, duration DESC
        sorted_tasks = sorted(
            unscheduled,
            key=lambda t: (
                t.due_time or t.end_time,
                -(t.importance or 2),
                -((t.end_time - t.start_time).total_seconds())
            )
        )

        scheduled_updates = []

        for task in sorted_tasks:
            task_duration = int((task.end_time - task.start_time).total_seconds() // 60)
            deadline_day = (task.due_time or task.end_time).date()

            # Loop through each day until due date
            day_cursor = datetime.now().date()
            while day_cursor <= deadline_day:
                day_start_dt = datetime.combine(day_cursor, datetime.min.time()).replace(hour=DAY_START)
                day_end_dt = datetime.combine(day_cursor, datetime.min.time()).replace(hour=DAY_END)

                day_tasks = [t for t in scheduled if t.start_time.date() == day_cursor]
                free_slots = find_free_slots(day_tasks, day_start_dt, day_end_dt)

                placed = False
                for slot_start, slot_end in free_slots:
                    slot_length = int((slot_end - slot_start).total_seconds() // 60)
                    if slot_length >= task_duration:
                        # Assign slot
                        new_start = slot_start
                        new_end = slot_start + timedelta(minutes=task_duration)
                        session.execute(
                            tasks_table.update().where(tasks_table.c.id == task.id)
                            .values(start_time=new_start, end_time=new_end)
                        )
                        scheduled.append(type('obj', (object,), {"start_time": new_start, "end_time": new_end}))
                        scheduled_updates.append({
                            "id": task.id,
                            "start": new_start.isoformat(),
                            "end": new_end.isoformat()
                        })
                        placed = True
                        break
                if placed:
                    break

                day_cursor += timedelta(days=1)

        session.commit()
        return jsonify({"scheduled": scheduled_updates}), 200

    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ---------- API: TASK CRUD ----------
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    session = Session()
    try:
        tasks = session.execute(tasks_table.select()).fetchall()
        return jsonify([
            {
                "id": t.id,
                "name": t.title,
                "start": t.start_time.isoformat(),
                "end": t.end_time.isoformat(),
                "due_time": t.due_time.isoformat() if t.due_time else None,
                "importance": t.importance,
                "description": t.description or "",
                "links": t.links or "",
                "files": t.files or "",
                "parentCustomTaskId": t.parent_custom_task_id,
            }
            for t in tasks
        ])
    finally:
        session.close()

@app.route("/api/tasks", methods=["POST"])
def create_task():
    session = Session()
    try:
        data = request.json
        title = data["name"]
        start_time = datetime.fromisoformat(data["start"])
        end_time = datetime.fromisoformat(data["end"])
        due_time = datetime.fromisoformat(data.get("due_time", data["end"]))
        importance = data.get("importance", 2)

        if start_time >= end_time:
            return jsonify({"error": "Start time must be before end time"}), 400

        stmt = tasks_table.insert().values(
            title=title,
            start_time=start_time,
            end_time=end_time,
            due_time=due_time,
            importance=importance,
            description=data.get("description", ""),
            links=data.get("links", ""),
            files=data.get("files", ""),
        )
        result = session.execute(stmt)
        new_id = result.inserted_primary_key[0]
        session.commit()
        task = session.execute(tasks_table.select().where(tasks_table.c.id == new_id)).first()
        return jsonify({
            "id": task.id,
            "name": task.title,
            "start": task.start_time.isoformat(),
            "end": task.end_time.isoformat(),
            "due_time": task.due_time.isoformat() if task.due_time else None,
            "importance": task.importance,
            "description": task.description or "",
            "links": task.links or "",
            "files": task.files or "",
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

        updates = {}
        if "name" in data: updates["title"] = data["name"]
        if "description" in data: updates["description"] = data["description"]
        if "links" in data: updates["links"] = data["links"]
        if "files" in data: updates["files"] = data["files"]
        if "start" in data: updates["start_time"] = datetime.fromisoformat(data["start"])
        if "end" in data: updates["end_time"] = datetime.fromisoformat(data["end"])
        if "due_time" in data: updates["due_time"] = datetime.fromisoformat(data["due_time"])
        if "importance" in data: updates["importance"] = data["importance"]

        # Validate if both start_time and end_time present
        new_start = updates.get("start_time", task.start_time)
        new_end = updates.get("end_time", task.end_time)
        if new_start >= new_end:
            return jsonify({"error": "Start time must be before end time"}), 400

        session.execute(tasks_table.update().where(tasks_table.c.id == task_id).values(**updates))
        session.commit()

        updated = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        return jsonify({
            "id": updated.id,
            "name": updated.title,
            "start": updated.start_time.isoformat(),
            "end": updated.end_time.isoformat(),
            "due_time": updated.due_time.isoformat() if updated.due_time else None,
            "importance": updated.importance,
            "description": updated.description or "",
            "links": updated.links or "",
            "files": updated.files or "",
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
        session.execute(tasks_table.delete().where(tasks_table.c.id == task_id))
        session.commit()
        return jsonify({"message": "Task deleted."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ---------- API: CUSTOM TASK ----------
@app.route("/api/custom_tasks", methods=["POST"])
def create_custom_task():
    session = Session()
    try:
        data = request.json
        name = data["name"]
        overall_start_time = datetime.fromisoformat(data["start"])
        overall_due_time = datetime.fromisoformat(data["due"])
        total_length_minutes = data["length"]
        importance = data.get("importance", 2)
        split_enabled = data.get("splitEnabled", False)
        block_duration = data.get("blockDuration", 30)

        stmt = custom_tasks_table.insert().values(
            name=name,
            description=data.get("description", ""),
            links=data.get("links", ""),
            files=data.get("files", ""),
            overall_start_time=overall_start_time,
            overall_due_time=overall_due_time,
            total_length_minutes=total_length_minutes,
            importance=importance,
            split_enabled=split_enabled,
            block_duration_minutes=block_duration,
        )
        res = session.execute(stmt)
        ct_id = res.inserted_primary_key[0]

        if split_enabled:
            remaining = total_length_minutes
            current_start = overall_start_time
            while remaining > 0 and current_start < overall_due_time:
                proposed_end = min(current_start + timedelta(minutes=block_duration), overall_due_time)
                actual = int((proposed_end - current_start).total_seconds() // 60)
                conflicts = session.execute(
                    tasks_table.select().where(
                        (tasks_table.c.start_time < proposed_end) & (tasks_table.c.end_time > current_start)
                    )
                ).fetchall()
                if conflicts:
                    current_start = max(t.end_time for t in conflicts)
                    continue
                session.execute(tasks_table.insert().values(
                    title=f"{name} ({(total_length_minutes - remaining)//block_duration + 1})",
                    start_time=current_start,
                    end_time=proposed_end,
                    due_time=overall_due_time,
                    importance=importance,
                    description=data.get("description", ""),
                    links=data.get("links", ""),
                    files=data.get("files", ""),
                    parent_custom_task_id=ct_id
                ))
                remaining -= actual
                current_start = proposed_end

        session.commit()
        return jsonify({"message": "Custom task created", "id": ct_id}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
