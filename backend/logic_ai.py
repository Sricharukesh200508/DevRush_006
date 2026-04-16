from datetime import datetime, timedelta
import random
import os
import json
try:
    from groq import Groq
except ImportError:
    Groq = None

def predict_knowledge_decay(student_id: str, topic: str, current_mastery: float):
    """
    Simulates DKT prediction for knowledge decay over the next 48-72 hours.
    In a real scenario, this would use a PyTorch transformer model.
    """
    # Heuristic: Decay is faster for complex topics like Recursion/DP
    decay_rate = 0.15 if topic in ['Recursion', 'Dynamic Programming'] else 0.05
    predicted_mastery_48h = current_mastery * (1 - decay_rate)
    
    return {
        "student_id": student_id,
        "topic": topic,
        "current_mastery": current_mastery,
        "predicted_mastery_48h": round(predicted_mastery_48h, 2),
        "risk_level": "High" if predicted_mastery_48h < 0.5 else "Low"
    }

def generate_remedial_actions(decay_data: dict):
    """
    Suggests exact actions for the Predictive Intervention Engine.
    """
    if decay_data["risk_level"] == "High":
        return {
            "action": "Send micro-remedial",
            "reason": f"Predicted decay below 50% for {decay_data['topic']}",
            "template_id": "ST-001-RECURSION",
            "auto_draft": f"Hey Alex, I noticed you might need a refresher on {decay_data['topic']} before the next session."
        }
    return None

def get_class_anomalies(students_data: list):
    """
    Groups students using simulated embedding clustering.
    Real implementation would use pgvector on multimodal vectors.
    """
    # Group A: High Accuracy but Low Engagement (Possible Boredom)
    # Group B: Low Accuracy and High Engagement (Possible Struggle)
    anomalies = {
        "Group A": [s["id"] for s in students_data if s["accuracy"] > 0.8 and s["engagement"] < 0.4],
        "Group B": [s["id"] for s in students_data if s["accuracy"] < 0.4 and s["engagement"] > 0.7]
    }
    return anomalies

def generate_study_plan_with_groq(quiz_data: dict):
    """
    Calls Groq Llama 3.1 to generate an advanced 7-Day Personalized Learning Study Plan
    based on the student's exact performance, accuracy level, and behavioral signals.
    """
    if not Groq:
        return {"error": "Groq client not installed. Install with `pip install groq`."}

    # Ensure you have GROQ_API_KEY in your .env or fallback
    # For demo without key, we might need a highly realistic mock, but let's try actual Groq
    api_key = os.environ.get("GROQ_API_KEY", "")
    
    # We will build a highly engineered system prompt
    system_prompt = f"""
You are an expert Adaptive Learning Systems Engineer and Cognitive Science Specialist in edtech (2026 standards). You design highly effective personalized remedial study plans based on learning science principles.

Core Principles to Follow Strictly:
- Spaced Repetition: Review weak topics multiple times across the 7 days with increasing intervals.
- Interleaving: Mix related but different topics within the same day/session instead of blocking one topic all day. 
- Progressive Difficulty: Start with foundational review (easy), move to medium application, then hard challenges.
- Retrieval Practice + Active Recall: Every day must include self-testing, explaining concepts in own words, or solving problems without notes.
- Micro-Expression & Behavioral Awareness: If forensic data shows gaze deviations or low integrity on a topic, add extra short breaks, focus techniques, or confidence-building micro-tasks.
- Realistic Workload: 45-75 minutes per day maximum. Include buffer time. One lighter revision day (Day 7). Balance concept review, practice, and application.
- Prioritize weak topics heavily in Days 1-4, interleave with strong topics in Days 4-6.

Return ONLY valid JSON matching exactly this schema, do NOT include markdown block characters:
{{
  "focus_areas": ["topic1", "topic2"],
  "behavioral_insights": "Insight about their gaze/integrity...",
  "predicted_improvement_percent": 20,
  "daily_plans": [
    {{
      "day": 1,
      "theme": "Foundation Reset - Recursion Basics",
      "time_commitment": "50 minutes",
      "blocks": [
        {{ "type": "Concept Review", "duration": "15 mins", "details": "Watch short video...", "resource": "https://youtube.com/..." }},
        {{ "type": "Interleaved Practice", "duration": "20 mins", "details": "Solve 4 easy problems...", "resource": "..." }}
      ],
      "gamification": {{ "badge": "🌱 Growth Seeker", "quote": "Every expert was once a beginner." }}
    }}
  ]
}}

Input Data:
{json.dumps(quiz_data, indent=2)}
"""

    if not api_key or api_key == "demo_key" or api_key.startswith("fallback"):
        # MOCK IMPLEMENTATION if no API key is provided
        # This keeps the hackathon demo working flawlessly even without a key
        import time
        time.sleep(1.5)
        student_name = quiz_data.get("student_name", "Student")
        weak_topics = quiz_data.get("weak_topics", ["Fundamentals"])
        
        return {
            "focus_areas": weak_topics,
            "behavioral_insights": f"Hey {student_name}, we detected {quiz_data.get('look_away_count', 0)} gaze deviations. For this plan, we've structured it into short 15-min bursts (Pomodoro style) to optimize your focus and retention.",
            "predicted_improvement_percent": 18,
            "daily_plans": [
                {
                    "day": 1,
                    "theme": f"Foundation & Remediation: {weak_topics[0] if weak_topics else 'Core Context'}",
                    "time_commitment": "45 mins",
                    "blocks": [
                        { "type": "Concept Review", "duration": "15 mins", "details": f"Watch 3 short micro-videos on {weak_topics[0] if weak_topics else 'fundamentals'}.", "resource": "https://coursera.org" },
                        { "type": "Practice Problems", "duration": "20 mins", "details": "Complete 5 easy-level problems.", "resource": "https://leetcode.com" },
                        { "type": "Self-Test", "duration": "10 mins", "details": "Interactive flashcards review.", "resource": "Internal Neural Tool" }
                    ],
                    "gamification": { "badge": "🌱 Growth Seeker", "quote": "Every expert was once a beginner." }
                },
                {
                    "day": 2,
                    "theme": "Concept Application & Reinforcement",
                    "time_commitment": "50 mins",
                    "blocks": [
                        { "type": "Code Analysis", "duration": "20 mins", "details": "Trace execution of correct algorithms.", "resource": "https://geeksforgeeks.org" },
                        { "type": "Practice Problems", "duration": "30 mins", "details": "Solve 3 medium-level application tasks.", "resource": "https://leetcode.com" }
                    ],
                    "gamification": { "badge": "🔥 Momentum Builder", "quote": "Consistency builds mastery." }
                },
                {
                    "day": 3,
                    "theme": "Advanced Application",
                    "time_commitment": "60 mins",
                    "blocks": [
                        { "type": "Concept Review", "duration": "15 mins", "details": "Deep dive into edge cases.", "resource": "https://youtube.com" },
                        { "type": "Application Challenge", "duration": "45 mins", "details": "Build a mini-project or solve 2 hard problems.", "resource": "https://hackerrank.com" }
                    ],
                    "gamification": { "badge": "⚔️ Warrior Learner", "quote": "Challenges are just puzzles to be solved." }
                },
                {
                    "day": 4,
                    "theme": "Spaced Repetition & Revision",
                    "time_commitment": "30 mins",
                    "blocks": [
                        { "type": "Quick Revision", "duration": "10 mins", "details": "Review notes from Day 1 and 2.", "resource": "Internal Note DB" },
                        { "type": "Practice", "duration": "20 mins", "details": "Mixed difficulty questions.", "resource": "https://leetcode.com" }
                    ],
                    "gamification": { "badge": "🧠 Memory Master", "quote": "Repetition is the mother of learning." }
                },
                {
                    "day": 5,
                    "theme": "Cross-Topic Integration",
                    "time_commitment": "45 mins",
                    "blocks": [
                        { "type": "Concept Review", "duration": "15 mins", "details": "Learn how the weak topics connect to stronger ones.", "resource": "https://coursera.org" },
                        { "type": "Application", "duration": "30 mins", "details": "Solve combined problem types.", "resource": "https://leetcode.com" }
                    ],
                    "gamification": { "badge": "🕸️ Neural Connector", "quote": "See the forest, not just the trees." }
                },
                {
                    "day": 6,
                    "theme": "Pre-Test Synthesis",
                    "time_commitment": "40 mins",
                    "blocks": [
                        { "type": "Practice", "duration": "30 mins", "details": "Time-pressured mock problems.", "resource": "https://leetcode.com" },
                        { "type": "Review", "duration": "10 mins", "details": "Check mistake patterns.", "resource": "Internal Neural Tool" }
                    ],
                    "gamification": { "badge": "⚙️ Optimizer", "quote": "Sharpen your axe before you cut the tree." }
                },
                {
                    "day": 7,
                    "theme": "Final Mock Test & Mastery Demo",
                    "time_commitment": "60 mins",
                    "blocks": [
                        { "type": "Self-Test", "duration": "45 mins", "details": "Full length mock assessment.", "resource": "Internal Assessment Platform" },
                        { "type": "Reflection", "duration": "15 mins", "details": "Review results and update knowledge graph.", "resource": "Internal Neural Tool" }
                    ],
                    "gamification": { "badge": "🏆 Mastery Achieved", "quote": "Trust your training." }
                }
            ]
        }
    
    # Real Groq Implementation
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Fallback to empty if it fails
        return {"error": str(e)}

