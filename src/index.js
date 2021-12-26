const $navs = document.getElementsByClassName('nav-select');
for (const $nav of $navs) {
  $nav.addEventListener('change', e => {
    location.href = e.target.value;
  });
}

function changeLanguage(targetLanguage) {
  let show = 'th';
  let hide = 'en';
  if (targetLanguage === 'en') {
    show = 'en';
    hide = 'th';
  }
  for (const $el of document.getElementsByClassName(hide)) {
    $el.classList.remove('show');
    $el.classList.add('hide');
  }
  for (const $el of document.getElementsByClassName(show)) {
    $el.classList.remove('hide');
    $el.classList.add('show');
  }
  window.localStorage.setItem('lang', targetLanguage);
}

if (window.localStorage.getItem && window.localStorage.getItem('lang') === 'en') {
  changeLanguage('en');
}

const $langs = document.getElementsByClassName('change-lang');
for (const $lang of $langs) {
  $lang.addEventListener('click', e => {
    changeLanguage(e.target.dataset.target);
  });
}

const $titles = document.getElementsByClassName('title');
const $mobileNavigation = document.getElementsByClassName('m-nav')[0];

document.addEventListener('scroll', _ => {
  onScroll();
});

let scrollY = 2147483647;
function onScroll() {
  const newScrollY = window.pageYOffset;
  const rect = $mobileNavigation.getBoundingClientRect();
  if (newScrollY > scrollY) {
    if ($mobileNavigation.style.position !== 'absolute') {
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
}
onScroll();

const initTimestamp = Date.now();

function updateActive() {
  let activeIndex = -1;
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
  if (activeIndex === -1) {
    activeIndex = i - 1;
  }
  console.log(activeIndex);
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
    if (location.hash !== hash && Date.now() - initTimestamp >= 1000) {
      history.replaceState({}, '',  hash);
    }
  }
}
