import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB7IMYLeCuIHMVIHRvnGa_n3l3zYhAH-Ms",
  authDomain: "louvor-db.firebaseapp.com",
  projectId: "louvor-db",
  storageBucket: "louvor-db.appspot.com",
  messagingSenderId: "505772532937",
  appId: "1:505772532937:web:e3bcfa3e1ba6f211351918"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let songs = [];
let selectMode = false;
let selectedSongs = [];
let selectedService = "";
let selectedDate = "";
let currentSongId = null;
let currentSongData = null;

// Elementos DOM
const addModal = document.getElementById('add-modal');
const addModalTitle = document.getElementById('add-modal-title');
const submitSongBtn = document.getElementById('submit-song-btn');
const addSongForm = document.getElementById('add-song-form');

const selectModeBtn = document.getElementById("select-mode-btn");
const sendWhatsAppBtn = document.getElementById("send-whatsapp-btn");
const serviceModal = document.getElementById("service-modal");
const serviceForm = document.getElementById("service-form");
const closeServiceModal = document.getElementById("close-service-modal");
const customServiceInput = document.getElementById("custom-service");
const serviceDateInput = document.getElementById("service-date");

// Modo leitura e histórico
const readModal = document.getElementById('read-modal');
const readTitleEl = document.getElementById('read-title');
const readLyricsEl = document.getElementById('read-lyrics');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');

// ====================== BUSCA AUTOMÁTICA ======================
const YOUTUBE_API_KEY = "AIzaSyAR9JfWeDi2i7QODt-f6FLxLBVc-l4yCQE";

document.addEventListener('click', async (e) => {
  if (e.target.id === 'btn-buscar-automatico') {
    const titleInput = document.getElementById('new-title');
    const authorInput = document.getElementById('new-author');
    const linkInput = document.getElementById('new-link');
    const lyricsInput = document.getElementById('new-lyrics');

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();

    if (!title) {
      alert("Preencha pelo menos o título da música!");
      return;
    }

    let foundLink = linkInput.value.trim();
    let foundLyrics = lyricsInput.value.trim();

    // 1. Buscar vídeo no YouTube (já estava funcionando)
    if (!foundLink) {
      try {
        const query = encodeURIComponent(`${title} ${author} oficial letra`);
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(ytUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          // Prioriza vídeo com "oficial" ou "letra" no título
          const bestVideo = data.items.find(item => 
            item.snippet.title.toLowerCase().includes("oficial") || 
            item.snippet.title.toLowerCase().includes("letra") ||
            item.snippet.channelTitle.toLowerCase().includes("oficial")
          ) || data.items[0];

          foundLink = `https://www.youtube.com/watch?v=${bestVideo.id.videoId}`;
          linkInput.value = foundLink;
        }
      } catch (err) {
        console.error("Erro ao buscar YouTube:", err);
      }
    }

// 2. Buscar letra via proxy público (sem CORS, sem backend)
if (!foundLyrics) {
  try {
    const GENIUS_TOKEN = "AX0aJTkBgRxfrr4FIXriHM4mcQg1XTVgd7rtr4h5BM9A925Ak9zujOqIaonm_H8w";  // cole seu token do Genius aqui (temporário)

    let cleanTitle = title
      .replace(/\(.*?\)/g, '')
      .replace(/versão.*/gi, '')
      .replace(/ao vivo.*/gi, '')
      .trim();

    let cleanAuthor = author.trim();

    const geniusQuery = encodeURIComponent(cleanTitle + ' ' + cleanAuthor);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.genius.com/search?q=' + geniusQuery)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`
      }
    });

    const data = await response.json();

    if (data.response?.hits?.length > 0) {
      const bestHit = data.response.hits[0].result;
      const songUrl = bestHit.url;

      alert("Letra encontrada no Genius!\n\n" +
            "Abra o link para copiar a letra completa:\n" + songUrl);
      window.open(songUrl, '_blank');
    } else {
      const letrasLink = `https://www.letras.mus.br/?q=${encodeURIComponent(cleanTitle + " " + cleanAuthor)}`;
      alert("Letra não encontrada no Genius.\n\n" +
            "Abri letras.mus.br para você copiar:\n" + letrasLink);
      window.open(letrasLink, '_blank');
    }
  } catch (err) {
    console.error("Erro ao buscar via proxy:", err);
    const letrasLink = `https://www.letras.mus.br/?q=${encodeURIComponent(title + " " + author)}`;
    alert("Erro na busca automática.\n\n" +
          "Abri letras.mus.br para você copiar a letra:\n" + letrasLink);
    window.open(letrasLink, '_blank');
  }
}
  } catch (err) {
    console.error("Erro ao buscar via backend:", err);
    const letrasLink = `https://www.letras.mus.br/?q=${encodeURIComponent(title + " " + author)}`;
    alert("Erro na busca.\n\n" +
          "Abri letras.mus.br para você copiar a letra:\n" + letrasLink);
    window.open(letrasLink, '_blank');
  }
}

    // Feedback para o usuário
    let message = "Busca concluída!\n\n";
    if (foundLink) message += "✅ Link do YouTube encontrado!\n";
    if (foundLyrics) message += "✅ Letra encontrada!\n";
    if (!foundLink && !foundLyrics) {
      message = "Não consegui encontrar automaticamente.\n\n" +
                "Tente buscar manualmente:\n" +
                "- YouTube: '" + title + " " + author + " oficial'\n" +
                "- Letra: letras.mus.br ou cifraclub.com.br";
    }
    alert(message);
  }
});

// Seleção de culto (mantido igual)
selectModeBtn.addEventListener("click", () => {
  if (!selectMode) {
    serviceModal.classList.remove("hidden");
  } else {
    selectMode = false;
    selectedSongs = [];
    selectedService = "";
    selectModeBtn.classList.remove("active");
    sendWhatsAppBtn.style.display = "none";
    document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    selectModeBtn.textContent = "🎵 Selecionar músicas";
  }
});

closeServiceModal.addEventListener("click", () => serviceModal.classList.add("hidden"));

serviceForm.querySelectorAll("input[name='service']").forEach(radio => {
  radio.addEventListener("change", () => {
    customServiceInput.disabled = !(radio.value === "Outro" && radio.checked);
    if (customServiceInput.disabled) customServiceInput.value = "";
    else customServiceInput.focus();
  });
});

serviceForm.addEventListener("submit", e => {
  e.preventDefault();
  const selectedRadio = serviceForm.querySelector("input[name='service']:checked");
  if (!selectedRadio) return;

  selectedService = (selectedRadio.value === "Outro" && customServiceInput.value.trim())
    ? customServiceInput.value.trim()
    : selectedRadio.value;

  if (!serviceDateInput.value) {
    alert("Por favor, selecione a data do repertório!");
    return;
  }

  const [year, month, day] = serviceDateInput.value.split("-");
  selectedDate = `${day}/${month}/${year}`;

  serviceModal.classList.add("hidden");

  selectMode = true;
  selectModeBtn.classList.add("active");
  selectModeBtn.textContent = `✅ Montando repertório: ${selectedService}`;
});

// CARREGAR MÚSICAS
async function loadSongs() {
  console.log("Iniciando loadSongs...");
  try {
    const querySnapshot = await getDocs(collection(db, "songs"));
    songs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Músicas carregadas:", songs.length);
    renderCategories();
    renderList(songs);
  } catch (err) {
    console.error("Erro ao carregar músicas:", err);
  }
}

function unique(arr) { return [...new Set(arr)]; }

// Renderiza categorias no dropdown
function renderCategories() {
  console.log("renderCategories chamada! Total músicas:", songs.length);
  const allCats = songs.flatMap(s => s.categories || []);
  const cats = unique(allCats).sort();

  const select = document.getElementById('category-select');
  if (!select) {
    console.error("Elemento #category-select NÃO ENCONTRADO no HTML!");
    return;
  }

  select.innerHTML = '<option value="all">Todas as categorias</option>';

  cats.forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    select.appendChild(option);
  });

  // Evento de filtro
  select.addEventListener('change', () => {
    const selectedCat = select.value;
    console.log("Categoria selecionada:", selectedCat);
    if (selectedCat === 'all') {
      renderList(songs);
    } else {
      renderList(songs.filter(s => s.categories?.includes(selectedCat)));
    }
  });

  // Carrega todas por padrão
  renderList(songs);
}

function renderList(list) {
  console.log("renderList chamada com", list.length, "músicas");
  const main = document.getElementById('song-list');
  main.innerHTML = '';
  if (list.length === 0) {
    main.innerHTML = '<p>Nenhuma música encontrada.</p>';
    return;
  }

  list.forEach(song => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = song.id;

    card.innerHTML = `
      <h3>${song.title}</h3>
      <div class="meta">${song.author || ''}</div>
      <div class="tags">${(song.categories || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <button class="open">Abrir</button>
    `;

    card.querySelector('.open').onclick = (e) => {
      e.stopPropagation();
      openModal(song);
    };

    card.addEventListener('click', e => {
      if (selectMode && !e.target.closest('.open')) {
        const isSelected = card.classList.toggle("selected");
        if (isSelected) {
          selectedSongs.push({ title: song.title, link: song.link || '', author: song.author || '' });
        } else {
          selectedSongs = selectedSongs.filter(s => s.title !== song.title);
        }
        sendWhatsAppBtn.style.display = selectedSongs.length > 0 ? "inline-block" : "none";
      }
    });

    main.appendChild(card);
  });
}

// MODAL VISUALIZAÇÃO
let currentIframe = null;

function openModal(song) {
  currentSongId = song.id;
  currentSongData = song;

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
    playerArea.innerHTML = `<a href="${song.link}" target="_blank">Abrir link</a>`;
  } else {
    playerArea.innerHTML = '<p class="note">Nenhum link disponível.</p>';
  }

  const lyricsEl = document.getElementById('lyrics');
  lyricsEl.textContent = song.lyrics || '(Letra não adicionada)';
  lyricsEl.classList.remove('expanded');
  document.getElementById('expand-lyrics-btn').textContent = 'Expandir letra';

  document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('close-modal').onclick = () => {
  document.getElementById('modal').classList.add('hidden');
  if (currentIframe) {
    currentIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
};

document.getElementById('expand-lyrics-btn').onclick = () => {
  const lyricsEl = document.getElementById('lyrics');
  const expanded = lyricsEl.classList.toggle('expanded');
  document.getElementById('expand-lyrics-btn').textContent = expanded ? 'Recolher letra' : 'Expandir letra';
};

// MODO EDIÇÃO
document.getElementById('edit-song-btn').onclick = () => {
  if (!currentSongId || !currentSongData) return;
  addModalTitle.textContent = "Editar Música";
  submitSongBtn.textContent = "Salvar Alterações";
  document.getElementById('new-title').value = currentSongData.title || '';
  document.getElementById('new-author').value = currentSongData.author || '';
  document.getElementById('new-categories').value = (currentSongData.categories || []).join(', ');
  document.getElementById('new-link').value = currentSongData.link || '';
  document.getElementById('new-lyrics').value = currentSongData.lyrics || '';
  addModal.classList.remove('hidden');
  document.getElementById('modal').classList.add('hidden');
};

// MODO LEITURA
document.getElementById('read-mode-btn').onclick = () => {
  if (!currentSongData) return;
  readTitleEl.textContent = currentSongData.title + (currentSongData.author ? ` - ${currentSongData.author}` : '');
  readLyricsEl.textContent = currentSongData.lyrics || '(Letra não adicionada)';
  document.getElementById('modal').classList.add('hidden');
  readModal.classList.remove('hidden');
  if (readModal.requestFullscreen) readModal.requestFullscreen().catch(() => {});
};

document.getElementById('close-read-modal').onclick = () => {
  readModal.classList.add('hidden');
  if (document.exitFullscreen) document.exitFullscreen();
};

// ADICIONAR / EDITAR SUBMIT
addSongForm.addEventListener('submit', async e => {
  e.preventDefault();
  const songData = {
    title: document.getElementById('new-title').value.trim(),
    author: document.getElementById('new-author').value.trim(),
    categories: document.getElementById('new-categories').value.split(',').map(s => s.trim()).filter(Boolean),
    link: document.getElementById('new-link').value.trim(),
    lyrics: document.getElementById('new-lyrics').value.trim()
  };
  try {
    if (currentSongId && addModalTitle.textContent.includes("Editar")) {
      const songRef = doc(db, "songs", currentSongId);
      await updateDoc(songRef, songData);
      alert("Música atualizada com sucesso!");
    } else {
      await addDoc(collection(db, "songs"), songData);
      alert("Música adicionada com sucesso!");
    }
    addModal.classList.add('hidden');
    addSongForm.reset();
    addModalTitle.textContent = "Adicionar Nova Música";
    submitSongBtn.textContent = "Adicionar";
    currentSongId = null;
    currentSongData = null;
    await loadSongs();
  } catch (err) {
    console.error("Erro ao salvar:", err);
    alert("Erro ao salvar música. Verifique o console.");
  }
});

document.getElementById('close-add-modal').onclick = () => {
  addModal.classList.add('hidden');
  addSongForm.reset();
  addModalTitle.textContent = "Adicionar Nova Música";
  submitSongBtn.textContent = "Adicionar";
  currentSongId = null;
  currentSongData = null;
};

document.getElementById('add-song-btn').onclick = () => {
  addModalTitle.textContent = "Adicionar Nova Música";
  submitSongBtn.textContent = "Adicionar";
  addSongForm.reset();
  addModal.classList.remove('hidden');
};

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return renderList(songs);
  const filtered = songs.filter(s =>
    (s.title + ' ' + (s.author || '') + ' ' + (s.lyrics || '') + ' ' + (s.categories || []).join(' '))
      .toLowerCase().includes(q)
  );
  renderList(filtered);
});

document.getElementById('clear').onclick = () => {
  document.getElementById('search').value = '';
  document.getElementById('category-select').value = 'all';
  renderList(songs);
};

// WHATSAPP + HISTÓRICO
sendWhatsAppBtn.addEventListener("click", async () => {
  let message = `🎶 *Músicas para ${selectedService} [${selectedDate}]*\n\n`;
  selectedSongs.forEach((s, index) => {
    const title = s.title || '(sem título)';
    const author = s.author ? ` (${s.author})` : '';
    const link = s.link ? `\n🎧 ${s.link}` : '';
    message += `${index + 1}. ${title}${author}${link}\n\n`;
  });
  const encoded = encodeURIComponent(message);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  let whatsappUrl = isMobile
    ? `https://wa.me/?text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`;
  const opened = window.open(whatsappUrl, '_blank');
  if (!opened && isMobile) {
    window.location.href = `https://wa.me/?text=${encoded}`;
  }
  try {
    await addDoc(collection(db, "sentLists"), {
      service: selectedService,
      date: selectedDate,
      sentAt: serverTimestamp(),
      songs: selectedSongs.map(s => ({
        title: s.title,
        author: s.author || '',
        link: s.link || ''
      })),
      rawMessage: message
    });
    console.log("Repertório salvo no histórico");
  } catch (err) {
    console.error("Erro ao salvar histórico:", err);
  }
});

document.getElementById('history-btn').addEventListener('click', async () => {
  historyList.innerHTML = '<p>Carregando histórico...</p>';
  historyModal.classList.remove('hidden');
  try {
    const q = query(collection(db, "sentLists"), orderBy("sentAt", "desc"), limit(30));
    const snapshot = await getDocs(q);
    historyList.innerHTML = '';
    if (snapshot.empty) {
      historyList.innerHTML = '<p>Nenhum repertório enviado ainda.</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const sentDate = data.sentAt ? data.sentAt.toDate().toLocaleString('pt-BR') : 'Data desconhecida';
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-header">
          <strong>${data.service} – ${data.date}</strong>
          <small>${sentDate}</small>
        </div>
        <ul class="history-songs">
          ${data.songs.map(s => `<li>${s.title}${s.author ? ` (${s.author})` : ''}${s.link ? ' 🎧' : ''}</li>`).join('')}
        </ul>
        <button class="reenviar-btn" data-msg="${encodeURIComponent(data.rawMessage)}">Reenviar esta lista</button>
      `;
      historyList.appendChild(item);
    });
    document.querySelectorAll('.reenviar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = decodeURIComponent(btn.dataset.msg);
        const enc = encodeURIComponent(msg);
        const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = isMob ? `https://wa.me/?text=${enc}` : `https://web.whatsapp.com/send?text=${enc}`;
        window.open(url, '_blank');
      });
    });
  } catch (err) {
    historyList.innerHTML = '<p>Erro ao carregar histórico. Veja o console.</p>';
    console.error(err);
  }
});

document.getElementById('close-history-modal').onclick = () => {
  historyModal.classList.add('hidden');
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
  } catch {}
  return null;
}

// INICIALIZA
window.addEventListener('load', () => {
  console.log("DOM carregado - iniciando loadSongs");
  loadSongs();
});
