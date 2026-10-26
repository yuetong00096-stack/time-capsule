const items = window.CAPSULE_OBJECTS;
const host = document.querySelector('#canvas-host');
const gallery = document.querySelector('#objects');
const detail = document.querySelector('#detail');
const article = detail.querySelector('article');
const backButton = document.querySelector('#back');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const arrangements = new Map();

let current = 0;
let busy = false;
let lastButton;

// Keep a mix of small and large objects each time the page opens.
const scales = [.74, .86, .98, 1.09, 1.20, 1.34, 1.48];
for (let i = scales.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [scales[i], scales[j]] = [scales[j], scales[i]];
}
for (let i = 0; i < scales.length; i++) {
  scales[i] += (Math.random() - .5) * .08;
}

const buttons = items.map((item, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'object';
  button.setAttribute('aria-label', `Read the story of ${item.title}`);

  const image = new Image();
  image.src = item.image;
  image.alt = item.title;
  image.draggable = false;
  image.addEventListener('error', () => {
    showNotice(`Unable to load ${item.image}. Please check the assets folder.`);
  });

  button.append(image);
  button.addEventListener('click', () => openObject(i, button));
  gallery.append(button);
  return button;
});

function createArrangement(w, h, scales) {
  const small = w <= 700;
  const base = Math.min(w * (small ? .33 : .23), h * (small ? .20 : .33), 310);
  const order = scales.map((scale, i) => ({ scale, i })).sort((a, b) => b.scale - a.scale);
  // Start with the largest objects and leave space around them.
  for (let pass = 0; pass < 40; pass++) {
    const points = [];
    const shrink = Math.pow(.96, pass);
    let complete = true;
    for (const {scale, i} of order) {
      const size = base * scale * shrink;
      const half = size * .66 + 12;
      let point = null;
      for (let attempt = 0; attempt < 450; attempt++) {
        const x = half + Math.random() * Math.max(0, w - 2 * half);
        const y = half + Math.random() * Math.max(0, h - 2 * half);
        if (half * 2 <= Math.min(w, h) && points.every(p =>
          Math.abs(x - p.x) >= half + p.half || Math.abs(y - p.y) >= half + p.half)) {
          point = {i, x, y, size, half, a: Math.random() * 32 - 16};
          break;
        }
      }
      if (!point) { complete = false; break; }
      points.push(point);
    }
    if (complete) return points.sort((a, b) => a.i - b.i);
  }
  // Use rows if the screen is too small for a random layout.
  const cols = w > h ? 4 : 2, rows = Math.ceil(scales.length / cols);
  const cell = Math.min(w / cols, h / rows);
  return scales.map((scale, i) => ({i, x:(i % cols + .5)*w/cols,
    y:(Math.floor(i/cols)+.5)*h/rows, size:Math.max(1,cell*.48*scale), a:0}));
}
function layout(){
  const w = host.clientWidth, h = host.clientHeight;
  const key = `${w}x${h}`;
  if (!arrangements.has(key)) arrangements.set(key, createArrangement(w, h, scales));
  buttons.forEach((b, i) => {
    const point = arrangements.get(key)[i];
    Object.assign(b.style, {left:`${point.x}px`, top:`${point.y}px`,
      width:`${point.size}px`, height:`${point.size}px`});
    b.style.setProperty('--angle', `${point.a}deg`);
  });
}

function showNotice(message) {
  const notice = document.querySelector('#notice');
  notice.textContent = message;
  notice.hidden = false;
}

function showStory(i) {
  current = i;
  const item = items[i];
  document.querySelector('#detail-title').textContent = item.title;
  document.querySelector('#description').textContent = item.description;
  document.querySelector('#story').textContent = item.story;
  document.querySelector('#relationship').textContent = item.relationship;
  detail.scrollTop = 0;
}

async function animate(element, frames, duration) {
  if (reducedMotion.matches) return;

  const animation = element.animate(frames, {
    duration,
    easing: 'cubic-bezier(.22, .7, .2, 1)',
    fill: 'forwards'
  });
  try {
    await animation.finished;
  } catch {
    // An animation can be cancelled when the view closes.
  }
}

async function openObject(i, button) {
  if (busy || detail.open) return;
  busy = true;
  lastButton = button;

  // Flip a copy of the image before showing its story.
  const image = button.querySelector('img');
  const rect = image.getBoundingClientRect();
  const copy = image.cloneNode();
  copy.className = 'flip-clone';
  copy.style.left = `${rect.left}px`;
  copy.style.top = `${rect.top}px`;
  copy.style.width = `${rect.width}px`;
  copy.style.height = `${rect.height}px`;
  document.body.append(copy);
  image.style.opacity = 0;

  await animate(copy, [
    { transform: 'perspective(1000px) rotateY(0deg)' },
    { transform: 'perspective(1000px) rotateY(90deg) scale(1.2)' }
  ], 360);

  showStory(i);
  detail.showModal();
  document.body.classList.add('open');
  copy.remove();
  image.style.opacity = '';

  await animate(article, [
    { opacity: 0, transform: 'translateY(12px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], 400);

  backButton.focus();
  busy = false;
}

async function closeObject() {
  if (busy || !detail.open) return;
  busy = true;

  await animate(article, [
    { opacity: 1 },
    { opacity: 0, transform: 'translateY(10px)' }
  ], 180);

  detail.close();
  document.body.classList.remove('open');
  article.getAnimations().forEach(animation => animation.cancel());
  lastButton?.focus({ preventScroll: true });
  busy = false;
}

backButton.addEventListener('click', closeObject);
detail.addEventListener('cancel', event => {
  event.preventDefault();
  closeObject();
});
detail.addEventListener('keydown', event => {
  if (busy) return;
  if (event.key === 'ArrowRight') showStory((current + 1) % items.length);
  if (event.key === 'ArrowLeft') showStory((current - 1 + items.length) % items.length);
});

window.addEventListener('resize', layout);
layout();

// Draw a small line under the object being hovered over.
if (window.p5) {
  new p5(p => {
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight).parent(host);
      p.pixelDensity(Math.min(devicePixelRatio, 2));
      p.frameRate(24);
    };

    p.draw = () => {
      p.clear();
      if (detail.open || window.innerWidth <= 700) return;

      const button = buttons.find(b => b.matches(':hover, :focus-visible'));
      if (!button) return;

      const x = parseFloat(button.style.left);
      const y = parseFloat(button.style.top) + parseFloat(button.style.height) / 2;
      p.stroke(65);
      p.strokeWeight(.7);
      p.line(x, y + 42, x, y + 58);
    };

    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) p.noLoop();
      else p.loop();
    });
  });
}
