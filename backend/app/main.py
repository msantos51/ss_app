# main.py - aplicação FastAPI com rotas principais e PATCH otimizado

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app import models, schemas
import stripe
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, get_db
import os
import shutil
from uuid import uuid4
import time
import json
import base64
import hmac
import hashlib

# Diretório para guardar fotos de perfil
PROFILE_PHOTO_DIR = "profile_photos"
os.makedirs(PROFILE_PHOTO_DIR, exist_ok=True)

# Inicializar app
app = FastAPI()

# Habilitar CORS (permitir acesso do frontend)
origins = ["*"]  # Em produção, usar domínios específicos
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar rota para servir fotos publicamente
app.mount("/profile_photos", StaticFiles(directory=PROFILE_PHOTO_DIR), name="profile_photos")

# Criar as tabelas na base de dados
models.Base.metadata.create_all(bind=engine)

# Contexto para hash de password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuração do Stripe
stripe.api_key = os.getenv("STRIPE_API_KEY", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
SUCCESS_URL = os.getenv("SUCCESS_URL", "https://example.com/success")
CANCEL_URL = os.getenv("CANCEL_URL", "https://example.com/cancel")

# Gerenciador de WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            await connection.send_json(message)

manager = ConnectionManager()

# --------------------------
# Autenticação JWT simples
# --------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "secret")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def _b64(data: dict | bytes) -> str:
    if isinstance(data, dict):
        data = json.dumps(data, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64decode(segment: str) -> bytes:
    padded = segment + "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(padded)

def create_access_token(payload: dict, expires_sec: int = 3600) -> str:
    data = payload.copy()
    data["exp"] = int(time.time()) + expires_sec
    header = {"alg": "HS256", "typ": "JWT"}
    segments = [_b64(header), _b64(data)]
    signing_input = ".".join(segments)
    sig = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    segments.append(_b64(sig))
    return ".".join(segments)

def decode_token(token: str) -> dict:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}"
        expected = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64decode(sig_b64)):
            raise HTTPException(status_code=401, detail="Invalid token signature")
        payload = json.loads(_b64decode(payload_b64))
        if payload.get("exp", 0) < int(time.time()):
            raise HTTPException(status_code=401, detail="Token expired")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_vendor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    vendor_id = payload.get("sub")
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=401, detail="Vendor not found")
    return vendor

# --------------------------
# Sessão de base de dados (mantemos o get_db antigo, mas agora já está importado corretamente também)
# --------------------------
def get_db_local():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------
# Login do vendedor
# --------------------------
@app.post("/login", response_model=schemas.VendorOut)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.email == credentials.email).first()
    if not vendor or not pwd_context.verify(credentials.password, vendor.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return vendor

# --------------------------
# Endpoint para obter JWT
# --------------------------
@app.post("/token")
def generate_token(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.email == credentials.email).first()
    if not vendor or not pwd_context.verify(credentials.password, vendor.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": vendor.id})
    return {"access_token": token, "token_type": "bearer"}

# --------------------------
# Registo de vendedor
# --------------------------
@app.post("/vendors/", response_model=schemas.VendorOut)
async def create_vendor(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    product: str = Form(...),
    profile_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.email == email).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(password)

    ext = os.path.splitext(profile_photo.filename)[1]
    file_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(PROFILE_PHOTO_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(profile_photo.file, buffer)

    public_path = f"profile_photos/{file_name}"

    new_vendor = models.Vendor(
        name=name,
        email=email,
        hashed_password=hashed_password,
        product=product,
        profile_photo=public_path,
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

# --------------------------
# Listar vendedores
# --------------------------
@app.get("/vendors/", response_model=list[schemas.VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).all()
    for v in vendors:
        if v.reviews:
            v.rating_average = sum(r.rating for r in v.reviews) / len(v.reviews)
        else:
            v.rating_average = None
    return vendors

# --------------------------
# Atualizar perfil do vendedor (agora com PATCH)
# --------------------------
@app.patch("/vendors/{vendor_id}/profile", response_model=schemas.VendorOut)
async def update_vendor_profile(
    vendor_id: int,
    name: str = Form(None),
    email: str = Form(None),
    password: str = Form(None),
    product: str = Form(None),
    profile_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_vendor: models.Vendor = Depends(get_current_vendor),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if current_vendor.id != vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if name:
        vendor.name = name
    if email:
        vendor.email = email
    if password:
        vendor.hashed_password = pwd_context.hash(password)
    if product:
        vendor.product = product
    if profile_photo:
        ext = os.path.splitext(profile_photo.filename)[1]
        file_name = f"{uuid4().hex}{ext}"
        file_path = os.path.join(PROFILE_PHOTO_DIR, file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_photo.file, buffer)
        vendor.profile_photo = f"profile_photos/{file_name}"

    db.commit()
    db.refresh(vendor)
    return vendor

# --------------------------
# Atualizar localização do vendedor
# --------------------------
@app.put("/vendors/{vendor_id}/location")
async def update_vendor_location(
    vendor_id: int,
    lat: float = Body(...),
    lng: float = Body(...),
    db: Session = Depends(get_db),
    current_vendor: models.Vendor = Depends(get_current_vendor),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if current_vendor.id != vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    vendor.current_lat = lat
    vendor.current_lng = lng
    db.commit()

    await manager.broadcast({"vendor_id": vendor_id, "lat": lat, "lng": lng})
    return {"message": "Localização atualizada com sucesso"}

# --------------------------
# Criar sessão de pagamento no Stripe
# --------------------------
@app.post("/vendors/{vendor_id}/create-checkout-session")
def create_checkout_session(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_vendor: models.Vendor = Depends(get_current_vendor),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if current_vendor.id != vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not STRIPE_PRICE_ID:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={"vendor_id": vendor_id},
        )
        return {"checkout_url": session.url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# --------------------------
# WebSocket para localização em tempo real
# --------------------------
@app.websocket("/ws/locations")
async def websocket_locations(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --------------------------
# Reviews dos vendedores
# --------------------------
@app.post("/vendors/{vendor_id}/reviews", response_model=schemas.ReviewOut)
def create_review(
    vendor_id: int, review: schemas.ReviewCreate, db: Session = Depends(get_db)
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    new_rev = models.Review(
        vendor_id=vendor_id, rating=review.rating, comment=review.comment
    )
    db.add(new_rev)
    db.commit()
    db.refresh(new_rev)
    return new_rev


@app.get("/vendors/{vendor_id}/reviews", response_model=list[schemas.ReviewOut])
def list_reviews(vendor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Review)
        .filter(models.Review.vendor_id == vendor_id)
        .all()
    )

# --------------------------
# Webhook do Stripe
# --------------------------
@app.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        vendor_id = int(session.get("metadata", {}).get("vendor_id", 0))
        vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
        if vendor:
            vendor.subscription_active = True
            vendor.subscription_valid_until = datetime.utcnow() + timedelta(days=7)
            db.commit()
    return {"status": "success"}
