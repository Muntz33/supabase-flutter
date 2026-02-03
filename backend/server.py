"""
Dr Ethergreen – YKY Hub Backend
Voice-First Spiritual/Biohacking Oracle
"""
import os
import io
import random
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import base64

from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from jose import jwt, JWTError
import bcrypt

load_dotenv()

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "yky_hub")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
JWT_SECRET = os.environ.get("JWT_SECRET", "yky_dragon_secret")

# MongoDB setup
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
tarot_readings_collection = db["tarot_readings"]
bio_scans_collection = db["bio_scans"]
community_posts_collection = db["community_posts"]
payment_transactions_collection = db["payment_transactions"]
chat_history_collection = db["chat_history"]

# Create indexes
users_collection.create_index("email", unique=True)

# Import integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAITextToSpeech, OpenAISpeechToText
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🐉 Dr Ethergreen – YKY Hub Starting...")
    yield
    print("🌙 Shutting down gracefully...")

app = FastAPI(title="Dr Ethergreen – YKY Hub", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================== MODELS ========================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None
    human_design_type: Optional[str] = None
    gene_keys: Optional[Dict[str, Any]] = None
    numerology: Optional[Dict[str, Any]] = None

class OracleMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class TarotDrawRequest(BaseModel):
    spread_type: str = "single"  # single, three_card, celtic_cross
    question: Optional[str] = None

class BioScanRequest(BaseModel):
    audio_base64: str

class CommunityPost(BaseModel):
    content: str
    category: str = "general"  # general, transit, gate_activation, insight

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

# ======================== AUTH HELPERS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    user = users_collection.find_one({"_id": ObjectId(payload["sub"])}, {"password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return user

# ======================== AUTH ROUTES ========================

@app.post("/api/auth/register")
async def register(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "birth_date": user.birth_date,
        "birth_time": user.birth_time,
        "birth_location": user.birth_location,
        "is_premium": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "human_design_type": None,
        "gene_keys": {},
        "numerology": {},
        "voice_pattern_id": None
    }
    result = users_collection.insert_one(user_doc)
    token = create_token(str(result.inserted_id), user.email)
    return {"token": token, "user": {"id": str(result.inserted_id), "email": user.email, "name": user.name, "is_premium": False}}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(str(user["_id"]), user["email"])
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "is_premium": user.get("is_premium", False)
        }
    }

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ======================== PROFILE ROUTES ========================

@app.put("/api/profile")
async def update_profile(profile: UserProfile, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    users_collection.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    return {"message": "Profile updated", "updated": update_data}

@app.get("/api/profile/soulprint")
async def get_soulprint(user: dict = Depends(get_current_user)):
    """Get the holographic soulprint - fusion of all systems"""
    full_user = users_collection.find_one({"_id": ObjectId(user["id"])}, {"password": 0})
    
    # Calculate numerology from birth date if available
    numerology = full_user.get("numerology", {})
    if full_user.get("birth_date") and not numerology:
        # Simple life path calculation
        date_str = full_user["birth_date"].replace("-", "")
        life_path = sum(int(d) for d in date_str)
        while life_path > 9 and life_path not in [11, 22, 33]:
            life_path = sum(int(d) for d in str(life_path))
        numerology = {"life_path": life_path, "expression": random.randint(1, 9)}
    
    return {
        "name": full_user.get("name"),
        "birth_date": full_user.get("birth_date"),
        "human_design": {
            "type": full_user.get("human_design_type", "Generator"),
            "profile": "3/5",
            "authority": "Sacral",
            "defined_centers": ["Sacral", "Root", "Heart"],
            "open_centers": ["Head", "Ajna", "Throat", "Spleen", "Solar Plexus", "G-Center"]
        },
        "gene_keys": full_user.get("gene_keys", {
            "life_work": {"key": 64, "shadow": "Confusion", "gift": "Imagination", "siddhi": "Illumination"},
            "evolution": {"key": 47, "shadow": "Oppression", "gift": "Transmutation", "siddhi": "Transfiguration"},
            "radiance": {"key": 6, "shadow": "Conflict", "gift": "Diplomacy", "siddhi": "Peace"}
        }),
        "numerology": numerology,
        "bio_markers": {
            "strongest_frequency": "432Hz",
            "weakest_area": "Nervous System",
            "recommended_element": "Water"
        },
        "is_premium": full_user.get("is_premium", False)
    }

# ======================== VOICE ORACLE ROUTES ========================

@app.post("/api/oracle/chat")
async def oracle_chat(message: OracleMessage, user: dict = Depends(get_current_user)):
    """Chat with the Voice AI Oracle"""
    try:
        # Get user's profile for personalization
        full_user = users_collection.find_one({"_id": ObjectId(user["id"])})
        
        system_prompt = f"""You are Dr. Ethergreen, the Voice Oracle of YKY Hub. You speak with a deep, resonant voice 
        with a subtle Kiwi accent inflection. You are mystical yet grounded, combining ancient wisdom with modern biohacking.
        
        User's Profile:
        - Name: {full_user.get('name', 'Seeker')}
        - Human Design Type: {full_user.get('human_design_type', 'Unknown')}
        - Birth Date: {full_user.get('birth_date', 'Unknown')}
        
        Speak in a prophetic but warm manner. Reference cosmic energies, transits, and the user's unique blueprint.
        Keep responses concise but impactful - like whispered prophecies."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"oracle_{user['id']}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)
        
        # Store in chat history
        chat_history_collection.insert_one({
            "user_id": user["id"],
            "user_message": message.message,
            "oracle_response": response,
            "context": message.context,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"response": response, "oracle": "Dr. Ethergreen"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oracle/speak")
async def oracle_speak(message: OracleMessage, user: dict = Depends(get_current_user)):
    """Get Oracle response as audio (TTS)"""
    try:
        # First get text response
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"oracle_{user['id']}",
            system_message="You are Dr. Ethergreen, a mystical oracle. Keep responses under 200 words, prophetic and impactful."
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.message)
        text_response = await chat.send_message(user_msg)
        
        # Convert to speech
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(
            text=text_response,
            model="tts-1-hd",
            voice="onyx",  # Deep, authoritative voice
            speed=0.9
        )
        
        return {
            "text": text_response,
            "audio_base64": audio_base64,
            "format": "mp3"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oracle/listen")
async def oracle_listen(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Transcribe user's voice input (STT)"""
    try:
        audio_content = await file.read()
        audio_file = io.BytesIO(audio_content)
        audio_file.name = file.filename or "audio.webm"
        
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        return {"transcription": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================== TAROT ROUTES ========================

MAJOR_ARCANA = [
    {"id": 0, "name": "The Fool", "meaning": "New beginnings, innocence, spontaneity", "reversed": "Recklessness, taken advantage of"},
    {"id": 1, "name": "The Magician", "meaning": "Manifestation, resourcefulness, power", "reversed": "Manipulation, poor planning"},
    {"id": 2, "name": "The High Priestess", "meaning": "Intuition, sacred knowledge, divine feminine", "reversed": "Secrets, disconnected from intuition"},
    {"id": 3, "name": "The Empress", "meaning": "Fertility, femininity, beauty, nature", "reversed": "Creative block, dependence on others"},
    {"id": 4, "name": "The Emperor", "meaning": "Authority, structure, control, fatherhood", "reversed": "Tyranny, rigidity"},
    {"id": 5, "name": "The Hierophant", "meaning": "Spiritual wisdom, tradition, conformity", "reversed": "Personal beliefs, freedom"},
    {"id": 6, "name": "The Lovers", "meaning": "Love, harmony, relationships, values alignment", "reversed": "Self-love, disharmony"},
    {"id": 7, "name": "The Chariot", "meaning": "Direction, control, willpower, success", "reversed": "Lack of control, aggression"},
    {"id": 8, "name": "Strength", "meaning": "Courage, patience, control, compassion", "reversed": "Self-doubt, weakness"},
    {"id": 9, "name": "The Hermit", "meaning": "Soul-searching, introspection, being alone", "reversed": "Isolation, loneliness"},
    {"id": 10, "name": "Wheel of Fortune", "meaning": "Good luck, karma, life cycles, destiny", "reversed": "Bad luck, resistance to change"},
    {"id": 11, "name": "Justice", "meaning": "Justice, fairness, truth, cause and effect", "reversed": "Unfairness, lack of accountability"},
    {"id": 12, "name": "The Hanged Man", "meaning": "Pause, surrender, letting go, new perspectives", "reversed": "Delays, resistance"},
    {"id": 13, "name": "Death", "meaning": "Endings, change, transformation, transition", "reversed": "Resistance to change, stagnation"},
    {"id": 14, "name": "Temperance", "meaning": "Balance, moderation, patience, purpose", "reversed": "Imbalance, excess"},
    {"id": 15, "name": "The Devil", "meaning": "Shadow self, attachment, addiction, restriction", "reversed": "Releasing limiting beliefs"},
    {"id": 16, "name": "The Tower", "meaning": "Sudden change, upheaval, chaos, revelation", "reversed": "Fear of change, avoiding disaster"},
    {"id": 17, "name": "The Star", "meaning": "Hope, faith, purpose, renewal, spirituality", "reversed": "Lack of faith, despair"},
    {"id": 18, "name": "The Moon", "meaning": "Illusion, fear, anxiety, subconscious", "reversed": "Release of fear, repressed emotion"},
    {"id": 19, "name": "The Sun", "meaning": "Positivity, fun, warmth, success, vitality", "reversed": "Inner child issues, negativity"},
    {"id": 20, "name": "Judgement", "meaning": "Judgement, rebirth, inner calling, absolution", "reversed": "Self-doubt, refusal of self-examination"},
    {"id": 21, "name": "The World", "meaning": "Completion, integration, accomplishment", "reversed": "Seeking closure, short-cuts"}
]

@app.post("/api/tarot/draw")
async def draw_tarot(request: TarotDrawRequest, user: dict = Depends(get_current_user)):
    """Draw tarot cards with hyper-personalized interpretation"""
    full_user = users_collection.find_one({"_id": ObjectId(user["id"])})
    
    # Determine number of cards based on spread
    spread_sizes = {"single": 1, "three_card": 3, "celtic_cross": 10}
    num_cards = spread_sizes.get(request.spread_type, 1)
    
    # Draw cards
    drawn_indices = random.sample(range(len(MAJOR_ARCANA)), num_cards)
    cards = []
    for idx in drawn_indices:
        card = MAJOR_ARCANA[idx].copy()
        card["reversed"] = random.random() < 0.3  # 30% chance reversed
        cards.append(card)
    
    # Generate personalized interpretation using AI
    cards_desc = "\n".join([f"- {c['name']} ({'Reversed' if c['reversed'] else 'Upright'})" for c in cards])
    
    interpretation_prompt = f"""As Dr. Ethergreen, provide a deeply personal tarot reading.

User Question: {request.question or 'General guidance'}
Spread Type: {request.spread_type}
Cards Drawn:
{cards_desc}

User's Profile:
- Human Design: {full_user.get('human_design_type', 'Generator')}
- Life Path Number: {full_user.get('numerology', {}).get('life_path', 7)}
- Birth Date: {full_user.get('birth_date', 'Unknown')}

Provide a prophetic, personalized reading that connects the cards to their unique blueprint. 
Be specific, mystical, and impactful. Reference their Human Design and numerology where relevant."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tarot_{user['id']}_{datetime.now().timestamp()}",
            system_message="You are Dr. Ethergreen, master tarot reader of YKY Hub."
        ).with_model("openai", "gpt-5.2")
        
        interpretation = await chat.send_message(UserMessage(text=interpretation_prompt))
    except Exception:
        interpretation = "The cards speak of transformation and new beginnings. Trust in your journey."
    
    # Store reading
    reading = {
        "user_id": user["id"],
        "spread_type": request.spread_type,
        "question": request.question,
        "cards": cards,
        "interpretation": interpretation,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = tarot_readings_collection.insert_one(reading)
    reading["id"] = str(result.inserted_id)
    del reading["_id"] if "_id" in reading else None
    
    return reading

@app.get("/api/tarot/history")
async def get_tarot_history(user: dict = Depends(get_current_user)):
    """Get user's tarot reading history"""
    readings = list(tarot_readings_collection.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20))
    return {"readings": readings}

# ======================== BIO-RESONANCE ROUTES ========================

@app.post("/api/bio/scan")
async def bio_resonance_scan(request: BioScanRequest, user: dict = Depends(get_current_user)):
    """Analyze voice for bio-resonance frequencies"""
    try:
        # Decode audio
        audio_bytes = base64.b64decode(request.audio_base64)
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "voice_scan.webm"
        
        # Transcribe to analyze speech patterns
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        transcription = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        # AI analysis of voice patterns
        analysis_prompt = f"""Analyze this voice sample transcription for bio-resonance indicators.
        
Transcription: {transcription.text}

As Dr. Ethergreen, provide:
1. Dominant frequency assessment (estimate Hz range)
2. Weakest chakra/energy center
3. Recommended remedy (one each from: food, herb, frequency, practice)
4. Overall vitality score (1-10)

Be specific and mystical. This is voice-based biofeedback analysis."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"bio_{user['id']}",
            system_message="You are Dr. Ethergreen's bio-resonance analysis module."
        ).with_model("openai", "gpt-5.2")
        
        analysis = await chat.send_message(UserMessage(text=analysis_prompt))
        
        # Create scan result
        scan_result = {
            "user_id": user["id"],
            "transcription": transcription.text,
            "analysis": analysis,
            "frequencies": {
                "dominant": f"{random.randint(380, 480)}Hz",
                "weakest": f"{random.randint(200, 350)}Hz"
            },
            "recommendations": {
                "food": random.choice(["Leafy greens", "Berries", "Wild salmon", "Turmeric"]),
                "herb": random.choice(["Ashwagandha", "Rhodiola", "Lion's Mane", "Reishi"]),
                "frequency": f"{random.choice([396, 417, 528, 639, 741, 852])}Hz",
                "peptide": random.choice(["BPC-157", "Epithalon", "Semax", "Selank"])
            },
            "vitality_score": random.randint(6, 9),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        bio_scans_collection.insert_one(scan_result.copy())
        del scan_result["_id"] if "_id" in scan_result else None
        
        return scan_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================== COMMUNITY ROUTES ========================

@app.post("/api/community/post")
async def create_post(post: CommunityPost, user: dict = Depends(get_current_user)):
    """Create a community post"""
    post_doc = {
        "user_id": user["id"],
        "user_name": user.get("name", "Anonymous Seeker"),
        "content": post.content,
        "category": post.category,
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = community_posts_collection.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    del post_doc["_id"]
    return post_doc

@app.get("/api/community/feed")
async def get_feed(category: str = "all", limit: int = 20):
    """Get community feed"""
    query = {} if category == "all" else {"category": category}
    posts = list(community_posts_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(limit))
    return {"posts": posts}

# ======================== PAYMENT ROUTES ========================

SUBSCRIPTION_PACKAGES = {
    "premium_monthly": {"amount": 19.99, "name": "Premium Monthly", "description": "Unlimited tarot, voice meditations, AI coaching"}
}

@app.post("/api/payments/checkout")
async def create_checkout(request: CheckoutRequest, http_request: Request, user: dict = Depends(get_current_user)):
    """Create Stripe checkout session for premium subscription"""
    if request.package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = SUBSCRIPTION_PACKAGES[request.package_id]
    
    success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/payment/cancel"
    
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=package["amount"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["id"], "package_id": request.package_id}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_transactions_collection.insert_one({
        "user_id": user["id"],
        "session_id": session.session_id,
        "package_id": request.package_id,
        "amount": package["amount"],
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request, user: dict = Depends(get_current_user)):
    """Check payment status and update user subscription"""
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        transaction = payment_transactions_collection.find_one({"session_id": session_id})
        if transaction and transaction.get("payment_status") != "paid":
            payment_transactions_collection.update_one(
                {"session_id": session_id},
                {"$set": {"status": status.status, "payment_status": status.payment_status}}
            )
            
            # If paid, upgrade user to premium
            if status.payment_status == "paid":
                users_collection.update_one(
                    {"_id": ObjectId(user["id"])},
                    {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            user_id = event.metadata.get("user_id")
            if user_id:
                users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"is_premium": True}}
                )
                payment_transactions_collection.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}}
                )
        
        return {"received": True}
    except Exception as e:
        return {"error": str(e)}

# ======================== DATABASE ROUTES ========================

@app.get("/api/database/search")
async def search_database(query: str, category: str = "all"):
    """Search the massive database (peptides, herbs, frequencies, etc.)"""
    # Sample database entries
    database = {
        "peptides": [
            {"name": "BPC-157", "category": "healing", "description": "Body Protection Compound, gut healing, tissue repair", "frequency": "528Hz"},
            {"name": "Epithalon", "category": "longevity", "description": "Telomerase activator, anti-aging peptide", "frequency": "741Hz"},
            {"name": "Semax", "category": "cognitive", "description": "Nootropic peptide, BDNF enhancer", "frequency": "639Hz"},
            {"name": "TB-500", "category": "healing", "description": "Thymosin Beta-4, wound healing, flexibility", "frequency": "417Hz"}
        ],
        "herbs": [
            {"name": "Ashwagandha", "category": "adaptogen", "description": "Stress reduction, cortisol balance", "element": "Earth"},
            {"name": "Lion's Mane", "category": "cognitive", "description": "NGF support, brain regeneration", "element": "Air"},
            {"name": "Reishi", "category": "immune", "description": "Immune modulation, spirit calming", "element": "Water"},
            {"name": "Rhodiola", "category": "energy", "description": "Energy, endurance, altitude adaptation", "element": "Fire"}
        ],
        "frequencies": [
            {"hz": 396, "name": "Liberation", "description": "Liberating guilt and fear"},
            {"hz": 417, "name": "Change", "description": "Undoing situations and facilitating change"},
            {"hz": 528, "name": "Transformation", "description": "Transformation and miracles, DNA repair"},
            {"hz": 639, "name": "Connection", "description": "Connecting relationships"},
            {"hz": 741, "name": "Awakening", "description": "Awakening intuition"},
            {"hz": 852, "name": "Spiritual", "description": "Returning to spiritual order"}
        ]
    }
    
    results = []
    search_lower = query.lower()
    
    for cat, items in database.items():
        if category != "all" and cat != category:
            continue
        for item in items:
            if search_lower in item.get("name", "").lower() or search_lower in item.get("description", "").lower():
                results.append({**item, "type": cat})
    
    return {"results": results, "total": len(results)}

# ======================== HEALTH CHECK ========================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Dr Ethergreen – YKY Hub", "version": "1.0.0"}
