from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import Boolean, create_engine, Column, Integer, String, Text, DateTime, Table, MetaData, and_, select
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import traceback
from sqlalchemy import JSON
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
engine = create_engine(DATABASE_URL, echo=True)
metadata = MetaData()

# Existing tables (tasks / custom_tasks / focus_sessions / completed_tasks) as before
tasks_table = Table(
    "tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, nullable=False),  # <-- add this
    Column("title", String(255), nullable=False),
    Column("start_time", DateTime, nullable=False),
    Column("end_time", DateTime, nullable=False),
    Column("due_time", DateTime, nullable=True),
    Column("importance", Integer, default=2),
    Column("description", Text, default=""),
    Column("links", Text, default=""),
    Column("files", Text, default=""),
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

focus_sessions_table = Table(
    "focus_sessions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("task_id", Integer, nullable=True),
    Column("start_time", DateTime, nullable=False),
    Column("duration", Integer, nullable=False),
    Column("task_completed", Boolean, default=False),
)

completed_tasks_table = Table(
    "completed_tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("task_id", Integer, nullable=False),
    Column("completion_date", DateTime, nullable=False),
)

# NEW: working_hours table
working_hours_table = Table(
    "working_hours",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("day", String(32), nullable=False, unique=True),  # e.g. "Monday"
    Column("start", String(8), nullable=False),  # "HH:MM"
    Column("end", String(8), nullable=False),    # "HH:MM"
)

habits_table = Table(
    "habits",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("description", Text, default=""),
    Column("icon", String(64), default="CheckCircle2"),
    Column("file", String(255), nullable=True),
    Column("schedules", JSON, nullable=False),
)

users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("email", String(255), unique=True, nullable=False),
    Column("password_hash", String(255), nullable=False),
)

metadata.create_all(engine)
Session = sessionmaker(bind=engine)

# ---------- helper ----------
def find_free_slots(existing_tasks, day_start, day_end):
    slots = []
    prev_end = day_start
    for t in sorted(existing_tasks, key=lambda x: x.start_time):
        if t.start_time > prev_end:
            slots.append((prev_end, t.start_time))
        prev_end = max(prev_end, t.end_time)
    if prev_end < day_end:
        slots.append((prev_end, day_end))
    return slots

@app.route('/api/auto_schedule', methods=["POST"])
def auto_schedule():
    session = Session()
    try:
        data = request.json or {}
        task_ids = data.get("task_ids")
        if not task_ids:
            return jsonify({"error": "No task IDs to schedule."}), 400

        unscheduled = session.execute(
            tasks_table.select().where(tasks_table.c.id.in_(task_ids))
        ).fetchall()
        if not unscheduled:
            return jsonify({"error": "No matching tasks."}), 404

        min_start = min(t.start_time for t in unscheduled)
        max_due = max(t.due_time or t.end_time for t in unscheduled)

        scheduled = session.execute(
            tasks_table.select().where(
                and_(
                    tasks_table.c.start_time >= min_start.replace(hour=0, minute=0),
                    tasks_table.c.end_time <= max_due.replace(hour=23, minute=59),
                    ~tasks_table.c.id.in_(task_ids)
                )
            )
        ).fetchall()

        DAY_START = 8
        DAY_END = 22

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

@app.route("/api/focus_sessions", methods=["POST"])
def create_focus_session():
    session = Session()
    try:
        data = request.json
        task_id = data.get("task_id")
        duration = data["duration"]
        task_completed = data.get("task_completed", False)
        start_time = datetime.now()
        stmt = focus_sessions_table.insert().values(
            task_id=task_id,
            start_time=start_time,
            duration=duration,
            task_completed=task_completed,
        )
        result = session.execute(stmt)
        new_id = result.inserted_primary_key[0]
        session.commit()
        
        new_session = session.execute(focus_sessions_table.select().where(focus_sessions_table.c.id == new_id)).first()
        task = session.execute(tasks_table.select().where(tasks_table.c.id == new_session.task_id)).first()
        
        if task_completed:
            session.execute(completed_tasks_table.insert().values(
                task_id=task_id,
                completion_date=datetime.now()
            ))
            session.commit()

        return jsonify({
            "id": new_session.id,
            "task_id": new_session.task_id,
            "task_name": task.title if task else "Unassigned",
            "start_time": new_session.start_time.isoformat(),
            "duration": new_session.duration,
            "task_completed": new_session.task_completed,
        }), 201
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/focus_sessions", methods=["GET"])
def get_focus_sessions():
    session = Session()
    try:
        sessions = session.execute(focus_sessions_table.select()).fetchall()
        result = []
        for s in sessions:
            task = session.execute(tasks_table.select().where(tasks_table.c.id == s.task_id)).first()
            result.append({
                "id": s.id,
                "task_id": s.task_id,
                "task_name": task.title if task else "Unassigned",
                "start_time": s.start_time.isoformat(),
                "duration": s.duration,
                "task_completed": s.task_completed,
            })
        return jsonify(result)
    finally:
        session.close()

@app.route("/api/focus_sessions/<int:session_id>", methods=["DELETE"])
def delete_focus_session(session_id):
    session = Session()
    try:
        session.execute(focus_sessions_table.delete().where(focus_sessions_table.c.id == session_id))
        session.commit()
        return jsonify({"message": "Focus session deleted."}), 200
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/completed_tasks", methods=["POST"])
def complete_task():
    session = Session()
    try:
        data = request.json
        task_id = data.get("task_id")
        if not task_id:
            return jsonify({"error": "Task ID is required"}), 400

        task = session.execute(tasks_table.select().where(tasks_table.c.id == task_id)).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        stmt = completed_tasks_table.insert().values(
            task_id=task_id,
            completion_date=datetime.fromisoformat(data.get("completion_date", datetime.now().isoformat()))
        )
        result = session.execute(stmt)
        session.commit()
        new_id = result.inserted_primary_key[0]
        
        return jsonify({
            "id": new_id,
            "task_id": task.id,
            "task_name": task.title,
            "completion_date": datetime.now().isoformat()
        }), 201
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/completed_tasks", methods=["GET"])
def get_completed_tasks():
    session = Session()
    try:
        completed = session.execute(completed_tasks_table.select()).fetchall()
        result = []
        for c in completed:
            task = session.execute(tasks_table.select().where(tasks_table.c.id == c.task_id)).first()
            if task:
                result.append({
                    "id": c.id,
                    "task_id": c.task_id,
                    "task_name": task.title,
                    "completion_date": c.completion_date.isoformat(),
                })
        return jsonify(result)
    finally:
        session.close()

@app.route("/api/completed_tasks/<int:completed_task_id>", methods=["DELETE"])
def delete_completed_task(completed_task_id):
    session = Session()
    try:
        session.execute(completed_tasks_table.delete().where(completed_tasks_table.c.id == completed_task_id))
        session.commit()
        return jsonify({"message": "Completed task deleted."}), 200
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/hours", methods=["GET"])
def get_hours():
    session = Session()
    try:
        rows = session.execute(working_hours_table.select()).fetchall()
        # return as array of { day, start, end }
        result = [{"day": r.day, "start": r.start, "end": r.end} for r in rows]
        return jsonify(result)
    finally:
        session.close()


@app.route("/api/hours", methods=["POST"])
def save_hours():
    session = Session()
    try:
        data = request.json or {}
        hours_list = data.get("hours")
        if not hours_list or not isinstance(hours_list, list):
            return jsonify({"error": "Invalid payload, expected 'hours' list."}), 400

        # Basic validation: ensure day/start/end exist and times look like HH:MM
        for item in hours_list:
            if not all(k in item for k in ("day", "start", "end")):
                return jsonify({"error": "Each item must contain day, start, end"}), 400
            # simple time format check
            for t in ("start", "end"):
                if not isinstance(item[t], str) or len(item[t]) < 4 or ":" not in item[t]:
                    return jsonify({"error": f"Invalid time format for {t} in {item.get('day')}"}), 400

        # Upsert: delete existing rows for provided days, then insert new ones
        days = [it["day"] for it in hours_list]
        session.execute(working_hours_table.delete().where(working_hours_table.c.day.in_(days)))
        for it in hours_list:
            session.execute(
                working_hours_table.insert().values(
                    day=it["day"],
                    start=it["start"],
                    end=it["end"],
                )
            )
        session.commit()
        return jsonify({"message": "Hours saved"}), 200
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/habits", methods=["GET"])
def get_habits():
    session = Session()
    try:
        habits = session.execute(habits_table.select()).fetchall()
        # convert schedules JSON column back to Python list
        return jsonify([
            {
                "id": h.id,
                "name": h.name,
                "description": h.description or "",
                "icon": h.icon or "CheckCircle2",
                "file": h.file,
                "schedules": h.schedules or [],
            }
            for h in habits
        ])
    finally:
        session.close()

@app.route("/api/habits", methods=["POST"])
def create_habit():
    session = Session()
    try:
        data = request.json
        if not data.get("name") or not data.get("schedules"):
            return jsonify({"error": "Name and schedules required"}), 400

        stmt = habits_table.insert().values(
            name=data["name"],
            description=data.get("description", ""),
            icon=data.get("icon", "CheckCircle2"),
            file=data.get("file", None),
            schedules=data["schedules"],
        )
        result = session.execute(stmt)
        new_id = result.inserted_primary_key[0]
        session.commit()
        habit = session.execute(habits_table.select().where(habits_table.c.id == new_id)).first()
        return jsonify({
            "id": habit.id,
            "name": habit.name,
            "description": habit.description,
            "icon": habit.icon,
            "file": habit.file,
            "schedules": habit.schedules,
        }), 201
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/habits/<int:habit_id>", methods=["PATCH"])
def update_habit(habit_id):
    session = Session()
    try:
        data = request.json
        habit = session.execute(
            habits_table.select().where(habits_table.c.id == habit_id)
        ).first()

        if not habit:
            return jsonify({"error": "Habit not found"}), 404

        updates = {}

        if "schedules" in data:
            updates["schedules"] = data["schedules"]  # ✅ keep as list/dict
        for field in ["name", "description", "icon", "file"]:
            if field in data:
                # ✅ ensure icon is string
                if field == "icon" and isinstance(data[field], dict):
                    updates[field] = data[field].get("name", "CheckCircle2")
                else:
                    updates[field] = data[field]

        if not updates:
            return jsonify({"error": "No updates submitted"}), 400

        session.execute(
            habits_table.update()
            .where(habits_table.c.id == habit_id)
            .values(**updates)
        )
        session.commit()

        updated = session.execute(
            habits_table.select().where(habits_table.c.id == habit_id)
        ).first()

        return jsonify({
            "id": updated.id,
            "name": updated.name,
            "description": updated.description,
            "icon": updated.icon,
            "file": updated.file,
            "schedules": updated.schedules or [],  # ✅ already deserialized
        }), 200

    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/api/habits/<int:habit_id>", methods=["DELETE"])
def delete_habit(habit_id):
    session = Session()
    try:
        session.execute(habits_table.delete().where(habits_table.c.id == habit_id))
        session.commit()
        return jsonify({"message": "Habit deleted"}), 200
    except Exception as e:
        session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/auth/signup", methods=["POST"])
def auth_signup():
    session = Session()
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        if not all([name, email, password]):
            return jsonify({"error": "All fields required"}), 400
        existing = session.execute(users_table.select().where(users_table.c.email == email.lower())).first()
        if existing:
            return jsonify({"error": "Email already in use"}), 400
        password_hash = generate_password_hash(password)
        result = session.execute(users_table.insert().values(
            name=name, email=email.lower(), password_hash=password_hash
        ))
        user_id = result.inserted_primary_key[0]
        session.commit()
        return jsonify({"id": user_id, "name": name, "email": email}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# --- Login ---
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    session = Session()
    try:
        data = request.json
        email = data.get("email", "").lower()
        password = data.get("password", "")
        user = session.execute(users_table.select().where(users_table.c.email == email)).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401
        # minimal auth token (in-memory or localStorage)
        # For simplicity, just return user info and pretend token
        token = f"token-{user.id}"
        return jsonify({"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email}})
    finally:
        session.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)