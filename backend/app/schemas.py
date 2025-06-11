# schemas.py - define os formatos de dados para entrada e saída
from pydantic import BaseModel
from typing import Optional, Literal

class UserLogin(BaseModel):
    email: str
    password: str

class VendorProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    product: Optional[Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]] = None
    profile_photo: Optional[str] = None

class VendorCreate(BaseModel):
    name: str
    email: str
    password: str
    product: Literal["Bolas de Berlim", "Gelados", "Acess\u00f3rios"]
    profile_photo: str

class VendorOut(BaseModel):
    id: int
    name: str
    email: str
    product: str
    profile_photo: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

    class Config:
        orm_mode = True


class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    vendor_id: int
    rating: int
    comment: Optional[str] = None

    class Config:
        orm_mode = True
