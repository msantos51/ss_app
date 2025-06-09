# schemas.py - define os formatos de dados para entrada e saída
from pydantic import BaseModel
from typing import Optional, Literal

class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: str
    password: str

class VendorProfileUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    product: Optional[Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]] = None
    profile_photo: Optional[str] = None

class VendorCreate(BaseModel):
    email: str
    password: str
    product: Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]
    profile_photo: str

class VendorOut(BaseModel):
    id: int
    product: str
    profile_photo: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    user: UserOut

    class Config:
        orm_mode = True
