from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from . import DbSession as db


class AppointmentStatus(str, Enum):
    BOOKED = "booked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Customer(db.Model):
    __tablename__ = "customers"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True, index=True)
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    appointments = db.relationship("Appointment", back_populates="customer", cascade="all, delete-orphan")


class Service(db.Model):
    __tablename__ = "services"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    duration_minutes = db.Column(db.Integer, nullable=False, default=60)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    appointments = db.relationship("Appointment", back_populates="service")


class Appointment(db.Model):
    __tablename__ = "appointments"
    id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)

    start_datetime = db.Column(db.DateTime, nullable=False, index=True)
    end_datetime = db.Column(db.DateTime, nullable=False)

    price_override = db.Column(db.Numeric(10, 2), nullable=True)
    status = db.Column(db.String(20), nullable=False, default=AppointmentStatus.BOOKED.value)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    customer = db.relationship("Customer", back_populates="appointments")
    service = db.relationship("Service", back_populates="appointments")

    def get_effective_price(self):
        return self.price_override if self.price_override is not None else self.service.price

    @staticmethod
    def compute_end_time(start_time: datetime, service: Service) -> datetime:
        duration_minutes = service.duration_minutes or 60
        return start_time + timedelta(minutes=duration_minutes)


class Setting(db.Model):
    __tablename__ = "settings"
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)


class NotificationLog(db.Model):
    __tablename__ = "notification_logs"
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=True)
    channel = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


def revenue_status_filter_query():
    return Appointment.query.filter(Appointment.status.in_([AppointmentStatus.BOOKED.value, AppointmentStatus.COMPLETED.value]))