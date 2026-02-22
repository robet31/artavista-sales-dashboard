from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    Boolean,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="STAFF")


class Retailer(Base):
    __tablename__ = "retailer"

    id_retailer = Column(Integer, primary_key=True, autoincrement=True)
    retailer_name = Column(String, nullable=False, unique=True)

    transactions = relationship("Transaction", back_populates="retailer")


class Product(Base):
    __tablename__ = "product"

    id_product = Column(Integer, primary_key=True, autoincrement=True)
    product = Column(String, nullable=False, unique=True)

    transactions = relationship("Transaction", back_populates="product")


class Method(Base):
    __tablename__ = "method"

    id_method = Column(Integer, primary_key=True, autoincrement=True)
    method = Column(String, nullable=False, unique=True)

    transactions = relationship("Transaction", back_populates="method")


class State(Base):
    __tablename__ = "state"

    id_state = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String, nullable=False, unique=True)
    region = Column(String, nullable=False)

    cities = relationship("City", back_populates="state")


class City(Base):
    __tablename__ = "city"

    id_city = Column(Integer, primary_key=True, autoincrement=True)
    city = Column(String, nullable=False, unique=True)
    id_state = Column(Integer, ForeignKey("state.id_state"), nullable=False)

    state = relationship("State", back_populates="cities")
    transactions = relationship("Transaction", back_populates="city")


class UploadHistory(Base):
    __tablename__ = "upload_history"

    id_upload = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String, nullable=False)
    system_name = Column(String, nullable=False)
    status = Column(Text, default="PENDING")
    total_rows = Column(Integer, default=0)
    note = Column(Text)
    uploaded_by = Column(String)
    upload_date = Column(String)

    transactions = relationship("Transaction", back_populates="upload_history")


class Transaction(Base):
    __tablename__ = "transaction"

    id_transaction = Column(Integer, primary_key=True, autoincrement=True)
    id_retailer = Column(Integer, ForeignKey("retailer.id_retailer"), nullable=False)
    id_product = Column(Integer, ForeignKey("product.id_product"), nullable=False)
    id_method = Column(Integer, ForeignKey("method.id_method"), nullable=False)
    id_city = Column(Integer, ForeignKey("city.id_city"), nullable=False)
    id_upload = Column(Integer, ForeignKey("upload_history.id_upload"))
    invoice_date = Column(Date)
    price_per_unit = Column(Float)
    unit_sold = Column(Integer)
    total_sales = Column(Float)
    operating_profit = Column(Float)
    operating_margin = Column(Float)
    is_approved = Column(Boolean, default=False)

    retailer = relationship("Retailer", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")
    method = relationship("Method", back_populates="transactions")
    city = relationship("City", back_populates="transactions")
    upload_history = relationship("UploadHistory", back_populates="transactions")


# Legacy models (for backwards compatibility)
class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    location = Column(String)
    description = Column(String)
    is_active = Column(Boolean, default=True)


class DeliveryData(Base):
    __tablename__ = "delivery_data"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, unique=True, nullable=False)
    restaurant_id = Column(String, nullable=False)
    location = Column(String, nullable=False)
    order_time = Column(String, nullable=False)
    delivery_time = Column(String, nullable=False)
    delivery_duration = Column(Integer)
    order_month = Column(String)
    order_hour = Column(Integer)
    pizza_size = Column(String)
    pizza_type = Column(String)
    toppings_count = Column(Integer)
    pizza_complexity = Column(Integer)
    topping_density = Column(Float)
    distance_km = Column(Float)
    traffic_level = Column(String)
    traffic_impact = Column(Integer)
    is_peak_hour = Column(Boolean)
    is_weekend = Column(Boolean)
    payment_method = Column(String)
    payment_category = Column(String)
    estimated_duration = Column(Float)
    delivery_efficiency = Column(Float)
    delay_min = Column(Float)
    is_delayed = Column(Boolean)
    restaurant_avg_time = Column(Float)
    uploaded_by = Column(String)
    uploaded_at = Column(String, default=lambda: str(datetime.now()))
    validated_at = Column(String)
    validated_by = Column(String)
    quality_score = Column(Float)
    version = Column(Integer, default=1)


from datetime import datetime
