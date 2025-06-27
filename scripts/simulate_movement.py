# Script para simular deslocamento de um vendedor enviando localizações
import os
import time
import httpx

# Configurações de conexão com o servidor
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
VENDOR_ID = int(os.environ.get("VENDOR_ID", "1"))
EMAIL = os.environ.get("VENDOR_EMAIL")
PASSWORD = os.environ.get("VENDOR_PASSWORD")

# Verificar se as credenciais necessárias foram definidas
if not EMAIL or not PASSWORD:
    raise SystemExit("Please set VENDOR_EMAIL and VENDOR_PASSWORD environment variables")

async def main():
    async with httpx.AsyncClient() as client:
        # Obter token de autenticação
        resp = await client.post(
            f"{BASE_URL}/token",
            json={"email": EMAIL, "password": PASSWORD},
        )
        resp.raise_for_status()
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Iniciar rota do vendedor
        await client.post(
            f"{BASE_URL}/vendors/{VENDOR_ID}/routes/start",
            headers=headers,
        )

        # Enviar coordenadas em loop simulando movimento
        lat, lng = 40.0, -8.0
        for _ in range(20):
            await client.put(
                f"{BASE_URL}/vendors/{VENDOR_ID}/location",
                json={"lat": lat, "lng": lng},
                headers=headers,
            )
            lat += 0.0005
            lng += 0.0005
            time.sleep(1)

        # Finalizar a rota
        await client.post(
            f"{BASE_URL}/vendors/{VENDOR_ID}/routes/stop",
            headers=headers,
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
