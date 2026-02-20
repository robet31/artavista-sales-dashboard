from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DeliveryDataBase(BaseModel):
    order_id: str
    restaurant_id: str
    location: str
    order_time: datetime
    delivery_time: datetime
    delivery_duration: int
    order_month: str
    order_hour: int
    pizza_size: str
    pizza_type: str
    toppings_count: int
    pizza_complexity: int
    topping_density: Optional[float] = None
    distance_km: float
    traffic_level: str
    traffic_impact: int
    is_peak_hour: bool
    is_weekend: bool
    payment_method: str
    payment_category: str
    estimated_duration: float
    delivery_efficiency: Optional[float] = None
    delay_min: float
    is_delayed: bool
    restaurant_avg_time: Optional[float] = None
    uploaded_by: str


class DeliveryDataCreate(DeliveryDataBase):
    pass


class DeliveryDataUpdate(BaseModel):
    validated_at: Optional[datetime] = None
    validated_by: Optional[str] = None
    quality_score: Optional[float] = None


class DeliveryDataResponse(DeliveryDataBase):
    id: str
    uploaded_at: datetime
    validated_at: Optional[datetime] = None
    validated_by: Optional[str] = None
    quality_score: Optional[float] = None
    version: int

    class Config:
        from_attributes = True


class DeliveryDataFilter(BaseModel):
    restaurant_id: Optional[str] = None
    order_month: Optional[str] = None
    is_delayed: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
