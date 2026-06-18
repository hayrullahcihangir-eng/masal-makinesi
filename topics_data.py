"""
Masal Makinesi – Konu-Kazanım Eşleme Tablosu
Her konu için ikon, açıklama ve eğitici kazanımlar tanımlanır.
"""

TOPICS = [
    {
        "id": "geri-donusum",
        "name": "Geri Dönüşüm",
        "icon": "♻️",
        "description": "Çevreyi korumak ve atıkları geri kazanmak",
        "learning_outcomes": [
            "Geri dönüşümün doğaya katkısını açıklar.",
            "Atıkları doğru kutuya ayırmayı bilir.",
            "Çevre temizliğine karşı sorumluluk geliştirir."
        ]
    },
    {
        "id": "arkadaslik",
        "name": "Arkadaşlık",
        "icon": "🤝",
        "description": "Dostluk, paylaşma ve birlikte olmanın önemi",
        "learning_outcomes": [
            "Arkadaşlık değerinin önemini kavrar.",
            "Empati kurma becerisi geliştirir.",
            "Farklılıklara saygı göstermeyi öğrenir."
        ]
    },
    {
        "id": "disler",
        "name": "Diş Sağlığı",
        "icon": "🦷",
        "description": "Dişlerin önemi ve doğru diş fırçalama",
        "learning_outcomes": [
            "Diş fırçalama alışkanlığı kazanır.",
            "Sağlıklı dişler için doğru beslenmeyi öğrenir.",
            "Diş hekimine gitmenin önemini bilir."
        ]
    },
    {
        "id": "temizlik",
        "name": "Temizlik ve Hijyen",
        "icon": "🧼",
        "description": "Kişisel temizlik ve hijyen kuralları",
        "learning_outcomes": [
            "El yıkama alışkanlığı kazanır.",
            "Kişisel bakımın önemini kavrar.",
            "Temiz bir çevre oluşturmaya katkıda bulunur."
        ]
    },
    {
        "id": "paylasim",
        "name": "Paylaşım",
        "icon": "🎁",
        "description": "Paylaşmanın mutluluğu ve yardımlaşma",
        "learning_outcomes": [
            "Paylaşmanın güzelliğini deneyimler.",
            "Yardımlaşmanın toplumsal değerini anlar.",
            "Cömertlik erdemini geliştirir."
        ]
    },
    {
        "id": "doga-sevgisi",
        "name": "Doğa Sevgisi",
        "icon": "🌿",
        "description": "Doğayı tanıma, koruma ve sevme",
        "learning_outcomes": [
            "Doğadaki canlıları tanır ve sever.",
            "Çevre bilinci geliştirir.",
            "Ağaç dikmenin ve yeşili korumanın önemini bilir."
        ]
    },
    {
        "id": "trafik-kurallari",
        "name": "Trafik Kuralları",
        "icon": "🚦",
        "description": "Güvenli yolculuk ve trafik işaretleri",
        "learning_outcomes": [
            "Temel trafik kurallarını bilir.",
            "Yaya geçidini kullanmayı öğrenir.",
            "Emniyet kemerinin önemini kavrar."
        ]
    },
    {
        "id": "saglikli-beslenme",
        "name": "Sağlıklı Beslenme",
        "icon": "🥗",
        "description": "Dengeli beslenme ve sağlıklı yiyecekler",
        "learning_outcomes": [
            "Sağlıklı ve zararlı besinleri ayırt eder.",
            "Düzenli beslenme alışkanlığı kazanır.",
            "Su içmenin önemini kavrar."
        ]
    },
    {
        "id": "kitap-okuma",
        "name": "Kitap Okuma",
        "icon": "📖",
        "description": "Okuma sevgisi ve kitapların büyülü dünyası",
        "learning_outcomes": [
            "Okuma alışkanlığı geliştirir.",
            "Hayal gücünü zenginleştirir.",
            "Kütüphane kullanmayı öğrenir."
        ]
    },
    {
        "id": "hayvan-sevgisi",
        "name": "Hayvan Sevgisi",
        "icon": "🐾",
        "description": "Hayvanları tanıma, sevme ve koruma",
        "learning_outcomes": [
            "Hayvanlara karşı sevgi ve şefkat geliştirir.",
            "Evcil hayvan bakımını öğrenir.",
            "Hayvan haklarına saygı gösterir."
        ]
    },
    {
        "id": "mevsimler",
        "name": "Mevsimler",
        "icon": "🍂",
        "description": "Dört mevsim ve doğadaki değişimler",
        "learning_outcomes": [
            "Dört mevsimi ve özelliklerini bilir.",
            "Mevsimlere göre giyinmeyi öğrenir.",
            "Doğadaki değişimleri gözlemler."
        ]
    },
    {
        "id": "su-tasarrufu",
        "name": "Su Tasarrufu",
        "icon": "💧",
        "description": "Suyun önemi ve tasarruflu kullanımı",
        "learning_outcomes": [
            "Suyun yaşam için önemini kavrar.",
            "Su tasarrufu yöntemlerini uygular.",
            "Su kirliliğinin zararlarını bilir."
        ]
    }
]

# Yaş grubu tanımlamaları
AGE_GROUPS = [
    {
        "id": "okul-oncesi",
        "name": "Okul Öncesi (4-6 yaş)",
        "min_age": 4,
        "max_age": 6,
        "word_range": "150-250",
        "language_level": "Çok basit cümleler, tekrarlar, ses taklitleri"
    },
    {
        "id": "ilkokul",
        "name": "İlkokul (6-10 yaş)",
        "min_age": 6,
        "max_age": 10,
        "word_range": "300-500",
        "language_level": "Basit ama zengin cümleler, diyaloglar, betimlemeler"
    },
    {
        "id": "ortaokul",
        "name": "Ortaokul (10-14 yaş)",
        "min_age": 10,
        "max_age": 14,
        "word_range": "400-600",
        "language_level": "Daha karmaşık cümleler, metaforlar, düşündürücü temalar"
    }
]


def get_topic_by_id(topic_id: str) -> dict | None:
    """Verilen ID'ye göre konu bilgisini döndürür."""
    for topic in TOPICS:
        if topic["id"] == topic_id:
            return topic
    return None


def get_age_group_by_id(age_group_id: str) -> dict | None:
    """Verilen ID'ye göre yaş grubu bilgisini döndürür."""
    for age_group in AGE_GROUPS:
        if age_group["id"] == age_group_id:
            return age_group
    return None
