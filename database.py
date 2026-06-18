"""
Masal Makinesi – SQLite Veritabanı Yönetimi
Masal arşivi, takma adlar ve konu verileri için CRUD işlemleri.
"""

import sqlite3
import json
import os
from datetime import datetime


# Vercel ortamını kontrol et (Vercel'de disk salt okunur olduğu için veritabanını /tmp altında oluşturmalıyız)
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/masal_arsiv.db"
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "masal_arsiv.db")


def get_connection():
    """Veritabanı bağlantısı oluşturur."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Veritabanı tablolarını oluşturur."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_name TEXT NOT NULL,
            age_group TEXT NOT NULL,
            characters TEXT NOT NULL,
            story_text TEXT NOT NULL,
            questions_json TEXT NOT NULL,
            is_favorite INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nicknames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# ──────────────────────────────────────
# Masal (Story) İşlemleri
# ──────────────────────────────────────

def save_story(title, topic_id, topic_name, age_group, characters, story_text, questions):
    """Yeni bir masalı arşive kaydeder."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO stories (title, topic_id, topic_name, age_group, characters, story_text, questions_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        topic_id,
        topic_name,
        age_group,
        json.dumps(characters, ensure_ascii=False),
        story_text,
        json.dumps(questions, ensure_ascii=False),
        datetime.now().isoformat()
    ))
    story_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return story_id


def get_all_stories():
    """Tüm masalları listeler (en yeniler önce)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stories ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_story_by_id(story_id):
    """Belirli bir masalı getirir."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        story = dict(row)
        story["characters"] = json.loads(story["characters"])
        story["questions_json"] = json.loads(story["questions_json"])
        return story
    return None


def delete_story(story_id):
    """Masalı arşivden siler."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stories WHERE id = ?", (story_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def toggle_favorite(story_id):
    """Masalın favori durumunu değiştirir."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_favorite FROM stories WHERE id = ?", (story_id,))
    row = cursor.fetchone()
    if row:
        new_status = 0 if row["is_favorite"] else 1
        cursor.execute("UPDATE stories SET is_favorite = ? WHERE id = ?", (new_status, story_id))
        conn.commit()
        conn.close()
        return new_status
    conn.close()
    return None


# ──────────────────────────────────────
# Takma Ad İşlemleri
# ──────────────────────────────────────

def save_nickname(name):
    """Takma ad havuzuna yeni ad ekler."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO nicknames (name, created_at)
            VALUES (?, ?)
        """, (name.strip(), datetime.now().isoformat()))
        conn.commit()
        nickname_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        nickname_id = None
    conn.close()
    return nickname_id


def get_all_nicknames():
    """Tüm takma adları listeler."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM nicknames ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_nickname(nickname_id):
    """Takma adı siler."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM nicknames WHERE id = ?", (nickname_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# Uygulama başladığında tabloları oluştur
init_db()
