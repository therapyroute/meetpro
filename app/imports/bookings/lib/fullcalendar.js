import fullCalendar from 'fullcalendar';
import 'fullcalendar/dist/fullcalendar.min.css';
import 'fullcalendar/dist/lang/el.js';
import 'fullcalendar/dist/lang/en-gb.js';

window.moment = moment;

Template.fullcalendar.rendered = function() {
    var div = this.$(this.firstNode);
    if(this.data != null) {
        //jquery takes care of undefined values, no need to check here
        div.attr('id', this.data.id);
        div.addClass(this.data.class);
    }
    div.fullCalendar(this.data);
};
