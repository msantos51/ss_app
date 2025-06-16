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
    pin_color = Column(String, default="#FF0000")
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    subscription_active = Column(Boolean, default=False)
    subscription_valid_until = Column(DateTime, nullable=True)
    email_confirmed = Column(Boolean, default=False)
    confirmation_token = Column(String, nullable=True, index=True)
    password_reset_token = Column(String, nullable=True, index=True)
    password_reset_expires = Column(DateTime, nullable=True)

    reviews = relationship("Review", back_populates="vendor")
    routes = relationship("Route", back_populates="vendor")


class Review(Base):
    """Avaliações/comentários de clientes para um vendedor."""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    rating = Column(Integer)
    comment = Column(String)

    vendor = relationship("Vendor", back_populates="reviews")


class Route(Base):
    """Trajetos percorridos pelos vendedores."""

    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    points = Column(String)
    distance_m = Column(Float, default=0.0)

    vendor = relationship("Vendor", back_populates="routes")

