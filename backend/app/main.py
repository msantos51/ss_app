# main.py - aplicação FastAPI com rotas principais
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal, engine
from passlib.context import CryptContext

# Criar as tabelas
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Rota de login
@app.post("/login", response_model=schemas.UserOut)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return user

# Dependência para obter a sessão
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Rota de registro de utilizador
@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role, date_of_birth=user.date_of_birth)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    if user.role == 'vendor':
        vendor = models.Vendor(user_id=new_user.id)
        db.add(vendor)
        db.commit()
    return new_user

# Rota de registro de vendedor
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
        date_of_birth=vendor.date_of_birth,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    new_vendor = models.Vendor(user_id=new_user.id, product=vendor.product)
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

# Rota para atualizar localização do vendedor
@app.put("/vendors/{vendor_id}", response_model=schemas.VendorOut)
def update_vendor(vendor_id: int, update: schemas.VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.current_lat = update.current_lat
    vendor.current_lng = update.current_lng
    db.commit()
    db.refresh(vendor)
    return vendor

# Rota para obter vendedores ativos
@app.get("/vendors/", response_model=list[schemas.VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).all()

# Rota para atualizar informações do perfil do vendedor
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
    if update.date_of_birth is not None:
        user.date_of_birth = update.date_of_birth
    if update.product is not None:
        vendor.product = update.product
    db.commit()
    db.refresh(vendor)
    return vendor
