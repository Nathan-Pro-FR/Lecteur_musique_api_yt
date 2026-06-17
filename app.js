let player;
let originalPlaylist = []; 
let displayPlaylist = [];  
let playbackOrder = [];    
let currentIndex = 0;      

let isShuffle = false;
let isRepeat = false;
let progressUpdateInterval;

// 1. Appel automatique par l'IFrame API de YouTube
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-iframe-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'autoplay': 0,
            'controls': 0,        
            'disablekb': 1,
            'fs': 0,              
            'modestbranding': 1,
            'rel': 0,
            'origin': window.location.origin // Supprime les erreurs postMessage de la console
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 2. Initialisation une fois l'IFrame chargée
async function onPlayerReady() {
    await fetchPlaylist();
    setupEventListeners();
}

// 3. Récupération des titres via la fonction Netlify Serverless
async function fetchPlaylist() {
    try {
        const response = await fetch('/.netlify/functions/get-playlist');
        if (!response.ok) throw new Error();
        
        originalPlaylist = await response.json();
        displayPlaylist = [...originalPlaylist];
        
        buildPlaybackOrder();
        renderPlaylist(displayPlaylist);
    } catch (error) {
        document.getElementById('playlist-tracks').innerHTML = `<div class="loading" style="color:red;">Erreur lors du chargement des données. Vérifiez votre clé API sur Netlify.</div>`;
    }
}

// 4. Génération de l'ordre de lecture (Normal ou Aléatoire)
function buildPlaybackOrder() {
    playbackOrder = [...originalPlaylist];
    if (isShuffle) {
        for (let i = playbackOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playbackOrder[i], playbackOrder[j]] = [playbackOrder[j], playbackOrder[i]];
        }
    }
    const currentTrack = originalPlaylist[currentIndex];
    if (currentTrack) {
        currentIndex = playbackOrder.findIndex(t => t.id === currentTrack.id);
    }
}

// 5. Affichage HTML de la liste
function renderPlaylist(tracks) {
    const container = document.getElementById('playlist-tracks');
    container.innerHTML = '';

    if(tracks.length === 0) {
        container.innerHTML = '<div class="loading">Aucun résultat trouvé</div>';
        return;
    }

    tracks.forEach((track) => {
        const row = document.createElement('div');
        row.classList.add('track-item');
        row.setAttribute('data-id', track.id);
        
        const currentPlayingTrack = playbackOrder[currentIndex];
        if (currentPlayingTrack && track.id === currentPlayingTrack.id) {
            row.classList.add('active');
        }

        row.innerHTML = `
            <img src="${track.thumbnail}" alt="thumb">
            <span class="title">${track.title}</span>
        `;
        
        row.addEventListener('click', () => {
            const index = playbackOrder.findIndex(t => t.id === track.id);
            if (index !== -1) {
                currentIndex = index;
                playTrack(playbackOrder[currentIndex]);
            }
        });
        
        container.appendChild(row);
    });
}

// 6. Lancement d'un morceau
function playTrack(track) {
    if (!track) return;

    document.getElementById('current-title').innerText = track.title;
    document.getElementById('current-cover').src = track.thumbnail;

    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-id') === track.id) {
            item.classList.add('active');
        }
    });

    player.loadVideoById(track.id);
    document.getElementById('btn-play-pause').innerText = "⏸️";
}

// 7. Événements de changement d'état du lecteur YouTube
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        document.getElementById('btn-play-pause').innerText = "⏸️";
        startProgressTimer();
    } else {
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING) {
            document.getElementById('btn-play-pause').innerText = "▶️";
        }
        clearInterval(progressUpdateInterval);
    }

    if (event.data === YT.PlayerState.ENDED) {
        if (isRepeat) {
            player.playVideo(); 
        } else {
            nextTrack();
        }
    }
}

// 8. Navigation de lecture
function nextTrack() {
    if (playbackOrder.length === 0) return;
    currentIndex = (currentIndex + 1) % playbackOrder.length;
    playTrack(playbackOrder[currentIndex]);
}

// Navigation corrigée : l'index précédent se gère selon la liste playbackOrder en cours
function prevTrack() {
    if (playbackOrder.length === 0) return;
    currentIndex = (currentIndex - 1 + playbackOrder.length) % playbackOrder.length;
    playTrack(playbackOrder[currentIndex]);
}

function togglePlay() {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// 9. Gestionnaires de la barre de progression & Temps
function startProgressTimer() {
    clearInterval(progressUpdateInterval);
    progressUpdateInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        
        const current = player.getCurrentTime();
        const total = player.getDuration();
        
        if (total > 0) {
            const pct = (current / total) * 100;
            document.getElementById('progress-bar').value = pct;
            document.getElementById('time-current').innerText = formatTime(current);
            document.getElementById('time-total').innerText = formatTime(total);
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 10. Initialisation des Écouteurs d'Événements du DOM
function setupEventListeners() {
    document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
    document.getElementById('btn-next').addEventListener('click', nextTrack);
    document.getElementById('btn-prev').addEventListener('click', prevTrack);

    const shuffleBtn = document.getElementById('btn-shuffle');
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        buildPlaybackOrder();
    });

    const repeatBtn = document.getElementById('btn-repeat');
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
    });

    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('input', (e) => {
        const total = player.getDuration();
        if (total > 0) {
            const newTime = (e.target.value / 100) * total;
            player.seekTo(newTime, true);
        }
    });

    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', (e) => {
        const vol = e.target.value;
        player.setVolume(vol);
        document.getElementById('volume-icon').innerText = vol == 0 ? "🔇" : vol < 40 ? "🔈" : "🔊";
    });

    document.getElementById('search-bar').addEventListener('input', (e) => {
        const searchWord = e.target.value.toLowerCase().trim();
        displayPlaylist = originalPlaylist.filter(track => 
            track.title.toLowerCase().includes(searchWord)
        );
        renderPlaylist(displayPlaylist);
    });
}
