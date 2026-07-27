(function(){
  "use strict";

  /* ---------- header shrink on scroll ---------- */
  var header = document.getElementById('site-header');
  var backTop = document.getElementById('back-to-top');
  function onScroll(){
    var y = window.scrollY || document.documentElement.scrollTop;
    if(header){ header.classList.toggle('scrolled', y > 40); }
    if(backTop){ backTop.classList.toggle('show', y > 600); }
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  if(backTop){
    backTop.addEventListener('click', function(){
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  /* ---------- mobile nav toggle ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  if(navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      navToggle.classList.toggle('active');
      mainNav.classList.toggle('open');
    });
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navToggle.classList.remove('active');
        mainNav.classList.remove('open');
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.15, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- offer tabs ---------- */
  var tabBtns = document.querySelectorAll('.tab-btn');
  var tabPanels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-tab');
      tabBtns.forEach(function(b){ b.classList.toggle('active', b === btn); });
      tabPanels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel') === target); });
    });
  });

  /* ---------- build full "hale" gallery on demand ---------- */
  var haleExtra = document.getElementById('gal-hale-extra');
  if(haleExtra){
    var frag = document.createDocumentFragment();
    for(var h = 1; h <= 42; h++){
      var idx = ('0' + h).slice(-2);
      frag.appendChild(makeGalItem('img/hale/hale-' + idx + '.jpg', 'Hala i konstrukcja stalowa ROTAR ' + h, 'hale'));
    }
    haleExtra.appendChild(frag);
  }
  function makeGalItem(src, alt, group){
    var div = document.createElement('div');
    div.className = 'gal-item';
    div.setAttribute('data-group', group);
    div.innerHTML = '<img src="' + src + '" data-full="' + src + '" alt="' + alt + '" loading="lazy">' +
      '<span class="zoom">' + zoomIconMarkup() + '</span>';
    return div;
  }
  function zoomIconMarkup(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3M9 11h4M11 9v4"></path></svg>';
  }

  var haleMoreBtn = document.getElementById('gal-more-btn');
  if(haleMoreBtn && haleExtra){
    haleMoreBtn.addEventListener('click', function(){
      haleExtra.hidden = false;
      haleMoreBtn.style.display = 'none';
    });
  }

  /* ---------- gallery items + reveal ---------- */
  var galItems = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  if('IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io2.unobserve(entry.target);
        }
      });
    }, {threshold:.1, rootMargin:'0px 0px -40px 0px'});
    galItems.forEach(function(el){ io2.observe(el); });
  } else {
    galItems.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- lightbox (grouped per category) ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  var lbCounter = document.getElementById('lightbox-counter');
  var currentSet = [];
  var currentIndex = 0;

  function isVisible(el){ return !!(el.offsetParent !== null); }

  function openLightbox(item){
    var group = item.getAttribute('data-group');
    currentSet = galItems.filter(function(i){
      return i.getAttribute('data-group') === group && isVisible(i);
    });
    currentIndex = currentSet.indexOf(item);
    if(currentIndex < 0){ currentIndex = 0; }
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function updateLightbox(){
    if(!currentSet.length) return;
    var item = currentSet[currentIndex];
    var img = item.querySelector('img');
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt || '';
    lbCounter.textContent = (currentIndex + 1) + ' / ' + currentSet.length;
  }
  function step(dir){
    if(!currentSet.length) return;
    currentIndex = (currentIndex + dir + currentSet.length) % currentSet.length;
    updateLightbox();
  }

  galItems.forEach(function(item){
    item.addEventListener('click', function(){ openLightbox(item); });
  });
  var realStripFigs = document.querySelectorAll('.real-strip figure');
  realStripFigs.forEach(function(fig){
    fig.addEventListener('click', function(){
      var img = fig.querySelector('img');
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt || '';
      currentSet = [];
      lbCounter.textContent = '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  var lbClose = document.querySelector('.lightbox-close');
  var lbPrev = document.querySelector('.lightbox-prev');
  var lbNext = document.querySelector('.lightbox-next');
  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  if(lbPrev) lbPrev.addEventListener('click', function(){ step(-1); });
  if(lbNext) lbNext.addEventListener('click', function(){ step(1); });
  if(lightbox){
    lightbox.addEventListener('click', function(e){
      if(e.target === lightbox){ closeLightbox(); }
    });
  }
  document.addEventListener('keydown', function(e){
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowRight') step(1);
    if(e.key === 'ArrowLeft') step(-1);
  });

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

})();
