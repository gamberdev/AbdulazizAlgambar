from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy import func
from .models import Appointment, AppointmentStatus
from . import DbSession as db


def _revenue_query_base():
    return db.session.query(
        func.date(Appointment.start_datetime).label("day"),
        func.count(Appointment.id).label("count"),
        func.sum(
            func.coalesce(Appointment.price_override, 0)
        ).label("sum_override"),
        func.sum(0).label("sum_zero"),
    ).filter(Appointment.status.in_([AppointmentStatus.BOOKED.value, AppointmentStatus.COMPLETED.value]))


def daily_report(day: date) -> Dict[str, Any]:
    start_dt = datetime.combine(day, datetime.min.time())
    end_dt = start_dt + timedelta(days=1)

    q = db.session.query(Appointment).filter(
        Appointment.start_datetime >= start_dt,
        Appointment.start_datetime < end_dt,
        Appointment.status.in_([AppointmentStatus.BOOKED.value, AppointmentStatus.COMPLETED.value]),
    )
    appointments: List[Appointment] = q.all()

    count = len(appointments)
    total = Decimal("0.00")
    for appt in appointments:
        total += Decimal(str(appt.get_effective_price()))

    return {
        "date": day.isoformat(),
        "count": count,
        "total": float(total),
        "appointments": appointments,
    }


def monthly_report(year: int, month: int) -> Dict[str, Any]:
    first = date(year, month, 1)
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    q = db.session.query(Appointment).filter(
        Appointment.start_datetime >= datetime.combine(first, datetime.min.time()),
        Appointment.start_datetime < datetime.combine(next_month, datetime.min.time()),
        Appointment.status.in_([AppointmentStatus.BOOKED.value, AppointmentStatus.COMPLETED.value]),
    )
    appointments: List[Appointment] = q.all()

    count = len(appointments)
    total = Decimal("0.00")
    by_day: Dict[str, Dict[str, Any]] = {}
    for appt in appointments:
        total += Decimal(str(appt.get_effective_price()))
        key = appt.start_datetime.date().isoformat()
        if key not in by_day:
            by_day[key] = {"count": 0, "total": Decimal("0.00")}
        by_day[key]["count"] += 1
        by_day[key]["total"] += Decimal(str(appt.get_effective_price()))

    by_day_out = {k: {"count": v["count"], "total": float(v["total"]) } for k, v in by_day.items()}

    return {
        "year": year,
        "month": month,
        "count": count,
        "total": float(total),
        "by_day": by_day_out,
        "appointments": appointments,
    }