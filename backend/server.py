from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= Models =============

class SendOTPRequest(BaseModel):
    phone: str

class SendOTPResponse(BaseModel):
    success: bool
    message: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    user: Optional[User] = None
    token: Optional[str] = None

class Shop(BaseModel):
    id: str
    name: str
    category: str
    lat: float
    lng: float
    distance: float
    price: float
    savings: float
    address: str

class Plan(BaseModel):
    id: str
    name: str
    pricePerMonth: float
    benefits: List[str]
    savings: float

class PaymentRequest(BaseModel):
    userId: str
    shopId: Optional[str] = None
    planId: Optional[str] = None
    amount: float
    method: str

class PaymentResponse(BaseModel):
    success: bool
    transactionId: str
    message: str
    savings: float

# ============= Dummy Data =============

DUMMY_SHOPS = [
    {
        "id": "shop1",
        "name": "Fresh Mart Grocery",
        "category": "Grocery",
        "lat": 12.9716,
        "lng": 77.5946,
        "price": 500.0,
        "savings": 50.0,
        "address": "MG Road, Bangalore"
    },
    {
        "id": "shop2",
        "name": "Style Salon & Spa",
        "category": "Salon",
        "lat": 12.9720,
        "lng": 77.5950,
        "price": 800.0,
        "savings": 100.0,
        "address": "Brigade Road, Bangalore"
    },
    {
        "id": "shop3",
        "name": "Organic Foods Store",
        "category": "Grocery",
        "lat": 12.9710,
        "lng": 77.5940,
        "price": 600.0,
        "savings": 75.0,
        "address": "Church Street, Bangalore"
    },
    {
        "id": "shop4",
        "name": "Wellness Pharmacy",
        "category": "Pharmacy",
        "lat": 12.9725,
        "lng": 77.5955,
        "price": 300.0,
        "savings": 40.0,
        "address": "Commercial Street, Bangalore"
    },
    {
        "id": "shop5",
        "name": "Quick Bites Restaurant",
        "category": "Restaurant",
        "lat": 12.9705,
        "lng": 77.5935,
        "price": 400.0,
        "savings": 60.0,
        "address": "Residency Road, Bangalore"
    },
    {
        "id": "shop6",
        "name": "Fashion Hub",
        "category": "Fashion",
        "lat": 12.9730,
        "lng": 77.5960,
        "price": 1200.0,
        "savings": 150.0,
        "address": "MG Road, Bangalore"
    },
    {
        "id": "shop7",
        "name": "Tech Store",
        "category": "Electronics",
        "lat": 12.9700,
        "lng": 77.5930,
        "price": 2000.0,
        "savings": 200.0,
        "address": "Indiranagar, Bangalore"
    },
    {
        "id": "shop8",
        "name": "Beauty Palace",
        "category": "Salon",
        "lat": 12.9735,
        "lng": 77.5965,
        "price": 900.0,
        "savings": 110.0,
        "address": "Koramangala, Bangalore"
    }
]

DUMMY_PLANS = [
    {
        "id": "plan1",
        "name": "IT Max",
        "pricePerMonth": 299.0,
        "benefits": [
            "5% discount at all partner stores",
            "Free delivery on orders above ₹500",
            "Access to exclusive deals",
            "Priority customer support"
        ],
        "savings": 500.0
    },
    {
        "id": "plan2",
        "name": "IT Max Plus",
        "pricePerMonth": 499.0,
        "benefits": [
            "10% discount at all partner stores",
            "Free delivery on all orders",
            "Access to premium exclusive deals",
            "24/7 priority customer support",
            "Cashback on every purchase",
            "Extended warranty on electronics"
        ],
        "savings": 1200.0
    }
]

# ============= Helper Functions =============

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in km (simplified)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in km
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

# ============= API Endpoints =============

@api_router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number (mocked)"""
    # Mock OTP generation and sending
    logger.info(f"Sending OTP to {request.phone}")
    
    # In a real app, you would generate a random OTP and send via SMS
    # For demo, we'll just return success
    # The OTP is always "1234" for testing
    
    return SendOTPResponse(
        success=True,
        message=f"OTP sent successfully to {request.phone}. Use 1234 for testing."
    )

@api_router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and login user (mocked)"""
    # Mock OTP verification - accept "1234" as valid OTP
    if request.otp != "1234":
        return VerifyOTPResponse(
            success=False,
            message="Invalid OTP"
        )
    
    # Check if user exists in database
    existing_user = await db.users.find_one({"phone": request.phone})
    
    if existing_user:
        user = User(**existing_user)
    else:
        # Create new user
        user = User(
            name=f"User {request.phone[-4:]}",
            phone=request.phone
        )
        await db.users.insert_one(user.dict())
    
    # Generate mock token
    token = str(uuid.uuid4())
    
    return VerifyOTPResponse(
        success=True,
        message="Login successful",
        user=user,
        token=token
    )

@api_router.get("/shops", response_model=List[Shop])
async def get_shops(lat: float, lng: float, category: Optional[str] = None):
    """Get nearby shops based on location and optional category filter"""
    shops = []
    
    for shop_data in DUMMY_SHOPS:
        # Calculate distance from user location
        distance = calculate_distance(lat, lng, shop_data["lat"], shop_data["lng"])
        
        # Apply category filter if provided
        if category and shop_data["category"].lower() != category.lower():
            continue
        
        shop = Shop(
            **shop_data,
            distance=round(distance, 2)
        )
        shops.append(shop)
    
    # Sort by distance
    shops.sort(key=lambda x: x.distance)
    
    return shops

@api_router.get("/plans", response_model=List[Plan])
async def get_plans():
    """Get available subscription plans"""
    return [Plan(**plan) for plan in DUMMY_PLANS]

@api_router.post("/payment", response_model=PaymentResponse)
async def process_payment(request: PaymentRequest):
    """Process payment (mocked)"""
    # Mock payment processing
    transaction_id = f"TXN{random.randint(100000, 999999)}"
    
    # Calculate mock savings
    savings = request.amount * 0.1  # 10% savings
    
    # Store payment in database
    payment_data = {
        "id": str(uuid.uuid4()),
        "userId": request.userId,
        "shopId": request.shopId,
        "planId": request.planId,
        "amount": request.amount,
        "method": request.method,
        "transactionId": transaction_id,
        "status": "success",
        "savings": savings,
        "created_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment_data)
    
    return PaymentResponse(
        success=True,
        transactionId=transaction_id,
        message="Payment successful",
        savings=savings
    )

@api_router.get("/categories")
async def get_categories():
    """Get popular categories"""
    categories = [
        {"id": "cat1", "name": "Grocery", "icon": "shopping-cart"},
        {"id": "cat2", "name": "Salon", "icon": "cut"},
        {"id": "cat3", "name": "Restaurant", "icon": "restaurant"},
        {"id": "cat4", "name": "Pharmacy", "icon": "medical"},
        {"id": "cat5", "name": "Fashion", "icon": "shirt"},
        {"id": "cat6", "name": "Electronics", "icon": "laptop"},
    ]
    return categories

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()