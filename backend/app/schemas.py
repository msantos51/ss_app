# schemas.py - define os formatos de dados para entrada e saída
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # 'vendor' ou 'customer'

class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        orm_mode = True

class VendorUpdate(BaseModel):
    current_lat: float
    current_lng: float

class VendorOut(BaseModel):
    id: int
    current_lat: float
    current_lng: float
    last_update: datetime
    user: UserOut

    class Config:
        orm_mode = True
