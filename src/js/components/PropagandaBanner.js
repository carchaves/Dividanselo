const POSTERS = [
  'src/images/propaganda/poster-1.jpg',
  'src/images/propaganda/poster-2.jpg',
  'src/images/propaganda/poster-3.jpg',
  'src/images/propaganda/poster-4.jpg',
  'src/images/propaganda/poster-5.jpg',
  'src/images/propaganda/poster-6.jpg',
  'src/images/propaganda/poster-7.jpg',
  'src/images/propaganda/poster-8.jpg',
  'src/images/propaganda/poster-9.jpg',
  'src/images/propaganda/poster-10.jpg',
  'src/images/propaganda/poster-11.jpg',
];

let bannerEl = null;
let imgEl    = null;
let lastIdx  = -1;

export function initPropagandaBanner() {
  bannerEl = document.createElement('div');
  bannerEl.id = 'propaganda-banner';

  imgEl = document.createElement('img');
  imgEl.alt = '';
  imgEl.src = pickRandom();
  bannerEl.appendChild(imgEl);

  bannerEl.addEventListener('click', () => {
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = pickRandom();
      imgEl.style.opacity = '1';
    }, 200);
  });

  document.body.appendChild(bannerEl);
  document.body.style.paddingBottom = '240px';
}

function pickRandom() {
  let idx;
  do { idx = Math.floor(Math.random() * POSTERS.length); } while (idx === lastIdx && POSTERS.length > 1);
  lastIdx = idx;
  return POSTERS[idx];
}
