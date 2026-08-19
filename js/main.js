(function(){
  "use strict";

  /* ---------- page loader ---------- */
  var pageLoader = document.getElementById('page-loader');
  if(pageLoader){
    var loaderStart = Date.now();
    var loaderMinShow = 500;
    var hideLoader = function(){
      var wait = Math.max(0, loaderMinShow - (Date.now() - loaderStart));
      setTimeout(function(){
        pageLoader.classList.add('loaded');
        setTimeout(function(){ pageLoader.remove(); }, 600);
      }, wait);
    };
    if(document.readyState === 'complete'){ hideLoader(); }
    else { window.addEventListener('load', hideLoader); }
  }

  /* ---------- header shrink on scroll (rAF-throttled) ---------- */
  var header = document.getElementById('site-header');
  var backTop = document.getElementById('back-to-top');
  var scrollTicking = false;
  function onScroll(){
    var y = window.scrollY;
    if(header){ header.classList.toggle('scrolled', y > 40); }
    if(backTop){ backTop.classList.toggle('show', y > 600); }
    scrollTicking = false;
  }
  document.addEventListener('scroll', function(){
    if(!scrollTicking){
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, {passive:true});
  requestAnimationFrame(onScroll);

  if(backTop){
    backTop.addEventListener('click', function(){
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  /* ---------- mobile nav toggle ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  if(navToggle && mainNav){
    var offCanvasQuery = window.matchMedia('(max-width:1240px)');
    var syncNavA11y = function(){
      var isOpen = mainNav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      mainNav.toggleAttribute('inert', offCanvasQuery.matches && !isOpen);
    };
    var closeNav = function(){
      navToggle.classList.remove('active');
      mainNav.classList.remove('open');
      syncNavA11y();
    };
    navToggle.addEventListener('click', function(){
      var willOpen = !mainNav.classList.contains('open');
      navToggle.classList.toggle('active', willOpen);
      mainNav.classList.toggle('open', willOpen);
      syncNavA11y();
    });
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && mainNav.classList.contains('open')){ closeNav(); navToggle.focus(); }
    });
    if(offCanvasQuery.addEventListener){ offCanvasQuery.addEventListener('change', syncNavA11y); }
    syncNavA11y();
  }

  /* ---------- scroll reveal ----------
     A negative bottom rootMargin shrinks the box an element must enter to
     count as "visible", which can strand items that sit right at the very
     bottom of the page (there's no further scroll room left to push them
     across that shrunk line) — they'd stay opacity:0 forever. Use a plain
     0-margin box, and as a safety net also force-reveal anything left over
     once the user nears the bottom of the page or the page finishes
     loading, so content can never get permanently stuck invisible. */
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
  var galItems = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  var allRevealables = Array.prototype.slice.call(revealEls).concat(galItems);

  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.1, rootMargin:'0px 0px 0px 0px'});
    allRevealables.forEach(function(el){ io.observe(el); });

    var revealRest = function(){
      allRevealables.forEach(function(el){
        if(!el.classList.contains('in')){ el.classList.add('in'); io.unobserve(el); }
      });
    };
    window.addEventListener('load', revealRest);
    document.addEventListener('scroll', function(){
      var scrolledNearBottom = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 200;
      if(scrolledNearBottom){ revealRest(); }
    }, {passive:true});
  } else {
    allRevealables.forEach(function(el){ el.classList.add('in'); });
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

  function bindGalItem(item){
    item.addEventListener('click', function(){ openLightbox(item); });
  }
  galItems.forEach(bindGalItem);

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

  /* ---------- full gallery: hidden (and its lazy images unloaded) until clicked ---------- */
  var galleryToggle = document.getElementById('gallery-toggle');
  var galleryGrid = document.getElementById('full-gallery-grid');
  if(galleryToggle && galleryGrid){
    var galleryLabel = galleryToggle.querySelector('.gallery-toggle-label');
    galleryToggle.addEventListener('click', function(){
      var willShow = galleryGrid.hasAttribute('hidden');
      if(willShow){ galleryGrid.removeAttribute('hidden'); }
      else { galleryGrid.setAttribute('hidden', ''); }
      galleryToggle.setAttribute('aria-expanded', String(willShow));
      if(galleryLabel){ galleryLabel.textContent = willShow ? 'Ukryj galerię' : 'Zobacz całą galerię'; }
      if(willShow){ galleryGrid.scrollIntoView({behavior:'smooth', block:'nearest'}); }
    });
  }

  /* ---------- YouTube facade: load real embed only after click ---------- */
  var videoFacade = document.getElementById('video-facade');
  if(videoFacade){
    videoFacade.addEventListener('click', function(){
      var id = videoFacade.getAttribute('data-video-id');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = 'ROTAR — film z realizacji';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      videoFacade.replaceWith(iframe);
    });
  }

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

})();
