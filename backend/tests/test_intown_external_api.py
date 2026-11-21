# External dev API sanity checks (INtown Local) - read-only GETs
import requests
import pytest

API = "https://devapi.intownlocal.com/IN"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# Search user by phone (login role determination)
def test_search_by_phone(s):
    r = s.get(f"{API}/search/8639071519", timeout=30)
    assert r.status_code == 200
    body = r.text.lower()
    assert "100093" in body or "customer" in body
    print(r.text[:600])


# Nearby product/shop search
def test_search_by_product_names(s):
    r = s.get(f"{API}/search/by-product-names", params={"customerLatitude": 17.5196, "customerLongitude": 78.4468}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) or isinstance(data, dict)
    print(type(data), len(data))


# Customer pickup orders
def test_customer_pickup_orders(s):
    r = s.get(f"{API}/customers/100093/pickup-orders", timeout=30)
    assert r.status_code == 200
    print(r.text[:400])


# Merchant pickup orders
def test_merchant_pickup_orders(s):
    r = s.get(f"{API}/merchants/100105/pickup-orders", timeout=30)
    assert r.status_code == 200
    print(r.text[:400])


# Merchant details
def test_merchant_details(s):
    r = s.get(f"{API}/merchant/100105", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "100105" in r.text
    print(r.text[:600])
