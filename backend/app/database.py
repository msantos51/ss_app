# (em português) Este ficheiro configura a ligação à base de dados, seja PostgreSQL ou SQLite

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()  # Carrega o .env

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Usa SQLite como fallback
    DATABASE_URL = "sqlite:///./app.db"
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

# Criar engine de forma correta
if connect_args:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
