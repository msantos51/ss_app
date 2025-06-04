# main.py - aplicação FastAPI com rotas principais

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models, schemas
from .database import SessionLocal, engine

# Criar as tabelas
models.Base.metadata.create_all(bind=engine)

# Inicializar app
app = FastAPI()

# Contexto para hash de password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == vendor.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(vendor.password)
    new_user = models.User(
        email=vendor.email,
        hashed_password=hashed_password,
        role="vendor",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    new_vendor = models.Vendor(
        user_id=new_user.id,
        product=vendor.product,
        profile_photo=vendor.profile_photo,
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

# --------------------------
# Rota para atualizar perfil do vendedor
# --------------------------
@app.put("/vendors/{vendor_id}/profile", response_model=schemas.VendorOut)
def update_vendor_profile(
    vendor_id: int,
    update: schemas.VendorProfileUpdate,
    db: Session = Depends(get_db),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    user = vendor.user
    if update.email is not None:
        user.email = update.email
    if update.password is not None:
        user.hashed_password = pwd_context.hash(update.password)
    if update.product is not None:
        vendor.product = update.product
    if update.profile_photo is not None:
        vendor.profile_photo = update.profile_photo
    db.commit()
    db.refresh(vendor)
    return vendor
