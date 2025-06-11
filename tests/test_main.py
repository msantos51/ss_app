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

def register_vendor(client, email="vendor@example.com", password="secret", name="Vendor"):
    data = {
        "name": name,
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
    assert payload["email"] == "vendor@example.com"
    assert payload["product"] == "Bolas de Berlim"


def get_token(client, email="vendor@example.com", password="secret"):
    resp = client.post("/token", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_token_generation(client):
    register_vendor(client)
    token = get_token(client)
    assert token


def test_vendor_listing(client):
    register_vendor(client, email="first@example.com", name="First")
    register_vendor(client, email="second@example.com", name="Second")
    resp = client.get("/vendors/")
    assert resp.status_code == 200
    vendors = resp.json()
    emails = [v["email"] for v in vendors]
    assert "first@example.com" in emails and "second@example.com" in emails
    for v in vendors:
        assert "current_lat" in v and "current_lng" in v


def test_protected_routes(client):
    resp = register_vendor(client)
    vendor_id = resp.json()["id"]
    token = get_token(client)

    # update profile with auth
    resp = client.patch(
        f"/vendors/{vendor_id}/profile",
        data={"name": "New"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"

    # update profile without auth
    resp = client.patch(f"/vendors/{vendor_id}/profile", data={"name": "Fail"})
    assert resp.status_code == 401

    # update location with auth
    resp = client.put(
        f"/vendors/{vendor_id}/location",
        json={"lat": 1.0, "lng": 2.0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def test_location_update_fields(client):
    resp = register_vendor(client)
    vendor_id = resp.json()["id"]
    token = get_token(client)

    resp = client.put(
        f"/vendors/{vendor_id}/location",
        json={"lat": 10.5, "lng": -20.3},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    resp = client.get("/vendors/")
    assert resp.status_code == 200
    vendors = resp.json()
    vendor = next(v for v in vendors if v["id"] == vendor_id)
    assert vendor["current_lat"] == 10.5
    assert vendor["current_lng"] == -20.3


def test_websocket_location_broadcast(client):
    resp = register_vendor(client)
    vendor_id = resp.json()["id"]
    token = get_token(client)

    with client.websocket_connect("/ws/locations") as websocket:
        resp = client.put(
            f"/vendors/{vendor_id}/location",
            json={"lat": 5.5, "lng": -7.1},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = websocket.receive_json()
        assert data == {"vendor_id": vendor_id, "lat": 5.5, "lng": -7.1}


def test_reviews_endpoints(client):
    resp = register_vendor(client)
    vendor_id = resp.json()["id"]

    # add review
    resp = client.post(
        f"/vendors/{vendor_id}/reviews",
        json={"rating": 4, "comment": "Bom"},
    )
    assert resp.status_code == 200
    review = resp.json()
    assert review["rating"] == 4

    # list reviews
    resp = client.get(f"/vendors/{vendor_id}/reviews")
    assert resp.status_code == 200
    reviews = resp.json()
    assert len(reviews) == 1 and reviews[0]["comment"] == "Bom"


def test_vendor_average_rating(client):
    resp = register_vendor(client)
    vendor_id = resp.json()["id"]

    client.post(f"/vendors/{vendor_id}/reviews", json={"rating": 5})
    client.post(f"/vendors/{vendor_id}/reviews", json={"rating": 3})

    resp = client.get("/vendors/")
    assert resp.status_code == 200
    vendor = next(v for v in resp.json() if v["id"] == vendor_id)
    assert pytest.approx(vendor["rating_average"], 0.01) == 4.0

