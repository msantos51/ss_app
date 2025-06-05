# main.py - aplicação FastAPI com rotas principais

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models, schemas
from .database import SessionLocal, engine
import os
import shutil
from uuid import uuid4

# Diretório para guardar fotos de perfil
PROFILE_PHOTO_DIR = "profile_photos"
os.makedirs(PROFILE_PHOTO_DIR, exist_ok=True)  # ← Garantir que existe antes do mount

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

# Montar rota para servir fotos (ex: http://localhost:8000/profile_photos/foto.jpg)
app.mount("/profile_photos", StaticFiles(directory=PROFILE_PHOTO_DIR), name="profile_photos")

# Criar as tabelas na base de dados
models.Base.metadata.create_all(bind=engine)

# Contexto para hash de password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
# Sessão de base de dados
# --------------------------
def get_db():
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
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    vendor = user.vendor
    if vendor is None:
        raise HTTPException(status_code=400, detail="Vendor not found")
    return vendor

# --------------------------
# Registo de vendedor
# --------------------------
@app.post("/vendors/", response_model=schemas.VendorOut)
async def create_vendor(
    email: str = Form(...),
    password: str = Form(...),
    product: str = Form(...),
    profile_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Verificar se email já está registado
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Criar utilizador
    hashed_password = pwd_context.hash(password)
    new_user = models.User(email=email, hashed_password=hashed_password, role="vendor")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Guardar imagem em disco
    ext = os.path.splitext(profile_photo.filename)[1]
    file_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(PROFILE_PHOTO_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(profile_photo.file, buffer)

    public_path = f"profile_photos/{file_name}"

    # Criar vendedor
    new_vendor = models.Vendor(
        user_id=new_user.id,
        product=product,
        profile_photo=public_path,
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    _ = new_vendor.user  # Forçar carregamento da relação
    return new_vendor

# --------------------------
# Listar vendedores
# --------------------------
@app.get("/vendors/", response_model=list[schemas.VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).all()
    for v in vendors:
        _ = v.user
    return vendors

# --------------------------
# Atualizar perfil do vendedor
# --------------------------
@app.put("/vendors/{vendor_id}/profile", response_model=schemas.VendorOut)
async def update_vendor_profile(
    vendor_id: int,
    email: str = Form(None),
    password: str = Form(None),
    product: str = Form(None),
    profile_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    user = vendor.user
    if email:
        user.email = email
    if password:
        user.hashed_password = pwd_context.hash(password)
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
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.current_lat = lat
    vendor.current_lng = lng
    db.commit()

    await manager.broadcast({"vendor_id": vendor_id, "lat": lat, "lng": lng})
    return {"message": "Localização atualizada com sucesso"}

# --------------------------
# WebSocket para localização em tempo real
# --------------------------
@app.websocket("/ws/locations")
async def websocket_locations(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Apenas para manter conexão ativa
    except WebSocketDisconnect:
        manager.disconnect(websocket)
