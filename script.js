import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- FIREBASE ---
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

// --- DADOS ---
let songs = [];

// --- FUNÇÕES PRINCIPAIS ---
async function loadSongs(){
  const querySnapshot = await getDocs(collection(db, "songs"));
  songs = querySnapshot.docs.map(doc => doc.data());
  renderCategories();
  renderList(songs);
}

function unique(arr){ return [...new Set(arr)]; }

function renderCategories(){
  const allCats = songs.flatMap(s => s.categories || []);
  const cats = unique(allCats);
  const container = document.getElementById('categories');
  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.textContent = 'Todos';
  allBtn.onclick = ()=>renderList(songs);
  container.appendChild(allBtn);
  cats.forEach(c=>{
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.onclick = ()=> renderList(songs.filter(s=> s.categories.includes(c)));
    container.appendChild(btn);
  });
}

function renderList(list){
  const main = document.getElementById('song-list');
  main.innerHTML = '';
  if(list.length===0){
    main.innerHTML = '<p>Nenhuma música encontrada.</p>'; return;
  }
  list.forEach(s=>{
    const card = document.createElement('article');
    card.className='card';
    card.innerHTML = `<h3>${s.title}</h3><div class="meta">${s.author||''}</div>
      <div class="tags">${(s.categories||[]).map(t=>'<span class="tag">'+t+'</span>').join('')}</div>
      <button class="open">Abrir</button>`;
    card.querySelector('.open').onclick = ()=> openModal(s);
    main.appendChild(card);
  });
}

// --- MODAL DE MÚSICA ---
function openModal(song){
  document.getElementById('modal-title').textContent = song.title;
  document.getElementById('modal-meta').textContent = song.author || '';
  const playerArea = document.getElementById('player-area');
  playerArea.innerHTML = '';

  const yt = getYouTubeId(song.link || '');
  const sp = getSpotifyId(song.link || '');
  
  if(yt){
    const iframe = document.createElement('iframe');
    iframe.width='100%'; iframe.height='220';
    iframe.src = `https://www.youtube.com/embed/${yt}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    // fallback se não carregar
    iframe.onerror = function(){
      playerArea.innerHTML = '';
      const a = document.createElement('a');
      a.href = song.link;
      a.textContent = 'Vídeo não pode ser reproduzido. Clique aqui para abrir no YouTube';
      a.target='_blank';
      playerArea.appendChild(a);
    }

    playerArea.appendChild(iframe);
  } else if(sp){
    const iframe = document.createElement('iframe');
    iframe.width='100%'; iframe.height='80';
    iframe.src = `https://open.spotify.com/embed/track/${sp}`;
    iframe.allow = 'encrypted-media; clipboard-write';
    iframe.onerror = function(){
      playerArea.innerHTML = '';
      const a = document.createElement('a');
      a.href = song.link;
      a.textContent = 'Spotify não pode ser reproduzido. Clique aqui para abrir';
      a.target='_blank';
      playerArea.appendChild(a);
    }
    playerArea.appendChild(iframe);
  } else if(song.link){
    const a = document.createElement('a');
    a.href = song.link;
    a.textContent = 'Abrir link';
    a.target='_blank';
    playerArea.appendChild(a);
  } else {
    playerArea.innerHTML = '<p class="note">Nenhum link disponível para esta música.</p>';
  }

  // letra com scroll e expandir
  const lyricsEl = document.getElementById('lyrics');
  lyricsEl.textContent = song.lyrics || '(Letra não adicionada)';
  lyricsEl.style.maxHeight = '150px';
  lyricsEl.style.overflow = 'auto';
  lyricsEl.style.cursor = 'pointer';
  lyricsEl.title = 'Clique para expandir/contrair';

  lyricsEl.onclick = ()=>{
    if(lyricsEl.style.maxHeight==='150px'){
      lyricsEl.style.maxHeight = '600px';
    } else {
      lyricsEl.style.maxHeight = '150px';
    }
  }

  document.getElementById('modal').classList.remove('hidden');
}

// --- UTILS ---
function getYouTubeId(url){
  if(!url) return null;
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if(u.searchParams.get('v')) return u.searchParams.get('v');
    const p = u.pathname.split('/');
    const idx = p.indexOf('embed');
    if(idx>=0 && p[idx+1]) return p[idx+1];
  }catch(e){}
  return null;
}

function getSpotifyId(url){
  if(!url) return null;
  try{
    const u = new URL(url);
    if(u.hostname.includes('open.spotify.com')){
      const parts = u.pathname.split('/');
      return parts[2] || null;
    }
  }catch(e){}
  return null;
}

// --- EVENTOS ---
document.getElementById('close-modal').onclick = ()=>{
  const playerArea = document.getElementById('player-area');
  playerArea.innerHTML = ''; // para o vídeo ao fechar
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase().trim();
  if(!q) { renderList(songs); return; }
  const filtered = songs.filter(s=> (s.title + ' ' + (s.author||'') + ' ' + (s.categories||[]).join(' ')).toLowerCase().includes(q));
  renderList(filtered);
});

document.getElementById('clear').addEventListener('click', ()=>{
  document.getElementById('search').value='';
  renderList(songs);
});

// --- ADICIONAR MÚSICA ---
const addModal = document.getElementById('add-modal');
document.getElementById('add-song-btn').onclick = ()=> addModal.classList.remove('hidden');
document.getElementById('close-add-modal').onclick = ()=> addModal.classList.add('hidden');

document.getElementById('add-song-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const newSong = {
    title: document.getElementById('new-title').value,
    author: document.getElementById('new-author').value,
    categories: document.getElementById('new-categories').value.split(',').map(s=>s.trim()).filter(Boolean),
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
