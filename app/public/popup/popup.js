"use strict";
var Experts = {
    initFloatingButton: function initFloatingButton(a) {
        var b = this;
        b.modal;
        b.url = a.url;
        b.color = a.color;
        b.background = a.background;
        document.addEventListener("DOMContentLoaded", function() {
            b.floatingButton();
            document.querySelector(".experts-floating-button").addEventListener("click", function() {
                b.openModal()
            })
        })
    },
    initStaticButton: function initStaticButton(a) {
        var b = this;
        b.modal;
        b.url = a.url;
        b.openModal()
    },
    floatingButton: function b() {
        var a = this;
        var b = document.createElement("DIV");
        var c = document.createElement("DIV");
        c.style.background = a.background;
        c.style.color = a.color;
        c.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="'.concat(a.color, '" d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
        b.appendChild(c);
        b.className = "experts-floating-button";
        document.body.appendChild(b)
    },
    openModal: function openModal() {
        var a = this;
        document.body.style.overflow = "hidden";
        a.modal = document.createElement("DIV");
        a.modal.className = "experts-overlay";
        var b = document.createElement("DIV");
        b.className = "experts-modal-content";
        b.innerHTML = '<svg class="experts-modal-close"><path fill="#545454" d="m11.99397,9.85478l7.779,-7.778a1.5,1.5 0 0 1 2.12,2.121l-7.777,7.778l7.778,7.779a1.5,1.5 0 1 1 -2.121,2.12l-7.779,-7.777l-7.778,7.778a1.5,1.5 0 1 1 -2.121,-2.121l7.778,-7.779l-7.778,-7.778a1.5,1.5 0 0 1 2.121,-2.121l7.778,7.778z" fill-rule="evenodd"></path></svg>';
        var c = document.createElement("IFRAME");
        c.src = a.url;
        c.frameBorder = 0;
        b.appendChild(c);
        a.modal.appendChild(b);
        document.body.appendChild(a.modal);
        document.querySelector(".experts-overlay").addEventListener("click", function() {
            a.closeModal()
        });
        document.querySelector(".experts-modal-close").addEventListener("click", function() {
            a.closeModal()
        })
    },
    closeModal: function closeModal() {
        var a = this;
        a.modal.remove();
        document.body.style.overflow = ""
    }
};