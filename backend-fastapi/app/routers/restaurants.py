from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from ..models import Restaurant

router = APIRouter()


@router.post(
    "/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED
)
def create_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    """Create new restaurant"""
    db_restaurant = (
        db.query(Restaurant).filter(Restaurant.code == restaurant.code).first()
    )
    if db_restaurant:
        raise HTTPException(status_code=400, detail="Restaurant code already exists")

    new_restaurant = Restaurant(**restaurant.model_dump())
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return new_restaurant


@router.get("/", response_model=List[RestaurantResponse])
def get_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all restaurants"""
    restaurants = db.query(Restaurant).offset(skip).limit(limit).all()
    return restaurants


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Get restaurant by ID"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: str,
    restaurant_update: RestaurantUpdate,
    db: Session = Depends(get_db),
):
    """Update restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    update_data = restaurant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(restaurant, key, value)

    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Delete restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    db.delete(restaurant)
    db.commit()
    return None
