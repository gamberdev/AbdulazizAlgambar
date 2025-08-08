from datetime import datetime, date
from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from sqlalchemy import asc, desc
from . import DbSession as db
from .models import Customer, Service, Appointment, AppointmentStatus
from .notifications import send_whatsapp_message
from .reporting import daily_report, monthly_report

bp = Blueprint("routes", __name__)


@bp.route("/")
def index():
    today = date.today()
    drep = daily_report(today)
    # Quick month summary
    mrep = monthly_report(today.year, today.month)
    return render_template("index.html", daily=drep, monthly=mrep)


@bp.route("/calendar")
def calendar_view():
    return render_template("calendar.html")


@bp.route("/api/events")
def api_events():
    # FullCalendar provides start/end range
    start_str = request.args.get("start")
    end_str = request.args.get("end")
    try:
        start = datetime.fromisoformat(start_str) if start_str else datetime.min
        end = datetime.fromisoformat(end_str) if end_str else datetime.max
    except Exception:  # noqa: BLE001
        start, end = datetime.min, datetime.max

    appts = (
        Appointment.query.filter(Appointment.start_datetime >= start, Appointment.start_datetime <= end)
        .order_by(asc(Appointment.start_datetime))
        .all()
    )
    events = []
    for a in appts:
        events.append(
            {
                "id": a.id,
                "title": f"{a.customer.name} - {a.service.name}",
                "start": a.start_datetime.isoformat(),
                "end": a.end_datetime.isoformat(),
                "url": url_for("routes.edit_appointment", appointment_id=a.id),
                "status": a.status,
            }
        )
    return jsonify(events)


# Customers
@bp.route("/customers")
def customers_list():
    customers = Customer.query.order_by(asc(Customer.name)).all()
    return render_template("customers_list.html", customers=customers)


@bp.route("/customers/new", methods=["GET", "POST"])
def new_customer():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        notes = request.form.get("notes", "").strip()
        if not name:
            flash("Name is required", "danger")
            return render_template("customer_form.html", customer=None)
        c = Customer(name=name, phone=phone or None, notes=notes or None)
        db.session.add(c)
        db.session.commit()
        flash("Customer created", "success")
        return redirect(url_for("routes.customers_list"))
    return render_template("customer_form.html", customer=None)


@bp.route("/customers/<int:customer_id>/edit", methods=["GET", "POST"])
def edit_customer(customer_id: int):
    c = Customer.query.get_or_404(customer_id)
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        notes = request.form.get("notes", "").strip()
        c.name = name or c.name
        c.phone = phone or None
        c.notes = notes or None
        db.session.commit()
        flash("Customer updated", "success")
        return redirect(url_for("routes.customers_list"))
    return render_template("customer_form.html", customer=c)


@bp.route("/customers/<int:customer_id>/delete", methods=["POST"])
def delete_customer(customer_id: int):
    c = Customer.query.get_or_404(customer_id)
    db.session.delete(c)
    db.session.commit()
    flash("Customer deleted", "success")
    return redirect(url_for("routes.customers_list"))


# Services
@bp.route("/services")
def services_list():
    services = Service.query.order_by(asc(Service.name)).all()
    return render_template("services_list.html", services=services)


@bp.route("/services/new", methods=["GET", "POST"])
def new_service():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        duration = int(request.form.get("duration", "60") or 60)
        price = Decimal(request.form.get("price", "0") or 0)
        if not name:
            flash("Name is required", "danger")
            return render_template("service_form.html", service=None)
        s = Service(name=name, duration_minutes=duration, price=price)
        db.session.add(s)
        db.session.commit()
        flash("Service created", "success")
        return redirect(url_for("routes.services_list"))
    return render_template("service_form.html", service=None)


@bp.route("/services/<int:service_id>/edit", methods=["GET", "POST"])
def edit_service(service_id: int):
    s = Service.query.get_or_404(service_id)
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        duration = int(request.form.get("duration", "60") or 60)
        price = Decimal(request.form.get("price", "0") or 0)
        s.name = name or s.name
        s.duration_minutes = duration
        s.price = price
        db.session.commit()
        flash("Service updated", "success")
        return redirect(url_for("routes.services_list"))
    return render_template("service_form.html", service=s)


@bp.route("/services/<int:service_id>/delete", methods=["POST"])
def delete_service(service_id: int):
    s = Service.query.get_or_404(service_id)
    db.session.delete(s)
    db.session.commit()
    flash("Service deleted", "success")
    return redirect(url_for("routes.services_list"))


# Appointments
@bp.route("/appointments")
def appointments_list():
    appts = Appointment.query.order_by(desc(Appointment.start_datetime)).limit(200).all()
    return render_template("appointments_list.html", appointments=appts)


@bp.route("/appointments/new", methods=["GET", "POST"])
def new_appointment():
    customers = Customer.query.order_by(asc(Customer.name)).all()
    services = Service.query.order_by(asc(Service.name)).all()
    if request.method == "POST":
        customer_id = int(request.form.get("customer_id"))
        service_id = int(request.form.get("service_id"))
        start_str = request.form.get("start_datetime")
        price_override_str = request.form.get("price_override", "").strip()
        notes = request.form.get("notes", "").strip()

        customer = Customer.query.get_or_404(customer_id)
        service = Service.query.get_or_404(service_id)
        start_dt = datetime.fromisoformat(start_str)
        end_dt = Appointment.compute_end_time(start_dt, service)
        price_override = Decimal(price_override_str) if price_override_str else None

        appt = Appointment(
            customer=customer,
            service=service,
            start_datetime=start_dt,
            end_datetime=end_dt,
            price_override=price_override,
            status=AppointmentStatus.BOOKED.value,
            notes=notes or None,
        )
        db.session.add(appt)
        db.session.commit()

        # Notify via WhatsApp if possible
        if customer.phone:
            body = (
                f"Hello {customer.name}, your appointment for {service.name} is booked on "
                f"{start_dt.strftime('%Y-%m-%d %H:%M')}."
            )
            send_whatsapp_message(customer.phone, body, appointment_id=appt.id)

        flash("Appointment created", "success")
        return redirect(url_for("routes.appointments_list"))
    return render_template("appointment_form.html", appointment=None, customers=customers, services=services)


@bp.route("/appointments/<int:appointment_id>/edit", methods=["GET", "POST"])
def edit_appointment(appointment_id: int):
    appt = Appointment.query.get_or_404(appointment_id)
    customers = Customer.query.order_by(asc(Customer.name)).all()
    services = Service.query.order_by(asc(Service.name)).all()

    if request.method == "POST":
        customer_id = int(request.form.get("customer_id"))
        service_id = int(request.form.get("service_id"))
        start_str = request.form.get("start_datetime")
        status = request.form.get("status", AppointmentStatus.BOOKED.value)
        price_override_str = request.form.get("price_override", "").strip()
        notes = request.form.get("notes", "").strip()

        appt.customer = Customer.query.get_or_404(customer_id)
        appt.service = Service.query.get_or_404(service_id)
        appt.start_datetime = datetime.fromisoformat(start_str)
        appt.end_datetime = Appointment.compute_end_time(appt.start_datetime, appt.service)
        appt.status = status
        appt.price_override = Decimal(price_override_str) if price_override_str else None
        appt.notes = notes or None

        db.session.commit()

        # Notify via WhatsApp if possible
        if appt.customer.phone:
            body = (
                f"Hello {appt.customer.name}, your appointment for {appt.service.name} "
                f"is updated to {appt.start_datetime.strftime('%Y-%m-%d %H:%M')}."
            )
            send_whatsapp_message(appt.customer.phone, body, appointment_id=appt.id)

        flash("Appointment updated", "success")
        return redirect(url_for("routes.appointments_list"))

    return render_template("appointment_form.html", appointment=appt, customers=customers, services=services)


@bp.route("/appointments/<int:appointment_id>/delete", methods=["POST"])
def delete_appointment(appointment_id: int):
    appt = Appointment.query.get_or_404(appointment_id)
    db.session.delete(appt)
    db.session.commit()
    flash("Appointment deleted", "success")
    return redirect(url_for("routes.appointments_list"))


# Reports
@bp.route("/reports")
def reports_view():
    today = date.today()
    day = request.args.get("day")
    year = request.args.get("year")
    month = request.args.get("month")

    if day:
        try:
            d = date.fromisoformat(day)
        except ValueError:
            d = today
    else:
        d = today

    if year and month:
        try:
            y = int(year)
            m = int(month)
        except ValueError:
            y = today.year
            m = today.month
    else:
        y = today.year
        m = today.month

    drep = daily_report(d)
    mrep = monthly_report(y, m)
    return render_template("reports.html", daily=drep, monthly=mrep)