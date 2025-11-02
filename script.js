import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "louvor-db.firebaseapp.com",
  projectId: "louvor-db",
  storageBucket: "louvor-db.appspot.com",
  messagingSenderId: "SUA_ID",
  appId: "SEU_APP_ID"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let songs = [];

// --- FUNÇÕES PRINCIPAIS ---
async function loadSongs() {
  const querySnapshot = await getDocs(collection(db, "songs"));
  songs = querySnapshot.docs.map(doc => doc.data());
  renderCategories();
  renderList(songs);
}

function unique(arr) { return [...new Set(arr)]; }

function renderCategories() {
  const allCats = songs.flatMap(s => s.categories || []);
  const cats = unique(allCats);
  const container = document.getElementById('categories');
  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.textContent = 'Todos';
  allBtn.onclick = () => renderList(songs);
  container.appendChild(allBtn);
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.onclick = () => renderList(songs.filter(s => s.categories.includes(c)));
    container.appendChild(btn);
  });
}

function renderList(list) {
  const main = document.getElementById('song-list');
  main.innerHTML = '';
  if (list.length === 0) {
    main.innerHTML = '<p>Nenhuma música encontrada.</p>';
    return;
  }
  list.forEach(s => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${s.title}</h3>
      <div class="meta">${s.author || ''}</div>
      <div class="tags">${(s.categories || []).map(t => '<span class="tag">' + t + '</span>').join('')}</div>
      <button class="open">Abrir</button>`;
    card.querySelector('.open').onclick = () => openModal(s);
    main.appendChild(card);
  });
}

// --- MODAL MÚSICA ---
let currentIframe = null;

function openModal(song) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = song.title;
  document.getElementById('modal-meta').textContent = song.author || '';
  const playerArea = document.getElementById('player-area');
  playerArea.innerHTML = '';

  currentIframe = null;
  const yt = getYouTubeId(song.link || '');
  if (yt) {
    const iframe = document.createElement('iframe');
    iframe.width = '100%'; iframe.height = '220';
    iframe.src = `https://www.youtube.com/embed/${yt}?enablejsapi=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    playerArea.appendChild(iframe);
    currentIframe = iframe;
  } else if (song.link) {
    const a = document.createElement('a');
    a.href = song.link;
    a.textContent = 'Abrir link';
    a.target = '_blank';
    playerArea.appendChild(a);
  } else {
    playerArea.innerHTML = '<p class="note">Nenhum link disponível para esta música.</p>';
  }

  const lyricsEl = document.getElementById('lyrics');
  lyricsEl.textContent = song.lyrics || '(Letra não adicionada)';
  lyricsEl.classList.remove('expanded');
  document.getElementById('expand-lyrics-btn').textContent = 'Expandir letra';

  modal.classList.remove('hidden');
}

document.getElementById('close-modal').onclick = () => {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  if (currentIframe) {
    // Pausa vídeo do YouTube via postMessage
    currentIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
};

document.getElementById('expand-lyrics-btn').onclick = () => {
  const lyricsEl = document.getElementById('lyrics');
  lyricsEl.classList.toggle('expanded');
  document.getElementById('expand-lyrics-btn').textContent =
    lyricsEl.classList.contains('expanded') ? 'Recolher letra' : 'Expandir letra';
}

// --- FUNÇÕES DE PARSE LINK ---
function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const p = u.pathname.split('/');
    const idx = p.indexOf('embed');
    if (idx >= 0 && p[idx + 1]) return p[idx + 1];
  } catch (e) { }
  return null;
}

// --- EVENTOS DE BUSCA ---
document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { renderList(songs); return; }
  const filtered = songs.filter(s => (s.title + ' ' + (s.author || '') + ' ' + (s.categories || []).join(' ')).toLowerCase().includes(q));
  renderList(filtered);
});
document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('search').value = '';
  renderList(songs);
});

// --- MODAL ADICIONAR MÚSICA ---
const addModal = document.getElementById('add-modal');
document.getElementById('add-song-btn').onclick = () => addModal.classList.remove('hidden');
document.getElementById('close-add-modal').onclick = () => addModal.classList.add('hidden');

document.getElementById('add-song-form').addEventListener('submit', async e => {
  e.preventDefault();
  const newSong = {
    title: document.getElementById('new-title').value,
    author: document.getElementById('new-author').value,
    categories: document.getElementById('new-categories').value.split(',').map(s => s.trim()).filter(Boolean),
    lyrics: document.getElementById('new-lyrics').value,
    link: document.getElementById('new-link').value
  };
  await addDoc(collection(db, "songs"), newSong);
  addModal.classList.add('hidden');
  e.target.reset();
  loadSongs();
});

// --- INICIALIZA ---
loadSongs();
