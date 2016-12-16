'use strict';

if(document.getElementById( 'claimsInfo' )) {
  let modalButtons = [
    document.getElementById( 'claimsInfo' ),
    document.getElementById( 'transferInfo' ),
    document.getElementById( 'cancelInfo' ),
    document.getElementById( 'renewInfo' ) ||
    document.getElementById( 'eligibilityInfo' )
  ];

  let modals = [
    document.getElementById( 'claimsModal' ),
    document.getElementById( 'transferModal' ),
    document.getElementById( 'cancelModal' ),
    document.getElementById( 'renewModal' ) ||
    document.getElementById( 'eligibilityModal' )
  ];

  let closeButtons = [];

  modalButtons.forEach((el, i, arr) => {
    el.addEventListener('click', () => {
      modals[i].style.display = "block";
    });

    closeButtons[i] = modals[i].querySelector(".close");
  });

  closeButtons.forEach((el, i) => {
    el.addEventListener('click', () => {
      modals[i].style.display = "none";
    });
  });

  window.onclick = function(event) {
    if (modals.includes(event.target)) {
      modals.forEach(el => {
        el.style.display = "none";
      });
    }
  };
}

let headers = [
  document.querySelector( '.faq1' ),
  document.querySelector( '.faq2' ),
  document.querySelector( '.faq3' ),
  document.querySelector( '.faq4' ),
  document.querySelector( '.faq5' ),
  document.querySelector( '.faq6' ),
  document.querySelector( '.faq7' ),
  document.querySelector( '.faq8' ),
  document.querySelector( '.faq9' ),
  document.querySelector( '.faq10' ),
  document.querySelector( '.faq11' ),
  document.querySelector( '.faq12' ),
  document.querySelector( '.faq13' ),
  document.querySelector( '.faq14' ),
  document.querySelector( '.faq15' ),
  document.querySelector( '.faq16' ),
];

headers.forEach((el, i, arr) => {
  if(el != null) {
    el.addEventListener( "click", function() {
      document.querySelector("." + this.className + " ~ div").classList.toggle( "open" );
    });
  }
});

document.querySelector( ".burger" ).addEventListener( "click", function() {
  this.classList.toggle( "active" );
  document.querySelector( ".container" ).classList.toggle('closed');
});
