var YouTubeKey = "AIzaSyBZw_Dg7LohwJhi_O7ZOOz--qFthIyVlFM";

var YouTubeScript = document.createElement("script");
YouTubeScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(YouTubeScript);

function onYouTubeIframeAPIReady() { 
  ko.applyBindings(new Model()); 
}

function ItemModel(Options) {
  Options = Options || {};
  var Item = {}; 
  Item.Code = Options.Code;
  Item.Title = Options.Title || ("Untitled (" + Options.Code + ")");
  Item.StartAt = ko.observable(Options.StartAt || 0);
  return Item;
}

function Model() {
  Self = this;
  Self.List = ko.observableArray();
  Self.Filter = ko.observable();
  Self.FilteredList = ko.computed(FilteredList).extend({ "throttle": 100 });
  Self.SearchResults = ko.observableArray();
  var LocalStorageKey = "YouTubePlaylist";

  Self.InputValue = ko.observable();

  Self.ProcessInput = function() {
    var Input = Self.InputValue();

    var Expression = /^https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    var Match = Expression.exec(Input);
    if (Match && Match[1] && Match[1].length == 11) {
      AddVideoByCode(Match[1]);
    } else {
      SearchYouTube(Input);
    }
  }

  Self.AddToList = function(Code, Title) {
    Self.List.push(new ItemModel({ "Code": Code, "Title": Title }));
  }

  function SearchYouTube(Query) {
    JSONP.get (
      "https://www.googleapis.com/youtube/v3/search",
      {
        "part": "snippet",
        "q": Query,
        "maxResults": 1,
        "key": YouTubeKey
      },
      function(Data) {
        Self.SearchResults.removeAll();
        ((Data).items).forEach(function(video) {
          video = video;
          var snippet = video.snippet;
          var title = snippet.title;
          var video_id = (video.id).videoId;
          var author = snippet.channelTitle;
          var thumbnails = (snippet.thumbnails);
          var thumbnail_url = (thumbnails[Object.keys(thumbnails)[0]]).url;
          var SearchResult =
          {
            "Code": video_id,
            "Title": title,
            "Author": author,
            "ThumbnailURL": thumbnail_url,
            "Duration": 0
          };

          Self.SearchResults.push(SearchResult);
        });
      });
  }

  Self.Current = ko.observable();

  Self.Play = function(Item) {
    Player.loadVideoById(Item.Code, Item.StartAt());
    Self.Current(Item);
  }

  Self.List.subscribe(function() {
    if (Self.List().length == 0) {
      if (Player && Self.Current()) Player.stopVideo();
      return;
    }

    if (!Self.Current()) Self.PlaySomething();
  });

  Self.PlaySomething = function() {
    $('.input-group, #video').hide();
    var List = Self.FilteredList();
    Item = List[~~(Math.random() * List.length)];
    if (!Item) return;
  }

  Self.VideoStateChangeHandler = function(E) {
    if (E.data == YT.PlayerState.ENDED){
      if (Self.Loop()) Self.Play(Self.Current());
      else Self.PlaySomething();
    }
  }

  Self.Select = function(Model, Event) { 
    Event.toElement.select(); 
  }

  Self.ClearInput = function() {
    Self.InputValue("");
    Self.SearchResults.removeAll();
  }

  Player = new YT.Player ( 
    "player-container",
    { "events":
    { "onStateChange": Self.VideoStateChangeHandler,
    "onReady": onPlayerReady
  }
});

  function onPlayerReady(event) {
    event.target.playVideo();
  }

  // This is the callback for a computed observable, defined above.
  function FilteredList() {
    if (!Self.Filter()) return Self.List();
    return Self.List().filter(function(V) { 
      return V.Title.toLowerCase().indexOf(Self.Filter().toLowerCase()) > -1; 
    });
  }

  Self.AddSearchResultToList = function() { 
    $('.timer, .video').show();
    $('.restart-btn, .stop-btn, .restart-music-search-btn').hide();
    Self.AddToList(this.Code, this.Title);
    Self.ClearInput();
  }

}

// =======================================
// Timer
var tmin;
var tsec;
var x;
var time = document.getElementById("t");
var alarmSound = new Audio('Cuckoo-bird-sound.mp3');

function startSec(){
  tsec--;

  if (tmin > 0 & tsec == -1) {
    tsec = 59;
    tmin--;
  } else if (tmin == 0 && tsec == -1) {
    time.innerHTML = tsec + "s";
    tsec = 59;
  } else if (tmin == 0 && tsec == 0) {
    tmin = "00";
    tsec = "00";
    Player.stopVideo();
    stopTimer();
    alarmSound.play();
  }

  if (tmin == 0) {
    time.innerHTML = tsec + "s";
  } else {
    time.innerHTML = tmin + "m " + tsec + "s";
  }
  
}

function startTimer(){
  $('.start-btn, #set-timer-label').hide()
  $('.stop-btn').show()
  tmin = document.getElementById("min").value;
  tsec = document.getElementById("sec").value;
  if (tmin == 0) {
    time.innerHTML = tsec + "s";
  } else {
    time.innerHTML = tmin + "m " + tsec + "s";
  } 
  x = setInterval(startSec, 1000);
  Self.Play(Item);
}

function stopTimer(){
  $('.restart-btn').show()
  $('.stop-btn').hide()
  x = clearTimeout(x)
}

$('.start-btn').on("click", function(e) {
  startTimer();
  $('#video, .restart-music-search-btn').show();
  $('.restart-btn').hide();
})

$('.restart-btn').on('click', function(e) {
  $('.start-btn, .restart-btn').hide();
  $('.stop-btn').show();
  //restart video
  Self.Play(Item);
  // restart timer
  x = setInterval(startSec, 1000);
})

$('.stop-btn').on("click", function(e) {
  e.preventDefault();
  stopTimer();
  Player.stopVideo();
})

$('.restart-music-search-btn').on('click', function(e) {
  e.preventDefault();
  location.reload();
})

function renderInitialView() {
  $('.timer, #video').hide();
}

$(function() {
  renderInitialView();
});