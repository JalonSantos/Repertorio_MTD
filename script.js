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

// --- SELEÇÃO DE MÚSICAS ---
let selectMode = false;
let selectedSongs = [];
let selectedService = "";
let selectedDate = new Date().toLocaleDateString('pt-BR');

const selectModeBtn = document.getElementById("select-mode-btn");
const sendWhatsAppBtn = document.getElementById("send-whatsapp-btn");

// --- MODAL DE SELEÇÃO DE CULTO ---
const serviceModal = document.getElementById("service-modal");
const serviceForm = document.getElementById("service-form");
const closeServiceModal = document.getElementById("close-service-modal");
const customServiceInput = document.getElementById("custom-service");
const serviceDateInput = document.getElementById("service-date");

// Inicializa o input de data com a data atual
const today = new Date();
serviceDateInput.value = today.toISOString().slice(0, 10); // yyyy-mm-dd

// Abrir modal ao clicar no botão
selectModeBtn.addEventListener("click", () => {
  if (!selectMode) {
    serviceModal.classList.remove("hidden");
  } else {
    // Desativa o modo seleção se já estava ativo
    selectMode = false;
    selectedSongs = [];
    selectedService = "";
    selectModeBtn.classList.remove("active");
    sendWhatsAppBtn.style.display = "none";
    document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    selectModeBtn.textContent = "🎵 Selecionar músicas";
  }
});

// Fechar modal
closeServiceModal.addEventListener("click", () => {
  serviceModal.classList.add("hidden");
});

// Habilitar/desabilitar campo "Outro" conforme radio selecionado
serviceForm.querySelectorAll("input[name='service']").forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "Outro" && radio.checked) {
      customServiceInput.disabled = false;
      customServiceInput.focus();
    } else {
      customServiceInput.disabled = true;
      customServiceInput.value = "";
    }
  });
});

// Confirmar culto e data
serviceForm.addEventListener("submit", e => {
  e.preventDefault();

  const selectedRadio = serviceForm.querySelector("input[name='service']:checked");
  if (!selectedRadio) return;

  selectedService = selectedRadio.value === "Outro" && customServiceInput.value.trim()
    ? customServiceInput.value.trim()
    : selectedRadio.value;

  // Pega a data direto do input
  selectedDate = serviceDateInput.value; // yyyy-mm-dd
  // Converte para dd/mm/yyyy para exibição
  const [year, month, day] = selectedDate.split("-");
  selectedDate = `${day}/${month}/${year}`;

  serviceModal.classList.add("hidden");

  // Ativar modo de seleção
  selectMode = true;
  selectModeBtn.classList.add("active");
  selectModeBtn.textContent = `✅ Montando repertório: ${selectedService}`;
});

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

    // Selecionar música (modo seleção)
    card.addEventListener('click', e => {
      if (!selectMode) return;
      if (e.target.classList.contains("open")) return;
      const title = s.title;
      const link = s.link || '';
      const isSelected = card.classList.toggle("selected");

      if (isSelected) {
        selectedSongs.push({ title, link, author: s.author || '' });
      } else {
        selectedSongs = selectedSongs.filter(song => song.title !== title);
      }
      sendWhatsAppBtn.style.display = selectedSongs.length > 0 ? "inline-block" : "none";
    });

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
    currentIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
};

document.getElementById('expand-lyrics-btn').onclick = () => {
  const lyricsEl = document.getElementById('lyrics');
  lyricsEl.classList.toggle('expanded');
  document.getElementById('expand-lyrics-btn').textContent =
    lyricsEl.classList.contains('expanded') ? 'Recolher letra' : 'Expandir letra';
};

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

// --- BUSCA ---
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

// --- ADICIONAR MÚSICA ---
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

// --- ENVIAR PELO WHATSAPP ---
sendWhatsAppBtn.addEventListener("click", () => {
  let message = `🎶 *Músicas para ${selectedService} [${selectedDate}]*\n`;

  selectedSongs.forEach(s => {
    const title = s.title.replace(/�/g, '');
    const author = (s.author || '').replace(/�/g, '');
    const link = (s.link || '').replace(/�/g, '');
    message += `\n• ${title}${author ? ` (${author})` : ''}\n${link ? '🔗 ' + link : ''}\n`;
  });

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
});

// --- INICIALIZA ---
loadSongs();
