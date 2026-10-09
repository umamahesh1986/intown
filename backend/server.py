from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


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


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ---------- Special-offer analytics (views / taps per merchant) ----------
OFFER_EVENT_TYPES = {"VIEW", "TAP"}


class OfferEventCreate(BaseModel):
    merchantId: str
    eventType: str
    customerId: Optional[str] = None
    source: Optional[str] = None


class OfferDayStat(BaseModel):
    date: str
    views: int
    taps: int


class OfferAnalytics(BaseModel):
    merchantId: str
    days: int
    views: int
    taps: int
    uniqueViewers: int
    byDay: List[OfferDayStat]


@api_router.post("/offer-events", status_code=201)
async def create_offer_event(input: OfferEventCreate):
    event_type = input.eventType.upper()
    if event_type not in OFFER_EVENT_TYPES:
        raise HTTPException(status_code=400, detail="eventType must be VIEW or TAP")
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "merchantId": str(input.merchantId),
        "customerId": str(input.customerId) if input.customerId else None,
        "eventType": event_type,
        "source": input.source,
        "timestamp": now.isoformat(),
        "day": now.strftime("%Y-%m-%d"),
    }
    await db.offer_events.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/offer-analytics/{merchant_id}", response_model=OfferAnalytics)
async def get_offer_analytics(merchant_id: str, days: int = Query(7, ge=1, le=90)):
    since = datetime.now(timezone.utc) - timedelta(days=days - 1)
    since_day = since.strftime("%Y-%m-%d")
    cursor = db.offer_events.find(
        {"merchantId": str(merchant_id), "day": {"$gte": since_day}},
        {"_id": 0, "eventType": 1, "customerId": 1, "day": 1},
    )
    events = await cursor.to_list(50000)

    by_day = {}
    for i in range(days):
        d = (since + timedelta(days=i)).strftime("%Y-%m-%d")
        by_day[d] = {"views": 0, "taps": 0}
    views = taps = 0
    viewers = set()
    for e in events:
        bucket = by_day.setdefault(e["day"], {"views": 0, "taps": 0})
        if e["eventType"] == "VIEW":
            views += 1
            bucket["views"] += 1
            if e.get("customerId"):
                viewers.add(e["customerId"])
        else:
            taps += 1
            bucket["taps"] += 1

    return OfferAnalytics(
        merchantId=str(merchant_id),
        days=days,
        views=views,
        taps=taps,
        uniqueViewers=len(viewers),
        byDay=[OfferDayStat(date=d, **v) for d, v in sorted(by_day.items())],
    )


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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