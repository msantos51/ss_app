# main.py - aplicação FastAPI com rotas principais

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models, schemas
from .database import SessionLocal, engine
import os
import shutil
from uuid import uuid4
from fastapi.staticfiles import StaticFiles
# Criar as tabelas
models.Base.metadata.create_all(bind=engine)

# Inicializar app
app = FastAPI()

# (em português) Permite aceder às imagens pela URL (ex: /profile_photos/nome.png)
app.mount("/profile_photos", StaticFiles(directory="profile_photos"), name="profile_photos")

# Contexto para hash de password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Diretório para armazenar as fotos de perfil
PROFILE_PHOTO_DIR = "profile_photos"
os.makedirs(PROFILE_PHOTO_DIR, exist_ok=True)

# --------------------------
# Dependência para obter a sessão
# --------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------
# Rota de login do vendedor
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
# Rota de registro de vendedor
# --------------------------
@app.post("/vendors/", response_model=schemas.VendorOut)
async def create_vendor(
    email: str = Form(...),
    password: str = Form(...),
    product: str = Form(...),
    profile_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(password)
    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        role="vendor",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Guardar a foto de perfil em disco
    ext = os.path.splitext(profile_photo.filename)[1]
    file_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(PROFILE_PHOTO_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(profile_photo.file, buffer)

    new_vendor = models.Vendor(
        user_id=new_user.id,
        product=product,
        profile_photo=file_path,
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

# --------------------------
# Rota para atualizar perfil do vendedor
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
    if email is not None:
        user.email = email
    if password is not None:
        user.hashed_password = pwd_context.hash(password)
    if product is not None:
        vendor.product = product
    if profile_photo is not None:
        ext = os.path.splitext(profile_photo.filename)[1]
        file_name = f"{uuid4().hex}{ext}"
        file_path = os.path.join(PROFILE_PHOTO_DIR, file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_photo.file, buffer)
        vendor.profile_photo = file_path
    db.commit()
    db.refresh(vendor)
    return vendor
