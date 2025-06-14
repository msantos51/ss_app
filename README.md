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
3. Copie o arquivo `.env.example` para `.env` e defina `DATABASE_URL` com as suas credenciais. Caso a variável não seja definida o backend usa uma base SQLite local. Opcionalmente ajuste `EXPO_PUBLIC_BASE_URL`.

```bash
cp .env.example .env
```

Edite o arquivo `.env` resultante, por exemplo:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost/beach_vendors
# EXPO_PUBLIC_BASE_URL=http://10.0.2.2:8000
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

### 1.4 Stripe

Para habilitar os pagamentos semanais configure as seguintes variáveis no arquivo `.env`:

```env
STRIPE_API_KEY=<sua_chave_secreta>
STRIPE_PRICE_ID=<preco_semanal_id>
STRIPE_WEBHOOK_SECRET=<segredo_do_webhook>
SUCCESS_URL=https://example.com/sucesso
CANCEL_URL=https://example.com/cancelado
```

Estas definições permitem que o backend crie sessões de pagamento e processe os webhooks da Stripe.

## 2. Backend (Python)

### 2.1 requirements.txt

Crie `backend/requirements.txt` com o seguinte conteúdo:

```txt
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
passlib[bcrypt]
httpx
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
# models.py - define a tabela de vendedores no PostgreSQL
from sqlalchemy import Column, Integer, String, Float
from .database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    product = Column(String)
    profile_photo = Column(String)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
```

### 2.4 Arquivo schemas.py

```python
# schemas.py - define os formatos de dados para entrada e saída
from pydantic import BaseModel
from typing import Optional, Literal

class UserLogin(BaseModel):
    email: str
    password: str

class VendorCreate(BaseModel):
    name: str
    email: str
    password: str
    product: Literal["Bolas de Berlim", "Gelados", "Acessórios"]
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

# Rota para atualizar dados do vendedor (uso do PATCH)
@app.patch("/vendors/{vendor_id}/profile", response_model=schemas.VendorOut)
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
npm install expo-notifications
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

### 3.4 Configuração da URL do backend

O arquivo `mobile/config.js` exporta a constante `BASE_URL`, utilizada nas requisições ao servidor.
Por padrão o valor é `http://10.0.2.2:8000`, adequado para o emulador Android (que acessa o `localhost` da máquina).

É possível sobrescrever este endereço definindo a variável de ambiente `EXPO_PUBLIC_BASE_URL` ou
adicionando `BASE_URL` em `expo.extra` no `app.json` do projeto.

Exemplos:

```bash
# Emulador Android
EXPO_PUBLIC_BASE_URL=http://10.0.2.2:8000 npx expo start

# iOS Simulator
EXPO_PUBLIC_BASE_URL=http://localhost:8000 npx expo start

# Dispositivo físico na mesma rede
EXPO_PUBLIC_BASE_URL=http://192.168.0.5:8000 npx expo start
```

Ou defina em `app.json`:

```json
{
  "expo": {
    "extra": {
      "BASE_URL": "http://192.168.0.5:8000"
    }
  }
}
```

Escolha a URL apropriada conforme estiver a testar em emuladores ou dispositivos reais.

### 3.4.1 Build do APK para dispositivo

Ao gerar o APK com `eas build` o endereço do backend também precisa estar definido.
Use a mesma variável `EXPO_PUBLIC_BASE_URL` (ou a chave `expo.extra.BASE_URL` no
`app.json`) apontando para o servidor acessível pelo aparelho:

```bash
EXPO_PUBLIC_BASE_URL=https://ss-app-jptj.onrender.com \
  eas build -p android --profile production
```

Assim o aplicativo instalado num dispositivo físico comunica-se com o backend correto.



### 3.5 Funcionalidades adicionais

O aplicativo móvel inclui agora uma tela de detalhes para cada vendedor. Nela é possível ver foto, produto e avaliações feitas por clientes. Também é possível enviar novos comentários e uma classificação de 1 a 5 estrelas. Para abrir esta tela pressione longamente sobre o nome do vendedor na lista de filtros; um toque normal apenas faz o mapa aproximar-se do vendedor.

Adicionalmente, quando um vendedor ativo estiver num raio de aproximadamente 500 metros do utilizador, o app envia uma notificação local (usa `expo-notifications`). Certifique-se de executar `npm install` para instalar esta dependência antes de iniciar o Expo.


Adicionalmente, quando um vendedor ativo estiver num raio de aproximadamente 500 metros do utilizador, o app envia uma notificação local (usa `expo-notifications`). Certifique-se de executar `npm install` para instalar esta dependência antes de iniciar o Expo.

## 4. Considerações finais

* Este README fornece um guia inicial. Você pode expandir o backend com autenticação JWT e aprimorar o frontend conforme necessário.
* Use o Visual Studio Code para editar os arquivos e acompanhar o desenvolvimento.
* Em caso de dúvidas, consulte a documentação do FastAPI e do React Native.


## Licença

Este projeto está licenciado sob os termos da licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

