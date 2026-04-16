import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import asyncio
import io
from dotenv import load_dotenv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import logic_ai # Import the newly created AI logic

load_dotenv()

app = FastAPI(title="Neural Learning Gap Detector API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def library_connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"status": "online", "message": "Neural Learning Gap Detector API v1.0.0"}

@app.websocket("/ws/telemetry/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.library_connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process real-time MediaPipe telemetry here
            telemetry = json.loads(data)
            print(f"Client {client_id} telemetry: {telemetry}")
            
            # Placeholder for AI feedback loop
            response = {
                "status": "received",
                "interference_alert": False,
                "engagement_score": telemetry.get("engagement", 0)
            }
            await manager.send_personal_message(json.dumps(response), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client {client_id} disconnected")

@app.post("/analyze/gap_detection")
async def detect_gap(
    student_id: str = Form(...),
    topic: str = Form(...),
    mastery: float = Form(...)
):
    decay_data = logic_ai.predict_knowledge_decay(student_id, topic, mastery)
    remedial = logic_ai.generate_remedial_actions(decay_data)
    
    return {
        "decay_prediction": decay_data,
        "recommended_action": remedial
    }

# --- CMS DATA PERSISTENCE (JSON-BASED) ---
import os as _os
STORAGE_PATH = _os.path.join(_os.path.dirname(__file__), "storage", "database.json")

def read_db():
    EMPTY_DB = {"subjects": [], "questions": [], "quizzes": [], "assignments": [], "attempts": []}
    if not _os.path.exists(STORAGE_PATH):
        write_db(EMPTY_DB)
        return EMPTY_DB
    try:
        # utf-8-sig strips BOM automatically if present
        with open(STORAGE_PATH, "r", encoding="utf-8-sig") as f:
            content = f.read().strip()
        if not content:
            write_db(EMPTY_DB)
            return EMPTY_DB
        data = json.loads(content)
        for col in ["subjects", "questions", "quizzes", "assignments", "attempts"]:
            if col not in data:
                data[col] = []
        return data
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"[DB] Corruption detected ({e}), resetting to empty database.")
        write_db(EMPTY_DB)
        return EMPTY_DB

def write_db(data):
    # Ensure storage directory exists
    _os.makedirs(_os.path.dirname(STORAGE_PATH), exist_ok=True)
    # Write clean UTF-8 WITHOUT BOM (no newline='' needed, json handles it)
    with open(STORAGE_PATH, "w", encoding="utf-8", newline="") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ── Core CMS ──────────────────────────────────────────────────────────────────
@app.get("/api/cms/data")
async def get_cms_data():
    return read_db()

@app.post("/api/cms/subjects")
async def create_subject(subject: dict):
    db = read_db()
    db["subjects"].append(subject)
    write_db(db)
    return {"status": "success", "message": "Subject archived in neural store"}

@app.post("/api/cms/quizzes")
async def create_quiz(quiz: dict):
    db = read_db()
    db["quizzes"].append(quiz)
    write_db(db)
    return {"status": "success", "message": "Quiz deployed to student nodes"}

@app.post("/api/cms/questions")
async def add_question(question: dict):
    db = read_db()
    db["questions"].append(question)
    write_db(db)
    return {"status": "success", "message": "Neuron added to question bank"}

@app.post("/api/cms/results")
async def store_result(result: dict):
    """Student quiz result → persisted for teacher AI analytics dashboard."""
    import datetime
    db = read_db()
    if "results" not in db:
        db["results"] = []
    result["submitted_at"] = datetime.datetime.utcnow().isoformat()
    # Run AI gap scoring
    percentage = result.get("score", result.get("percentage", 0))
    look_away = result.get("look_away_count", 0)
    ai_confidence = max(0, percentage - (look_away * 2))  # penalize distractions
    result["ai_integrity_score"] = round(ai_confidence, 1)
    result["ai_flag"] = look_away > 5
    result["ai_comment"] = (
        f"High integrity — {look_away} deviation events." if look_away <= 5
        else f"⚠ Forensic flag: {look_away} gaze deviations. Manual review recommended."
    )
    db["results"].append(result)
    write_db(db)
    return {
        "status": "success",
        "ai_integrity_score": result["ai_integrity_score"],
        "ai_flag": result["ai_flag"],
        "ai_comment": result["ai_comment"],
        "message": "Result transmitted to neural gap detector"
    }

@app.get("/api/teacher/results")
async def get_teacher_results():
    """Teacher fetches all student results with AI analysis — for the teacher dashboard."""
    db = read_db()
    results = db.get("results", [])
    
    # Aggregate analytics
    if results:
        avg_score = sum(r.get("score", r.get("percentage", 0)) for r in results) / len(results)
        flagged = sum(1 for r in results if r.get("ai_flag"))
    else:
        avg_score = 0
        flagged = 0

    return {
        "results": results,
        "summary": {
            "total_submissions": len(results),
            "average_score": round(avg_score, 1),
            "flagged_for_review": flagged,
            "completion_rate": f"{len(results)} submitted"
        }
    }

@app.post("/api/student/generate-plan")
async def generate_plan_for_student(request: dict):
    """
    Teacher-side: generate a 7-Day study plan for a specific student
    by their student_id, weak_topics, look_away_count, and score.
    Called by the teacher results dashboard.
    """
    student_id = request.get("student_id", "unknown")
    weak_topics = request.get("weak_topics", [])
    look_away_count = request.get("look_away_count", 0)
    score = request.get("score", 0)
    student_name = request.get("student_name", "Student")

    # Build quiz_data payload compatible with generate_study_plan_with_groq
    quiz_data = {
        "student_id": student_id,
        "student_name": student_name,
        "weak_topics": weak_topics,
        "look_away_count": look_away_count,
        "score": score,
    }

    plan = logic_ai.generate_study_plan_with_groq(quiz_data)

    # Persist the plan into the matching result record
    db = read_db()
    results = db.get("results", [])
    for res in results:
        if res.get("student_id", "").lower() == str(student_id).lower():
            res["generated_study_plan"] = plan
            break
    write_db(db)

    return {"status": "success", "plan": plan}


@app.post("/api/generate-study-plan")
async def generate_study_plan(request: dict):
    """
    Generates a personalized 7-Day Study Plan for a specific quiz result and student.
    """
    quiz_data = request.get("quiz_data", {})
    student_id = request.get("student_id")
    
    plan = logic_ai.generate_study_plan_with_groq(quiz_data)
    
    # Save the plan to the specific result
    db = read_db()
    results = db.get("results", [])
    
    # Update the result in the database
    updated = False
    for res in results:
        if res.get("student_id") == student_id and res.get("submitted_at") == quiz_data.get("submitted_at"):
            res["generated_study_plan"] = plan
            updated = True
            break
            
    if not updated and len(results) > 0:
        # Fallback: Just update the latest or the one matching student_id
        for res in results:
            if res.get("student_id") == student_id:
                res["generated_study_plan"] = plan
                break

    write_db(db)
    return {"status": "success", "plan": plan}

@app.post("/api/student/study-plan-progress")
async def update_study_plan_progress(request: dict):
    """
    Saves the student's progress and 'finished' state on their study plan.
    """
    student_id = request.get("student_id")
    progress_percent = request.get("progress_percent", 0)
    is_finished = request.get("is_finished", False)
    
    db = read_db()
    results = db.get("results", [])
    
    updated = False
    for res in results:
        if res.get("student_id", "").upper() == str(student_id).upper() and res.get("generated_study_plan"):
            res["generated_study_plan"]["progress_percent"] = progress_percent
            res["generated_study_plan"]["is_finished"] = is_finished
            updated = True
            
    if updated:
        write_db(db)
        return {"status": "success", "message": "Progress synchronized"}
    
    return {"status": "error", "message": "Study plan not found for this student"}

@app.get("/api/student/mastery/{student_id}")
async def get_student_mastery(student_id: str):
    """
    Calculates actual mastery percentage for each topic based on student's performance.
    """
    db = read_db()
    results = [r for r in db.get("results", []) if r.get("student_id") == student_id]
    
    mastery = {} # topic -> {correct, total}
    for res in results:
        for perf in res.get("topic_performance", []):
            topic = perf.get("topic")
            if topic not in mastery:
                mastery[topic] = {"correct": 0, "total": 0}
            mastery[topic]["total"] += 1
            if perf.get("is_correct"):
                mastery[topic]["correct"] += 1
                
    # Convert to percentages
    output = []
    for topic, stats in mastery.items():
        percentage = round((stats["correct"] / stats["total"]) * 100) if stats["total"] > 0 else 0
        output.append({
            "topic": topic,
            "mastery": percentage,
            "total_questions": stats["total"]
        })
        
    return {"mastery": output}


# ── Quiz Assignment & Delivery Pipeline ───────────────────────────────────────

@app.post("/api/teacher/assignments")
async def create_assignment(payload: dict):
    """Teacher assigns a quiz to students/classes with scheduling & proctoring settings."""
    db = read_db()
    import uuid, datetime
    assignment = {
        "id": str(uuid.uuid4()),
        "quiz_id": payload.get("quiz_id"),
        "quiz_title": payload.get("quiz_title", "Untitled"),
        "assigned_to": payload.get("assigned_to", []),   # list of student IDs
        "class_ids": payload.get("class_ids", []),
        "start_time": payload.get("start_time"),
        "due_time": payload.get("due_time"),
        "max_attempts": payload.get("max_attempts", 1),
        "proctoring_mode": payload.get("proctoring_mode", "full"),  # full/light/disabled
        "randomize": payload.get("randomize", True),
        "negative_marking": payload.get("negative_marking", False),
        "auto_release": payload.get("auto_release", "immediately"),
        "instructions": payload.get("instructions", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "status": "active"
    }
    db["assignments"].append(assignment)
    write_db(db)
    return {"status": "success", "assignment_id": assignment["id"], "message": "Neural quiz deployed across student nodes"}

@app.get("/api/teacher/assignments/{quiz_id}/status")
async def get_assignment_status(quiz_id: str):
    """Real-time counters: Assigned / Started / Completed / Not Started."""
    db = read_db()
    assignments = [a for a in db["assignments"] if a.get("quiz_id") == quiz_id]
    attempts = [a for a in db["attempts"] if a.get("quiz_id") == quiz_id]
    
    completed = len([a for a in attempts if a.get("status") == "completed"])
    started = len([a for a in attempts if a.get("status") == "in_progress"])
    total_assigned = sum(len(a.get("assigned_to", [])) for a in assignments)
    
    return {
        "quiz_id": quiz_id,
        "total_assigned": total_assigned,
        "started": started,
        "completed": completed,
        "not_started": max(0, total_assigned - started - completed),
        "avg_score": sum(a.get("score", 0) for a in attempts if a.get("status") == "completed") / max(1, completed)
    }

@app.get("/api/student/assigned-quizzes")
async def get_student_quizzes(student_id: str = "ST_001"):
    """Student fetches their assigned quizzes with status."""
    import datetime
    db = read_db()
    now = datetime.datetime.utcnow().isoformat()
    
    assigned = []
    for assignment in db["assignments"]:
        if student_id in assignment.get("assigned_to", []) or not assignment.get("assigned_to"):
            # Find existing attempt
            attempt = next((a for a in db["attempts"] 
                          if a.get("assignment_id") == assignment["id"] 
                          and a.get("student_id") == student_id), None)
            
            # Find quiz details
            quiz = next((q for q in db["quizzes"] if q.get("id") == assignment["quiz_id"]), {})
            
            status = "not_started"
            if attempt:
                status = attempt.get("status", "not_started")
            
            assigned.append({
                "assignment_id": assignment["id"],
                "quiz_id": assignment.get("quiz_id"),
                "title": assignment.get("quiz_title", quiz.get("title", "Unknown Quiz")),
                "subject": quiz.get("description", ""),
                "due_time": assignment.get("due_time"),
                "start_time": assignment.get("start_time"),
                "duration": quiz.get("duration", 30),
                "total_marks": len(quiz.get("questions", [])) * 5,
                "proctoring_mode": assignment.get("proctoring_mode", "full"),
                "instructions": assignment.get("instructions", ""),
                "status": status,
                "score": attempt.get("score") if attempt else None,
                "attempt_id": attempt.get("id") if attempt else None
            })
    
    upcoming = [q for q in assigned if q["status"] == "not_started" and (q.get("start_time") or '') > now]
    active = [q for q in assigned if q["status"] in ["not_started", "in_progress"]]
    completed = [q for q in assigned if q["status"] == "completed"]
    
    return {"upcoming": upcoming, "active": active, "completed": completed, "all": assigned}

@app.post("/api/student/start-quiz/{assignment_id}")
async def start_quiz(assignment_id: str, body: dict = {}):
    """Student starts a quiz — creates a new attempt record."""
    import uuid, datetime
    db = read_db()
    student_id = body.get("student_id", "ST_001")
    
    assignment = next((a for a in db["assignments"] if a["id"] == assignment_id), None)
    if not assignment:
        # Allow starting any quiz for demo purposes
        assignment = {"id": assignment_id, "quiz_id": assignment_id, "quiz_title": "Demo Quiz"}
    
    attempt = {
        "id": str(uuid.uuid4()),
        "assignment_id": assignment_id,
        "quiz_id": assignment.get("quiz_id"),
        "student_id": student_id,
        "status": "in_progress",
        "started_at": datetime.datetime.utcnow().isoformat(),
        "completed_at": None,
        "answers": {},
        "score": None,
        "telemetry_events": [],
        "look_away_count": 0,
        "behavioral_vector": []
    }
    db["attempts"].append(attempt)
    write_db(db)
    return {"status": "success", "attempt_id": attempt["id"], "quiz": assignment}

@app.post("/api/student/submit-quiz/{attempt_id}")
async def submit_quiz(attempt_id: str, body: dict = {}):
    """Student submits answers + forensic telemetry for gap analysis."""
    import datetime
    db = read_db()
    
    attempt = next((a for a in db["attempts"] if a["id"] == attempt_id), None)
    if not attempt:
        return {"status": "error", "message": "Attempt not found"}
    
    # Archive answers & telemetry
    attempt["answers"] = body.get("answers", {})
    attempt["telemetry_events"] = body.get("telemetry", [])
    attempt["look_away_count"] = body.get("look_away_count", 0)
    attempt["behavioral_vector"] = body.get("behavioral_vector", [])
    attempt["status"] = "completed"
    attempt["completed_at"] = datetime.datetime.utcnow().isoformat()
    
    # Compute score (simple: each correct = 5 pts)
    correct = sum(1 for v in body.get("answers", {}).values() if v == 0)  # placeholder logic
    attempt["score"] = correct * 5
    
    write_db(db)
    
    # Trigger gap analysis feedback
    gap_summary = {
        "student_id": attempt.get("student_id"),
        "look_away_events": attempt["look_away_count"],
        "completion_time": attempt["completed_at"],
        "score": attempt["score"],
        "recommendation": "Focus on Recursion Base Cases. Predicted 15% mastery decay in 48h.",
        "study_plan": ["Review Recursion slides", "Practice 5 DFS problems", "Watch 'Base Case' animation"]
    }
    
    return {"status": "success", "score": attempt["score"], "gap_analysis": gap_summary}

@app.get("/export/report/{student_id}")
async def export_report(student_id: str):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 750, f"Neural Learning Gap Report: {student_id}")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 700, "Generated by AI Co-Pilot - Industry 2026 Level")
    
    # Mock data for report
    c.drawString(100, 650, "Top Weakness: Recursion (Base Case)")
    c.drawString(100, 630, "Predicted Mastery Decay (48h): 15%")
    c.drawString(100, 610, "Engagement Average: 92% (Optimal)")
    
    c.save()
    buffer.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{student_id}.pdf"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
