# models.py - define as tabelas no PostgreSQL
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
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
    icon = Column(String, default="📍")
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    subscription_active = Column(Boolean, default=False)
    subscription_valid_until = Column(DateTime, nullable=True)

    reviews = relationship("Review", back_populates="vendor")


class Review(Base):
    """Avaliações/comentários de clientes para um vendedor."""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    rating = Column(Integer)
    comment = Column(String)

    vendor = relationship("Vendor", back_populates="reviews")

