"""
Masal Makinesi – Flask Web Sunucusu
Gemini API ile masal üretimi, arşivleme ve API endpoint'leri.
"""

import os
import json
import re
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai

import database as db
from topics_data import TOPICS, AGE_GROUPS, get_topic_by_id, get_age_group_by_id

# .env dosyasından API anahtarını yükle
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")

MODEL_NAME = "gemini-2.5-flash"


def build_story_prompt(topic, age_group, characters):
    """Gemini'ye gönderilecek masal talimatını oluşturur."""
    character_list = ", ".join(characters)
    outcomes = "\n".join(f"  - {o}" for o in topic["learning_outcomes"])

    prompt = f"""Sen çocuklar için eğitici ve büyüleyici masallar yazan yaratıcı bir yazarsın. Türkçe yazıyorsun.

GÖREV: "{topic['name']}" konusunda {age_group['name']} yaş grubuna uygun bir masal yaz.

KAHRAMANLAR: {character_list}

KAZANIMLAR:
{outcomes}

KURALLAR:
1. Masal {age_group['word_range']} kelime arasında olmalı.
2. Tüm kahramanlar ({character_list}) masalda aktif rol almalı ve isimleri sık geçmeli.
3. Eğitici mesaj doğal ve eğlenceli şekilde verilmeli, öğüt havası olmamalı.
4. {age_group['language_level']}.
5. Masal "Bir varmış bir yokmuş" ile başlamalı.
6. Masalın sonunda "ve o günden sonra..." gibi güzel bir kapanış olmalı.
7. Masala yaratıcı ve ilgi çekici bir başlık ver.
8. Masalda diyaloglar, betimlemeler ve duygusal anlar olsun.

ÇIKTI FORMATI:
Yanıtını kesinlikle aşağıdaki JSON formatında döndür. Başka hiçbir metin ekleme, sadece JSON döndür:

{{
  "title": "Masalın Başlığı",
  "story": "Masalın tam metni burada...",
  "questions": [
    {{
      "question": "Birinci soru metni?",
      "options": ["A) Şık 1", "B) Şık 2", "C) Şık 3", "D) Şık 4"],
      "correct": 0
    }},
    {{
      "question": "İkinci soru metni?",
      "options": ["A) Şık 1", "B) Şık 2", "C) Şık 3", "D) Şık 4"],
      "correct": 1
    }},
    {{
      "question": "Üçüncü soru metni?",
      "options": ["A) Şık 1", "B) Şık 2", "C) Şık 3", "D) Şık 4"],
      "correct": 2
    }}
  ]
}}

"correct" alanı doğru cevabın 0'dan başlayan indeksidir (0=A, 1=B, 2=C, 3=D).
Sorular masalın içeriğiyle doğrudan ilgili olmalı ve yaş grubuna uygun zorlukta olmalı.
"""
    return prompt


def parse_gemini_response(response_text):
    """Gemini yanıtından JSON verisini çıkarır."""
    # Markdown code block içindeki JSON'u çıkar
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', response_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1).strip()
    else:
        # Doğrudan JSON olabilir
        json_str = response_text.strip()

    try:
        data = json.loads(json_str)
        return data
    except json.JSONDecodeError:
        # Son çare: ilk { ve son } arasını al
        start = response_text.find('{')
        end = response_text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(response_text[start:end + 1])
            except json.JSONDecodeError:
                pass
        return None


# ──────────────────────────────────────
# Route'lar
# ──────────────────────────────────────

@app.route("/")
def index():
    """Ana sayfayı sunar."""
    return send_from_directory("static", "index.html")


@app.route("/api/topics", methods=["GET"])
def get_topics():
    """Konu listesini döndürür."""
    return jsonify({"topics": TOPICS, "age_groups": AGE_GROUPS})


@app.route("/api/generate-story", methods=["POST"])
def generate_story():
    """Gemini ile masal üretir."""
    # API key'i header'dan al veya fallback olarak env'den al
    api_key = request.headers.get("X-API-Key") or os.getenv("GEMINI_API_KEY")

    if not api_key:
        return jsonify({"error": "Gemini API anahtarı bulunamadı. Lütfen Ayarlar sekmesinden API anahtarınızı girin."}), 400

    data = request.get_json()
    topic_id = data.get("topic_id")
    age_group_id = data.get("age_group_id", "ilkokul")
    characters = data.get("characters", [])

    if not topic_id:
        return jsonify({"error": "Konu seçilmedi."}), 400
    if not characters or len(characters) == 0:
        return jsonify({"error": "En az bir kahraman adı girilmeli."}), 400

    topic = get_topic_by_id(topic_id)
    if not topic:
        return jsonify({"error": "Geçersiz konu."}), 400

    age_group = get_age_group_by_id(age_group_id)
    if not age_group:
        return jsonify({"error": "Geçersiz yaş grubu."}), 400

    prompt = build_story_prompt(topic, age_group, characters)

    try:
        # İstek bazlı geçici client oluştur
        client = genai.Client(api_key=api_key)

        config = genai.types.GenerateContentConfig(
            temperature=0.9,
            top_p=0.95,
            response_mime_type="application/json"
        )
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=config
        )

        result = parse_gemini_response(response.text)

        if not result:
            return jsonify({"error": "Masal oluşturulamadı. Lütfen tekrar deneyin."}), 500

        return jsonify({
            "title": result.get("title", "Adsız Masal"),
            "story": result.get("story", ""),
            "questions": result.get("questions", []),
            "topic": topic,
            "age_group": age_group,
            "characters": characters
        })

    except Exception as e:
        error_msg = str(e)
        app.logger.error(f"Generate story error: {error_msg}")
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return jsonify({"error": "API kota sınırına ulaşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin."}), 429
        return jsonify({"error": f"Masal üretilirken hata oluştu: {error_msg}"}), 500


@app.route("/api/archive", methods=["POST"])
def archive_story():
    """Masalı arşive kaydeder."""
    data = request.get_json()
    story_id = db.save_story(
        title=data.get("title", "Adsız Masal"),
        topic_id=data.get("topic_id", ""),
        topic_name=data.get("topic_name", ""),
        age_group=data.get("age_group", ""),
        characters=data.get("characters", []),
        story_text=data.get("story_text", ""),
        questions=data.get("questions", [])
    )
    return jsonify({"id": story_id, "message": "Masal arşive kaydedildi! 📚"})


@app.route("/api/archive", methods=["GET"])
def get_archive():
    """Arşivlenmiş masalları listeler."""
    stories = db.get_all_stories()
    for story in stories:
        story["characters"] = json.loads(story["characters"]) if isinstance(story["characters"], str) else story["characters"]
        story["questions_json"] = json.loads(story["questions_json"]) if isinstance(story["questions_json"], str) else story["questions_json"]
    return jsonify({"stories": stories})


@app.route("/api/archive/<int:story_id>", methods=["GET"])
def get_story(story_id):
    """Tekil masal detayını getirir."""
    story = db.get_story_by_id(story_id)
    if story:
        return jsonify(story)
    return jsonify({"error": "Masal bulunamadı."}), 404


@app.route("/api/archive/<int:story_id>", methods=["DELETE"])
def remove_story(story_id):
    """Masalı arşivden siler."""
    if db.delete_story(story_id):
        return jsonify({"message": "Masal silindi."})
    return jsonify({"error": "Masal bulunamadı."}), 404


@app.route("/api/archive/<int:story_id>/favorite", methods=["POST"])
def favorite_story(story_id):
    """Masalın favori durumunu değiştirir."""
    new_status = db.toggle_favorite(story_id)
    if new_status is not None:
        return jsonify({"is_favorite": new_status})
    return jsonify({"error": "Masal bulunamadı."}), 404


@app.route("/api/nicknames", methods=["GET"])
def get_nicknames():
    """Takma ad havuzunu döndürür."""
    nicknames = db.get_all_nicknames()
    return jsonify({"nicknames": nicknames})


@app.route("/api/nicknames", methods=["POST"])
def add_nickname():
    """Takma ad havuzuna yeni ad ekler."""
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Ad boş olamaz."}), 400
    nickname_id = db.save_nickname(name)
    if nickname_id:
        return jsonify({"id": nickname_id, "name": name})
    return jsonify({"error": "Bu ad zaten mevcut."}), 409


@app.route("/api/nicknames/<int:nickname_id>", methods=["DELETE"])
def remove_nickname(nickname_id):
    """Takma adı siler."""
    if db.delete_nickname(nickname_id):
        return jsonify({"message": "Ad silindi."})
    return jsonify({"error": "Ad bulunamadı."}), 404


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    print("\n Masal Makinesi basliyor...")
    print(" http://localhost:5000 adresinden erisebilirsiniz.\n")
    app.run(debug=True, host="0.0.0.0", port=5000)

