# models.py - define as tabelas no PostgreSQL
from sqlalchemy import Column, Integer, String, Float
from .database import Base

class Vendor(Base):
    """Tabela principal de vendedores (utilizadores)."""

    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    product = Column(String)
    profile_photo = Column(String)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

