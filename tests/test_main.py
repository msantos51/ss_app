import os
import importlib
import shutil

import pytest
from fastapi.testclient import TestClient

# Fixture to create a new app with a fresh database for each test
@pytest.fixture()
def client(tmp_path):
    # setup DATABASE_URL for tests
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path}/test.db?check_same_thread=False"

    # reload application modules so they pick up the new DATABASE_URL
    from backend.app import database, models, main
    importlib.reload(database)
    importlib.reload(models)
    importlib.reload(main)

    # create tables
    models.Base.metadata.create_all(bind=database.engine)

    with TestClient(main.app) as c:
        yield c

    # cleanup created profile photos directory if it exists
    if os.path.exists("profile_photos"):
        shutil.rmtree("profile_photos")

def register_vendor(client, email="vendor@example.com", password="secret"):
    data = {
        "email": email,
        "password": password,
        "product": "Bolas de Berlim",
    }
    files = {"profile_photo": ("test.png", b"fakeimage", "image/png")}
    return client.post("/vendors/", data=data, files=files)


def test_vendor_registration(client):
    resp = register_vendor(client)
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["user"]["email"] == "vendor@example.com"
    assert payload["product"] == "Bolas de Berlim"


def test_login(client):
    register_vendor(client)
    resp = client.post("/login", json={"email": "vendor@example.com", "password": "secret"})
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["user"]["email"] == "vendor@example.com"


def test_vendor_listing(client):
    register_vendor(client, email="first@example.com")
    register_vendor(client, email="second@example.com")
    resp = client.get("/vendors/")
    assert resp.status_code == 200
    emails = [v["user"]["email"] for v in resp.json()]
    assert "first@example.com" in emails and "second@example.com" in emails
