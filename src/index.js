// const SimpleBar = require('simplebar');

// let isInit = false;
// function tryInitScroll() {
//   console.log(window.innerWidth);
//   if (window.innerWidth < 1024 && !isInit) {
//     isInit = true;
//     console.log('init');
//     new SimpleBar(document.body, {
//       // autoHide: false,
//       // forceVisible: 'y',
//     });
//   }
// }

// document.addEventListener('resize', _ => {
//   tryInitScroll();
// });
// tryInitScroll();

const $navs = document.getElementsByClassName('nav-select');
for (const $nav of $navs) {
  $nav.addEventListener('change', e => {
    location.href = e.target.value;
  });
}

const $langs = document.getElementsByClassName('change-lang');
for (const $lang of $langs) {
  $lang.addEventListener('click', e => {
    const lang = e.target.dataset.target;
    let show = 'th';
    let hide = 'en';
    if (lang === 'en') {
      show = 'en';
      hide = 'th';
    }
    console.log(hide, show);
    for (const $el of document.getElementsByClassName(hide)) {
      $el.classList.remove('show');
      $el.classList.add('hide');
    }
    for (const $el of document.getElementsByClassName(show)) {
      $el.classList.remove('hide');
      $el.classList.add('show');
    }
  });
}

const $titles = document.getElementsByClassName('title');
const $mobileNavigation = document.getElementsByClassName('m-nav')[0];

let scrollY = window.pageYOffset;
document.addEventListener('scroll', _ => {
  const newScrollY = window.pageYOffset;
  const rect = $mobileNavigation.getBoundingClientRect();
  if (newScrollY > scrollY) {
    if ($mobileNavigation.style.position === 'fixed') {
      $mobileNavigation.style.position = 'absolute';
      $mobileNavigation.style.top = `${newScrollY}px`;
    }
    if (rect.top < -rect.height) {
      $mobileNavigation.style.top = `${newScrollY - rect.height}px`;
    }
  } else {
    if (rect.top > 0) {
      $mobileNavigation.style.top = '0px';
      $mobileNavigation.style.position = 'fixed';
    }
  }
  scrollY = newScrollY;
  updateActive();
});
updateActive();

function updateActive() {
  let activeIndex = 0;
  let i = 0;
  for (const $title of $titles) {
    if ($title.offsetParent === null) {
      continue;
    }
    const offset = $title.getBoundingClientRect().top;
    if (offset >= 0) {
      activeIndex = i;
      break;
    }
    ++i;
  }
  for (const $select of $navs) {
    $select.selectedIndex = activeIndex;
  }
  const $navLists = document.getElementsByClassName('nav-list');
  for (const $navList of $navLists) {
    const $links = $navList.getElementsByTagName('a');
    for (const $link of $links) {
      $link.classList.remove('active');
    }
    $links[activeIndex].classList.add('active');
    const hash = $links[activeIndex].getAttribute('href');
    if (location.hash !== hash) {
      history.replaceState({}, '',  hash);
    }
  }
}
