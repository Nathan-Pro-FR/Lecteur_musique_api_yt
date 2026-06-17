const API_KEY = "YOUR_API_KEY";

const PLAYLIST_ID =
"PLe6uecFqdHnYTuMyPeyfZMbat1_R0V1Kz";

let tracks = [];
let current = 0;

let player;

let shuffle = false;
let repeat = false;

async function loadPlaylist() {

const url =
`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

tracks = data.items.map(item => ({
id:item.snippet.resourceId.videoId,
title:item.snippet.title,
thumbnail:item.snippet.thumbnails.high.url
}));

renderPlaylist();

loadTrack(0);
}

function renderPlaylist(){

const container =
document.getElementById("playlist");

container.innerHTML="";

tracks.forEach((track,index)=>{

const div=document.createElement("div");

div.className="track";

div.innerHTML=`
<img src="${track.thumbnail}">
<div>${track.title}</div>
`;

div.onclick=()=>loadTrack(index);

container.appendChild(div);

});

}

function loadTrack(index){

current=index;

document.getElementById("title").innerText =
tracks[index].title;

document.getElementById("cover").src =
tracks[index].thumbnail;

if(player){
player.loadVideoById(
tracks[index].id
);
}

}

function onYouTubeIframeAPIReady(){

player=new YT.Player("player",{

height:"1",
width:"1",

events:{
onReady:()=>{

loadPlaylist();

player.setVolume(50);

},
onStateChange:onStateChange
}
});
}

function onStateChange(event){

if(event.data===YT.PlayerState.ENDED){

if(shuffle){

const random =
Math.floor(
Math.random()*tracks.length
);

loadTrack(random);

return;
}

if(current < tracks.length-1){

loadTrack(current+1);

}
else if(repeat){

loadTrack(0);

}

}
}

document
.getElementById("nextBtn")
.onclick=()=>{

if(shuffle){

loadTrack(
Math.floor(
Math.random()*tracks.length
)
);

return;
}

loadTrack(
(current+1)%tracks.length
);

};

document
.getElementById("prevBtn")
.onclick=()=>{

loadTrack(
(current-1+tracks.length)%tracks.length
);

};

document
.getElementById("shuffleBtn")
.onclick=()=>{

shuffle=!shuffle;

};

document
.getElementById("repeatBtn")
.onclick=()=>{

repeat=!repeat;

};

document
.getElementById("playBtn")
.onclick=()=>{

const state =
player.getPlayerState();

if(state===1){

player.pauseVideo();

}else{

player.playVideo();

}

};

document
.getElementById("volume")
.oninput=(e)=>{

player.setVolume(
e.target.value
);

};

setInterval(()=>{

if(!player ||
!player.getDuration) return;

const currentTime =
player.getCurrentTime();

const duration =
player.getDuration();

document
.getElementById("progress")
.value=
(currentTime/duration)*100;

},500);

document
.getElementById("progress")
.oninput=(e)=>{

const duration=
player.getDuration();

player.seekTo(
(duration*e.target.value)/100,
true
);

};

document
.getElementById("search")
.oninput=(e)=>{

const value =
e.target.value.toLowerCase();

document
.querySelectorAll(".track")
.forEach(track=>{

track.style.display =
track.innerText
.toLowerCase()
.includes(value)
? "flex"
: "none";

});

};

document
.getElementById("miniBtn")
.onclick=()=>{

document
.querySelector(".cover-container img")
.classList.toggle("mini");

};
