from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RestaurantBase(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    description: Optional[str] = None


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RestaurantResponse(RestaurantBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
