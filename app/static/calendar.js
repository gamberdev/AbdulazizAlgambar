document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    navLinks: true,
    weekNumbers: false,
    editable: false,
    selectable: false,
    events: '/api/events',
    eventClick: function(info) {
      if (info.event.url) {
        window.location.href = info.event.url;
        info.jsEvent.preventDefault();
      }
    },
  });
  calendar.render();
});