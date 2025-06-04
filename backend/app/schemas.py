# schemas.py - define os formatos de dados para entrada e saída
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, date

class UserCreate(BaseModel):
    email: str
    password: str
    role: str  # 'vendor' ou 'customer'
    date_of_birth: date

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    date_of_birth: date

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: str
    password: str

class VendorProfileUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    date_of_birth: Optional[date] = None
    product: Optional[Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]] = None

class VendorUpdate(BaseModel):
    current_lat: float
    current_lng: float

class VendorCreate(BaseModel):
    email: str
    password: str
    date_of_birth: date
    product: Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]

class VendorOut(BaseModel):
    id: int
    product: str
    current_lat: float
    current_lng: float
    last_update: datetime
    user: UserOut

    class Config:
        orm_mode = True
