(function($){
    "use strict";
    $(document).ready(function ($) {

    /*-----------------------------------------------------------------------------------*/
    /*	Scroll to Top
    /*-----------------------------------------------------------------------------------*/
    $(function () {
        $(window).scroll(function () {
            if (!$('body').hasClass('probably-mobile')) {
                if ($(this).scrollTop() > 250) {
                    $('a#scroll-top').fadeIn();
                } else {
                    $('a#scroll-top').fadeOut();
                }
            }
            else {
                $('a#scroll-top').fadeOut();
            }
        });
    });

    /*-----------------------------------------------------------------*/
    /* Animated Buttons Effects
    /*-----------------------------------------------------------------*/
    var animatedButton = $(this).find('a.transition-btn');
    animatedButton.wrapInner().wrapInner('<i>');
    animatedButton.append('<span>');

    /*-----------------------------------------------------------------*/
    /* Animations Effects
    /*-----------------------------------------------------------------*/
    $('.animated').appear();

    $(document.body).on('appear', '.fade', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fade')
        });
    });
    $(document.body).on('appear', '.slide-animate', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-slide-animate')
        });
    });
    $(document.body).on('appear', '.hatch', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-hatch')
        });
    });
    $(document.body).on('appear', '.entrance', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-entrance')
        });
    });
    $(document.body).on('appear', '.tada', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-tada')
        });
    });
    $(document.body).on('appear', '.rotate-up', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-rotate-up')
        });
    });
    $(document.body).on('appear', '.rotate-down', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-rotate-down')
        });
    });
    $(document.body).on('appear', '.fadeInDown', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInDown')
        });
    });
    $(document.body).on('appear', '.fadeInUp', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInUp')
        });
    });
    $(document.body).on('appear', '.fadeInLeft', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInLeft')
        });
    });
    $(document.body).on('appear', '.fadeInRight', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInRight')
        });
    });
    $(document.body).on('appear', '.fadeInDownBig', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInDownBig')
        });
    });
    $(document.body).on('appear', '.fadeInUpBig', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInUpBig')
        });
    });
    $(document.body).on('appear', '.fadeInLeftBig', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInLeftBig')
        });
    });
    $(document.body).on('appear', '.fadeInRightBig', function () {
        $(this).each(function () {
            $(this).addClass('ae-animation-fadeInRightBig')
        });
    });


    if ( navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1 ){
        // Yep, it's Safari =)
        $('body').addClass('safari');
    }

});

})(jQuery);

// Remove autoform package CSS in order for the theme (MedicalPress) to work
AutoForm.setDefaultTemplate('plain');
// Global Template events related to the theme (MedicalPress).
// Every ROOT template must register them for the theme to work correctly (child templates will inherit them).
// TODO / NOTE: The whole jQuery code defined above must be moved below:
// 1) Move UI-input events (clicks etc) in commonEvents
// 2) Move UI engine events (i.e. "OnDocumentReady" code) in commonRendered

// Global events
// fixed with gwendall:body-events
Template.body.events({
  "click .message .close": function(event, template){
        $(this).closest('.message').slideUp(300);
  }
});
