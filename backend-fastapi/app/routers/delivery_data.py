from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..schemas.delivery_data import (
    DeliveryDataCreate,
    DeliveryDataUpdate,
    DeliveryDataResponse,
    DeliveryDataFilter,
)
from ..models import DeliveryData

router = APIRouter()


@router.post(
    "/", response_model=DeliveryDataResponse, status_code=status.HTTP_201_CREATED
)
def create_delivery_data(delivery: DeliveryDataCreate, db: Session = Depends(get_db)):
    """Create new delivery data entry"""
    db_delivery = (
        db.query(DeliveryData)
        .filter(DeliveryData.order_id == delivery.order_id)
        .first()
    )
    if db_delivery:
        raise HTTPException(status_code=400, detail="Order ID already exists")

    new_delivery = DeliveryData(**delivery.model_dump())
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    return new_delivery


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_bulk_delivery_data(
    deliveries: List[DeliveryDataCreate], db: Session = Depends(get_db)
):
    """Create multiple delivery data entries"""
    created_count = 0
    for delivery in deliveries:
        existing = (
            db.query(DeliveryData)
            .filter(DeliveryData.order_id == delivery.order_id)
            .first()
        )
        if not existing:
            new_delivery = DeliveryData(**delivery.model_dump())
            db.add(new_delivery)
            created_count += 1

    db.commit()
    return {"created": created_count, "total": len(deliveries)}


@router.get("/", response_model=List[DeliveryDataResponse])
def get_delivery_data(
    skip: int = 0,
    limit: int = 100,
    restaurant_id: Optional[str] = None,
    order_month: Optional[str] = None,
    is_delayed: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Get delivery data with optional filters"""
    query = db.query(DeliveryData)

    if restaurant_id:
        query = query.filter(DeliveryData.restaurant_id == restaurant_id)
    if order_month:
        query = query.filter(DeliveryData.order_month == order_month)
    if is_delayed is not None:
        query = query.filter(DeliveryData.is_delayed == is_delayed)

    deliveries = query.offset(skip).limit(limit).all()
    return deliveries


@router.get("/{delivery_id}", response_model=DeliveryDataResponse)
def get_delivery_data_by_id(delivery_id: str, db: Session = Depends(get_db)):
    """Get delivery data by ID"""
    delivery = db.query(DeliveryData).filter(DeliveryData.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery data not found")
    return delivery


@router.put("/{delivery_id}", response_model=DeliveryDataResponse)
def update_delivery_data(
    delivery_id: str, delivery_update: DeliveryDataUpdate, db: Session = Depends(get_db)
):
    """Update delivery data"""
    delivery = db.query(DeliveryData).filter(DeliveryData.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery data not found")

    update_data = delivery_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(delivery, key, value)

    db.commit()
    db.refresh(delivery)
    return delivery


@router.delete("/{delivery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_data(delivery_id: str, db: Session = Depends(get_db)):
    """Delete delivery data"""
    delivery = db.query(DeliveryData).filter(DeliveryData.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery data not found")

    db.delete(delivery)
    db.commit()
    return None


@router.get("/stats/summary")
def get_delivery_summary(
    restaurant_id: Optional[str] = None, db: Session = Depends(get_db)
):
    """Get delivery statistics summary"""
    query = db.query(DeliveryData)

    if restaurant_id:
        query = query.filter(DeliveryData.restaurant_id == restaurant_id)

    deliveries = query.all()

    total_orders = len(deliveries)
    delayed_orders = sum(1 for d in deliveries if d.is_delayed)
    total_revenue = sum(d.estimated_duration * 100 for d in deliveries)  # Simplified

    return {
        "total_orders": total_orders,
        "delayed_orders": delayed_orders,
        "on_time_orders": total_orders - delayed_orders,
        "delay_rate": round(delayed_orders / total_orders * 100, 2)
        if total_orders > 0
        else 0,
        "total_revenue": round(total_revenue, 2),
    }
