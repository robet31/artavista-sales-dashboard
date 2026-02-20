from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DeliveryData
from ..services.polars_service import PolarsDataProcessor
import polars as pl

router = APIRouter()


@router.get("/all-data")
async def get_all_data_for_analytics(
    restaurant_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    """Get all delivery data for analytics, forecasting, and recommendation"""
    query = db.query(DeliveryData)

    if restaurant_id:
        query = query.filter(DeliveryData.restaurantId == restaurant_id)

    deliveries = query.all()

    if not deliveries:
        return {"success": True, "data": [], "message": "No data available"}

    data = []
    for d in deliveries:
        data.append(
            {
                "order_id": d.orderId,
                "restaurant_id": d.restaurantId,
                "order_date": d.orderTime.isoformat() if d.orderTime else None,
                "order_time": d.orderTime.isoformat() if d.orderTime else None,
                "order_hour": d.orderHour,
                "order_month": d.orderMonth,
                "pizza_size": d.pizzaSize,
                "pizza_type": d.pizzaType,
                "quantity": d.toppingsCount,
                "price": d.estimatedDuration,
                "payment_method": d.paymentMethod,
                "distance_km": d.distanceKm,
                "delivery_time": d.deliveryTime.isoformat() if d.deliveryTime else None,
                "estimated_duration": d.estimatedDuration,
                "is_delayed": d.isDelayed,
                "traffic_level": d.trafficLevel,
            }
        )

    return {"success": True, "data": data, "total": len(data)}


@router.get("/summary")
async def get_data_summary(
    restaurant_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    """Get summary of delivery data for dashboard"""
    query = db.query(DeliveryData)

    if restaurant_id:
        query = query.filter(DeliveryData.restaurantId == restaurant_id)

    total = query.count()

    if total == 0:
        return {
            "success": True,
            "total_orders": 0,
            "total_revenue": 0,
            "avg_delivery_time": 0,
            "avg_distance": 0,
            "on_time_rate": 0,
            "delayed_orders": 0,
        }

    delayed = query.filter(DeliveryData.isDelayed == True).count()

    all_data = query.all()
    total_revenue = sum(d.estimatedDuration or 0 for d in all_data)
    avg_delivery = (
        sum(d.estimatedDuration or 0 for d in all_data) / total if total > 0 else 0
    )
    avg_distance = sum(d.distanceKm or 0 for d in all_data) / total if total > 0 else 0

    return {
        "success": True,
        "total_orders": total,
        "total_revenue": total_revenue,
        "avg_delivery_time": round(avg_delivery, 2),
        "avg_distance": round(avg_distance, 2),
        "on_time_rate": round((total - delayed) / total * 100, 2) if total > 0 else 0,
        "delayed_orders": delayed,
    }


@router.get("/columns")
async def get_columns():
    """Get available columns for forecasting and recommendation"""
    return {
        "success": True,
        "columns": [
            "order_date",
            "order_time",
            "order_hour",
            "order_month",
            "pizza_size",
            "pizza_type",
            "quantity",
            "price",
            "payment_method",
            "distance_km",
            "delivery_time",
            "estimated_duration",
            "is_delayed",
            "traffic_level",
        ],
        "date_columns": ["order_date", "order_time", "delivery_time"],
        "numeric_columns": ["quantity", "price", "distance_km", "estimated_duration"],
        "categorical_columns": [
            "pizza_size",
            "pizza_type",
            "payment_method",
            "traffic_level",
            "order_month",
            "order_hour",
        ],
    }
