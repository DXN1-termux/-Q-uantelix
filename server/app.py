#!/usr/bin/env python3
"""
[Q]uantelix — Flask Backend
Lightweight server for Termux and standalone deployment.
"""

import os
import sys
import json
import socket
import subprocess
import sqlite3
import time
from pathlib import Path
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="../web/.next/static", static_url_path="/static")
CORS(app)

DB_DIR = Path.home() / ".quantelix"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "context.db"


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            strength REAL DEFAULT 1.0,
            importance REAL DEFAULT 0.5,
            access_count INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            last_accessed INTEGER NOT NULL,
            source TEXT DEFAULT 'assistant',
            conversation_id TEXT,
            session_id TEXT,
            parent_id TEXT,
            related_ids TEXT DEFAULT '[]'
        );
        CREATE TABLE IF NOT EXISTS context_chunks (
            id TEXT PRIMARY KEY,
            memory_id TEXT,
            chunk_text TEXT NOT NULL,
            token_count INTEGER NOT NULL DEFAULT 0,
            tier TEXT NOT NULL DEFAULT 'hot',
            created_at INTEGER NOT NULL,
            compressed INTEGER DEFAULT 0,
            summary TEXT
        );
        CREATE TABLE IF NOT EXISTS sort_weights (
            dimension TEXT PRIMARY KEY,
            weight REAL NOT NULL
        );
    """)
    conn.commit()
    conn.close()


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "version": "0.1.0",
        "name": "[Q]uantelix",
        "port": request.host,
        "db_path": str(DB_PATH),
    })


@app.route("/api/port/check")
def check_port():
    port = request.args.get("port", 3000, type=int)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            available = s.connect_ex(("0.0.0.0", port)) != 0
            return jsonify({"port": port, "available": available})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/port/find")
def find_port():
    start = request.args.get("start", 3000, type=int)
    end = request.args.get("end", 8099, type=int)
    for port in range(start, end + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                if s.connect_ex(("0.0.0.0", port)) != 0:
                    return jsonify({"port": port, "range": f"{start}-{end}"})
        except Exception:
            continue
    return jsonify({"port": -1, "range": f"{start}-{end}", "error": "no port available"})


@app.route("/api/memory/stats")
def memory_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    by_type = {}
    for row in conn.execute("SELECT type, COUNT(*) as cnt, AVG(strength) as avg_s FROM memories GROUP BY type"):
        by_type[row[0]] = {"count": row[1], "avg_strength": round(row[2] or 0, 3)}
    tokens = conn.execute("SELECT COALESCE(SUM(token_count), 0) FROM context_chunks").fetchone()[0]
    conn.close()
    return jsonify({"total": total, "by_type": by_type, "virtual_tokens": tokens})


@app.route("/api/memory/search")
def memory_search():
    q = request.args.get("q", "")
    limit = request.args.get("limit", 20, type=int)
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM memories WHERE content LIKE ? ORDER BY strength DESC, created_at DESC LIMIT ?",
        (f"%{q}%", limit)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "message required"}), 400

    def generate():
        # Store user message
        conn = get_db()
        mem_id = f"msg_{int(time.time() * 1000)}"
        conn.execute(
            "INSERT INTO memories (id, type, content, created_at, last_accessed, source) VALUES (?, 'episodic', ?, ?, ?, 'user')",
            (mem_id, message, int(time.time() * 1000), int(time.time() * 1000))
        )
        conn.commit()
        conn.close()

        # Simulate response (in production, calls the agent engine)
        response = f"[Q]uantelix received: {message}\n\nThis is the Flask backend. The full agent engine runs via the Node.js app."
        for char in response:
            yield f"data: {json.dumps({'token': char})}\n\n"
            time.sleep(0.01)
        yield f"data: {json.dumps({'done': True})}\n\n"

    return Response(generate(), mimetype="text/event-stream")


@app.route("/")
def index():
    web_dir = Path(__file__).parent.parent / "web"
    if (web_dir / ".next" / "server").exists():
        return send_from_directory(str(web_dir / ".next" / "server"), "index.html")
    return jsonify({"message": "[Q]uantelix Flask backend running", "web_ui": "Build Next.js app first"})


init_db()

if __name__ == "__main__":
    import socket
    port = 3000
    # Auto-find port if default is taken
    for p in range(3000, 8099):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                if s.connect_ex(("0.0.0.0", p)) != 0:
                    port = p
                    break
        except Exception:
            continue

    print(f"""
  ___   _   _  ___ _   _ ___ _   _ ___ 
 / _ \\ | | | |/ __| | | | _ \\ | | |_ _|
| (_) || |_| | (__| |_| |  _/ |_| || | 
 \\__\\_\\ \\___/ \\___|\\___/|_|  \\___/|___|
  AGENTIC AI. INTELLIGENCE THAT ACTS.

  Flask server running on http://0.0.0.0:{port}
  Database: {DB_PATH}
    """)
    app.run(host="0.0.0.0", port=port, debug=False)
