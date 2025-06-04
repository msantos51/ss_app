# models.py - define as tabelas no PostgreSQL
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"  # tabela de utilizadores

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="vendor")

    vendor = relationship("Vendor", back_populates="user", uselist=False)

class Vendor(Base):
    __tablename__ = "vendors"  # tabela de vendedores

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product = Column(String)
    profile_photo = Column(String)

    user = relationship("User", back_populates="vendor")
