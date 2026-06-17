const API_KEY = "AIzaSyAF2ixyvg8hzCSTKzEqPDZKDQyJKR5eGdU";

const PLAYLIST_ID = "PLe6uecFqdHnYTuMyPeyfZMbat1_R0V1Kz";

let playlist = [];
let filteredPlaylist = [];

let player;
let currentIndex = 0;

let shuffle = false;
let repeat = true;

async function loadPlaylist() {

let url =
`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

playlist = data.items.map(item => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high.url
}));

filteredPlaylist = [...playlist];

renderPlaylist();

if (playlist.length > 0) {
    loadSong(0);
}

}

function renderPlaylist() {

const container =
    document.getElementById("playlist");

container.innerHTML = "";

filteredPlaylist.forEach(song => {

    const div =
        document.createElement("div");

    div.className = "song";

    div.innerHTML = `
        <img src="${song.thumbnail}">
        <div class="song-info">
            <p>${song.title}</p>
        </div>
    `;

    div.onclick = () => {

        const realIndex =
            playlist.findIndex(
                s => s.id === song.id
            );

        loadSong(realIndex);
    };

    container.appendChild(div);
});
  

}
function onYouTubeIframeAPIReady() {

player = new YT.Player(
    "youtube-player",
    {
        height: "1",
        width: "1",
        events: {
            onReady: () => {
                loadPlaylist();
                setInterval(updateProgress,1000);
            },
            onStateChange: onPlayerStateChange
        }
    }
);


}

window.onYouTubeIframeAPIReady =
onYouTubeIframeAPIReady;

function loadSong(index){


currentIndex = index;

const song = playlist[index];

document.getElementById("songTitle")
    .textContent = song.title;

document.getElementById("cover")
    .src = song.thumbnail;

player.loadVideoById(song.id);


}

function playPause(){


const state = player.getPlayerState();

if(state === 1){
    player.pauseVideo();
}else{
    player.playVideo();
}

}

function nextSong(){


if(shuffle){

    currentIndex =
        Math.floor(
            Math.random()*playlist.length
        );

}else{

    currentIndex++;

    if(currentIndex >= playlist.length){

        if(repeat){
            currentIndex = 0;
        }else{
            return;
        }
    }
}

loadSong(currentIndex);


}

function prevSong(){


currentIndex--;

if(currentIndex < 0){
    currentIndex = playlist.length - 1;
}

loadSong(currentIndex);


}

function onPlayerStateChange(event){


if(event.data === YT.PlayerState.ENDED){
    nextSong();
}


}

function updateProgress(){


if(!player || !player.getDuration) return;

const duration =
    player.getDuration();

const current =
    player.getCurrentTime();

if(duration > 0){

    document.getElementById(
        "progressBar"
    ).value =
    current / duration * 100;
}


}

document
.getElementById("progressBar")
.addEventListener("input", e => {


const duration =
    player.getDuration();

player.seekTo(
    duration * (e.target.value / 100),
    true
);


});

document
.getElementById("volumeSlider")
.addEventListener("input", e => {

player.setVolume(
    e.target.value
);


});

document
.getElementById("playBtn")
.onclick = playPause;

document
.getElementById("nextBtn")
.onclick = nextSong;

document
.getElementById("prevBtn")
.onclick = prevSong;

document
.getElementById("shuffleBtn")
.onclick = () => {


shuffle = !shuffle;


};

document
.getElementById("repeatBtn")
.onclick = () => {


repeat = !repeat;


};

document
.getElementById("searchInput")
.addEventListener("input", e => {

    
const value =
    e.target.value.toLowerCase();

filteredPlaylist =
    playlist.filter(song =>
        song.title
        .toLowerCase()
        .includes(value)
    );

renderPlaylist();

});
