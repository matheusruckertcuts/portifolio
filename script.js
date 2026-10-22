const story = document.querySelector('.scroll-story');
const scenes = [...document.querySelectorAll('[data-scene]')];
const sceneNumber = document.querySelector('[data-scene-number]');
const counters = [...document.querySelectorAll('[data-counter]')];
const storyGrid = document.querySelector('.story-grid');
const introOrbit = document.querySelector('.intro-orbit');
const cutWindows = [...document.querySelectorAll('.cut-window')];
const playerFrame = document.querySelector('[data-youtube-player]');
const playerPlaceholder = document.querySelector('[data-player-placeholder]');
const playerPlay = document.querySelector('[data-player-play]');
const playerTitle = document.querySelector('[data-player-title]');
const playerClient = document.querySelector('[data-player-client]');
const playerStatus = document.querySelector('[data-player-status]');
const playerNote = document.querySelector('[data-player-note]');
const playerExternal = document.querySelector('[data-player-external]');
const canEmbedVideo = ['http:', 'https:'].includes(window.location.protocol);
const playlistItems = [...document.querySelectorAll('[data-video-id]')];
const clientFilters = [...document.querySelectorAll('[data-client-filter]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentScene = -1;
let ticking = false;
let selectedVideo = playlistItems[0] ?? null;

function setScene(index) {
  if (index === currentScene) return;
  currentScene = index;
  scenes.forEach((scene, sceneIndex) => {
    const active = sceneIndex === index;
    scene.classList.toggle('is-active', active);
    scene.setAttribute('aria-hidden', String(!active));
  });
  sceneNumber.textContent = String(index + 1).padStart(2, '0');
  if (index === 2) counters.forEach(animateCounter);
}

function animateCounter(counter) {
  const target = Number(counter.dataset.counter);
  if (reduceMotion) {
    counter.textContent = target.toLocaleString('en-US');
    return;
  }

  const duration = 1400;
  const start = performance.now();
  counter.textContent = '0';

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    counter.textContent = Math.floor(target * eased).toLocaleString('en-US');
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function updateStory() {
  const bounds = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - window.innerHeight;
  const travelled = Math.min(scrollable, Math.max(0, -bounds.top));
  const progress = scrollable ? travelled / scrollable : 0;
  const scene = Math.min(4, Math.floor(progress * 5.05));
  setScene(scene);

  if (!reduceMotion) {
    storyGrid.style.backgroundPosition = `0 ${Math.round(progress * 180)}px`;

    const introProgress = Math.min(1, progress / 0.2);
    introOrbit.style.transform = `translate3d(0, ${Math.sin(introProgress * Math.PI) * 18}px, 0)`;

    const cutProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.2));
    cutWindows.forEach((windowFrame, index) => {
      const direction = index === 0 ? -1 : 1;
      windowFrame.style.transform = `translate3d(${direction * cutProgress * 12}px, ${cutProgress * (index + 1) * -7}px, 0)`;
    });
  }

  ticking = false;
}

function requestUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateStory);
    ticking = true;
  }
}

function selectVideo(video) {
  if (!video) return;
  selectedVideo = video;
  playlistItems.forEach((item) => item.classList.toggle('is-selected', item === video));
  playerTitle.textContent = video.dataset.title;
  playerClient.textContent = video.dataset.client;
  playerExternal.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.dataset.videoId)}`;
}

function playSelectedVideo() {
  if (!selectedVideo) return;
  if (!canEmbedVideo) {
    playerNote.textContent = 'To play videos on this page, open the portfolio through a local server or its published website. You can also watch the selected edit on YouTube.';
    playerStatus.textContent = playerNote.textContent;
    return;
  }

  const videoUrl = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(selectedVideo.dataset.videoId)}`);
  videoUrl.search = new URLSearchParams({
    autoplay: '1',
    controls: '1',
    playsinline: '1',
    rel: '0',
    origin: window.location.origin
  }).toString();
  playerFrame.title = `${selectedVideo.dataset.title} — ${selectedVideo.dataset.client}`;
  playerFrame.referrerPolicy = 'strict-origin-when-cross-origin';
  playerFrame.src = videoUrl.href;
  playerFrame.hidden = false;
  playerPlaceholder.hidden = true;
  playerStatus.textContent = `Playing ${selectedVideo.dataset.title} by ${selectedVideo.dataset.client}.`;
}

playlistItems.forEach((item) => {
  item.addEventListener('click', () => {
    selectVideo(item);
    playSelectedVideo();
  });
});

playerPlay.addEventListener('click', playSelectedVideo);

clientFilters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const activeFilter = filter.dataset.clientFilter;
    clientFilters.forEach((button) => {
      const active = button === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    playlistItems.forEach((item) => {
      item.hidden = activeFilter !== 'all' && item.dataset.clientKey !== activeFilter;
    });

    if (selectedVideo && activeFilter !== 'all' && selectedVideo.dataset.clientKey !== activeFilter) {
      playerFrame.removeAttribute('src');
      playerFrame.hidden = true;
      playerPlaceholder.hidden = false;
      selectVideo(playlistItems.find((item) => item.dataset.clientKey === activeFilter));
      playerStatus.textContent = 'Choose an edit to play.';
    }
  });
});

function hideBrokenImage(img) {
  img.hidden = true;
  img.closest('figure, .photo-slot')?.classList.add('has-no-image');
}

document.querySelectorAll('img').forEach((img) => {
  img.addEventListener('error', () => hideBrokenImage(img));
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) hideBrokenImage(img);
});

window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
document.querySelector('[data-year]').textContent = new Date().getFullYear();
if (!canEmbedVideo) {
  playerNote.textContent = 'To play videos on this page, open the portfolio through a local server or its published website. You can also watch the selected edit on YouTube.';
}
updateStory();
