# models.py - define as tabelas no PostgreSQL
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"  # tabela de utilizadores

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # 'vendor' ou 'customer'

    vendor = relationship("Vendor", back_populates="user", uselist=False)

class Vendor(Base):
    __tablename__ = "vendors"  # tabela de vendedores

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    current_lat = Column(Float)
    current_lng = Column(Float)
    last_update = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="vendor")
