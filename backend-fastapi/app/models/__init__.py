from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, Text
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36), primary_key=True, default=lambda: __import__("uuid").uuid4()
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="STAFF")
    position = Column(String(50), default="STAFF")
    restaurant_id = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(
        String(36), primary_key=True, default=lambda: __import__("uuid").uuid4()
    )
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class DeliveryData(Base):
    __tablename__ = "DeliveryData"

    id = Column(
        String(36), primary_key=True, default=lambda: __import__("uuid").uuid4()
    )
    orderId = Column(String(50), unique=True, nullable=False, index=True)
    restaurantId = Column(String(36), nullable=False, index=True)

    location = Column(String(255), nullable=False)
    orderTime = Column(DateTime, nullable=False, index=True)
    deliveryTime = Column(DateTime, nullable=False)
    deliveryDuration = Column(Integer)
    orderMonth = Column(String(7), index=True)
    orderHour = Column(Integer)

    pizzaSize = Column(String(50))
    pizzaType = Column(String(50))
    toppingsCount = Column(Integer)
    pizzaComplexity = Column(Integer)
    toppingDensity = Column(Float)

    distanceKm = Column(Float)
    trafficLevel = Column(String(50))
    trafficImpact = Column(Integer)
    isPeakHour = Column(Boolean)
    isWeekend = Column(Boolean)

    paymentMethod = Column(String(50))
    paymentCategory = Column(String(50))
    estimatedDuration = Column(Float)
    deliveryEfficiency = Column(Float)
    delayMin = Column(Float)
    isDelayed = Column(Boolean, index=True)

    restaurantAvgTime = Column(Float)

    uploadedBy = Column(String(50))
    uploadedAt = Column(DateTime, server_default=func.now())
    validatedAt = Column(DateTime, nullable=True)
    validatedBy = Column(String(50), nullable=True)
    qualityScore = Column(Float)
    version = Column(Integer, default=1)
