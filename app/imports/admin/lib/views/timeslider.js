import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.min.css';

Template.timeSlider.onRendered(function() {
    var sliderDiv = document.getElementById("slider"),
    leftValue = document.getElementById('leftvalue'),
    rightValue = document.getElementById('rightvalue');

    // timeSlider uses noUISlider (https://refreshless.com/nouislider/)
    // 0 = initial minutes from start of day
    // 1440 = maximum minutes in a day
    // step: 30 = amount of minutes to step by. 
    var timeToNumber = function(time){
        return parseInt(time.substr(0,2)) * 60 + parseInt(time.substr(3,2));
    }
    // if reactivevars don't exist, set 9-5 as a default range
    var initialStartMinute = workFrom.get() ? timeToNumber(workFrom.get()) : 540,
        initialEndMinute = workTo.get() ? timeToNumber(workTo.get()) : 1020,
        step = 30;

    var slider = noUiSlider.create(sliderDiv,{
        start:[initialStartMinute,initialEndMinute],
        connect:true,
        step:step,
        range:{
            'min':0,
            'max':1439
        }
    });

    var convertValuesToTime = function(values,handle){
        var hours = 0,
            minutes = 0;
        
        if(handle === 0){
            hours = convertToHour(values[0]);
            minutes = convertToMinute(values[0],hours);
            let theValue = formatHoursAndMinutes(hours,minutes);
            leftValue.innerHTML = theValue;
            workFrom.set(theValue);
            return;
        };

        hours = convertToHour(values[1]);
        minutes = convertToMinute(values[1],hours);
        let theValue = formatHoursAndMinutes(hours,minutes);
        rightValue.innerHTML = theValue;
        workTo.set(theValue);
    };

    var convertToHour = function(value){
        return Math.floor(value / 60);
    };
    var convertToMinute = function(value,hour){
        return value - hour * 60;
    };
    var formatHoursAndMinutes = function(hours,minutes){
        if(hours.toString().length == 1) hours = '0' + hours;
        if(minutes.toString().length == 1) minutes = '0' + minutes;
        return hours+':'+minutes;
    };

    slider.on('update',function(values,handle){
        convertValuesToTime(values,handle);
    });
});
