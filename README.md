# sunny_sales - Aplicativo de Vendedores de Praia

Este projeto, chamado `sunny_sales`, tem como objetivo criar uma aplicação simples onde os vendedores de praia podem:

* Registar-se fornecendo e-mail, password, foto de perfil e o produto que vendem (bolas de Berlim, gelados ou acessórios).
* Fazer login na aplicação.
* Alterar os seus dados de registo após autenticados.

As instruções abaixo estão em português e fornecem um guia passo a passo para configuração e desenvolvimento.

## Estrutura sugerida do projeto

```
ss_app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
└── mobile/
    └── App.js
```

## 1. Configuração do Ambiente

### 1.1 Python e dependências

1. Instale o Python (versão 3.10 ou superior).
2. Crie um ambiente virtual:

```bash
python3 -m venv venv
source venv/bin/activate  # No Windows use `venv\Scripts\activate`
```

3. Instale as dependências listadas em `backend/requirements.txt` (veja exemplo de arquivo abaixo).

```bash
pip install -r backend/requirements.txt
```

### 1.2 PostgreSQL

1. Instale o PostgreSQL.
2. Crie uma base de dados chamada `beach_vendors` e um utilizador com permissões.
3. Defina as variáveis de ambiente com as credenciais da base de dados:

```bash
export DATABASE_URL=postgresql://<user>:<password>@localhost/beach_vendors
```

### 1.3 Node.js e React Native

1. Instale Node.js (versão LTS).
2. Instale a CLI do Expo para React Native:

```bash
npm install -g expo-cli
```

3. Dentro da pasta `mobile`, inicie o projeto React Native:

```bash
cd mobile
expo init sunny_sales_app
```

Escolha o template "blank" para simplicidade.

## 2. Backend (Python)

### 2.1 requirements.txt

Crie `backend/requirements.txt` com o seguinte conteúdo:

```txt
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
```

### 2.2 Arquivo database.py

```python
# database.py - configuração da conexão ao PostgreSQL
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Obter a URL da base de dados das variáveis de ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

# Criar o motor de conexão
engine = create_engine(DATABASE_URL)

# Criar sessão de acesso ao banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()
```

### 2.3 Arquivo models.py

```python
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
```

### 2.4 Arquivo schemas.py

```python
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
```

### 2.5 Arquivo main.py

```python
# main.py - aplicação FastAPI com rotas principais
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal, engine
from passlib.context import CryptContext

# Criar as tabelas
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependência para obter a sessão
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Rota para registro de vendedor
@app.post("/vendors/", response_model=schemas.VendorOut)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    ...

# Rota de login
@app.post("/login", response_model=schemas.VendorOut)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    ...

# Rota para atualizar dados do vendedor
@app.put("/vendors/{vendor_id}/profile", response_model=schemas.VendorOut)
def update_vendor_profile(vendor_id: int, update: schemas.VendorProfileUpdate, db: Session = Depends(get_db)):
    ...
```

### 2.6 Execução do servidor

Para iniciar o servidor FastAPI, execute:

```bash
uvicorn app.main:app --reload
```

O backend ficará disponível em `http://localhost:8000`.

### 2.7 CORS e WebSockets

O arquivo `backend/app/main.py` agora configura o middleware `CORSMiddleware` para permitir que o aplicativo móvel aceda ao backend durante o desenvolvimento. Foi também criado um endpoint WebSocket (`/ws/locations`) que emite atualizações de localização dos vendedores em tempo real para todos os clientes conectados.

## 3. Frontend (React Native)

### 3.1 Instalação de dependências

Dentro da pasta `sunny_sales_app`, instale a biblioteca `axios`:

```bash
cd sunny_sales_app
npm install axios
```

### 3.2 Exemplo simples de uso no `App.js`

```javascript
import React from 'react';
import { Button, View } from 'react-native';
import axios from 'axios';

export default function App() {
  const register = () => {
    const data = new FormData();
    data.append('email', 'vendedor@example.com');
    data.append('password', 'senha');
    data.append('product', 'Bolas de Berlim');
    data.append('profile_photo', {
      uri: 'caminho/para/foto.png',
      name: 'foto.png',
      type: 'image/png',
    });
    axios.post('http://localhost:8000/vendors/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  return (
    <View>
      <Button title="Registar" onPress={register} />
    </View>
  );
}
```

### 3.3 Execução do aplicativo

Com o Expo instalado, dentro da pasta `sunny_sales_app` execute:

```bash
expo start
```

Siga as instruções do terminal para abrir o app em um emulador ou no dispositivo físico.

## 4. Considerações finais

* Este README fornece um guia inicial. Você pode expandir o backend com autenticação JWT e aprimorar o frontend conforme necessário.
* Use o Visual Studio Code para editar os arquivos e acompanhar o desenvolvimento.
* Em caso de dúvidas, consulte a documentação do FastAPI e do React Native.


## Licença

Este projeto está licenciado sob os termos da licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

