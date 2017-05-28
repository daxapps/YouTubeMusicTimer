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
  // var Player;
  Self.List = ko.observableArray();
  Self.Filter = ko.observable();
  Self.FilteredList = ko.computed(FilteredList).extend({ "throttle": 100 });
  Self.SearchResults = ko.observableArray();
  var LocalStorageKey = "YouTubePlaylist";

  Self.InputValue = ko.observable();

  // important
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

  // important
  Self.AddToList = function(Code, Title) {
    Self.List.push(new ItemModel({ "Code": Code, "Title": Title }));
  }

  function SearchYouTube(Query) {
    JSONP.get (
      "https://www.googleapis.com/youtube/v3/search",
      {
        "part": "snippet",
        "q": Query,
        "maxResults": 5,
        "key": YouTubeKey
      },
      function(Data) {
        Self.SearchResults.removeAll();
        ((Data || {}).items || []).forEach(function(video) {
            video = video || {};
            var snippet = video.snippet || {};
            var title = snippet.title;
            var video_id = (video.id || {}).videoId;
            var author = snippet.channelTitle;
            var thumbnails = (snippet.thumbnails || {});
            var thumbnail_url = (thumbnails[Object.keys(thumbnails)[0]] || {}).url;
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

  // Self.Loop = ko.observable(false);

  // important
  Self.PlaySomething = function() {
    console.log('play PlaySomething')
    $('.input-group, #video').hide();
    var List = Self.FilteredList();
    Item = List[~~(Math.random() * List.length)];
    if (!Item) return;

    // Self.Play(Item);
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

  // important
  Player = new YT.Player ( 
    "player-container",
    { "events":
      { "onStateChange": Self.VideoStateChangeHandler,
        "onReady": onPlayerReady
      }
    });

  // important
  function onPlayerReady(event) {
    // if (localStorage[LocalStorageKey] && Self.List().length == 0) {
    //   Import(localStorage[LocalStorageKey]);
    // }
    // setInterval(SaveToLocalStorage, 5000);
    event.target.playVideo();
  }

  // important 
  // This is the callback for a computed observable, defined above.
  function FilteredList() {
    if (!Self.Filter()) return Self.List();
    return Self.List().filter(function(V) { 
      return V.Title.toLowerCase().indexOf(Self.Filter().toLowerCase()) > -1; 
    });
  }

  // important
  Self.AddSearchResultToList = function() {
    // why is video not showing?? 
    $('#timer, #video').show();
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
  }

  if (tmin == 0) {
    time.innerHTML = tsec + "s";
  } else {
    time.innerHTML = tmin + "m " + tsec + "s";
  }
  
}

function startTimer(){
  $('#startBtn').hide()
  $('#stopBtn').show()
  tmin = document.getElementById("min").value;
  tsec = document.getElementById("sec").value;
  if (tmin == 0) {
    time.innerHTML = tsec + "s";
  } else {
    time.innerHTML = tmin + "m " + tsec + "s";
  } 
  x = setInterval(startSec, 1000);
  Self.Play(Item);
  console.log('self play')
  // $('#video').show();
}

function stopTimer(){
  $('#startBtn').show()
  $('#stopBtn').hide()
  x = clearTimeout(x)
}

$('#startBtn').on("click", function(e) {
  startTimer();
  $('#video').show();
})

$('#stopBtn').on("click", function(e) {
  e.preventDefault();
  stopTimer();
  Player.stopVideo();
})

function renderInitialView() {
  $('#timer, #video').hide();
}

$(function() {
  renderInitialView();
});

// var state = {
//     previous: null,
//     next: null,
//     results: false
// }

// var base_url = "https://www.googleapis.com/youtube/v3/search?";

// function getData(searchTerm, callback, token) {
//     var query = {
//         key: 'AIzaSyBZw_Dg7LohwJhi_O7ZOOz--qFthIyVlFM',
//         q: searchTerm + " music",
//         part: 'snippet',
//         maxResults: 5,
//         pageToken: token
//     }
//     console.log(query);
//     $.getJSON(base_url, query, callback);
// }

// function displayData(data) {
//     var results = "";
//     console.log(data);

//     if (data.items) {
//         state.next = data.nextPageToken;
//         console.log("state.next", state.next);
//         state.previous = data.prevPageToken;
//         console.log("state.previous", state.previous);
//         state.results = true;

//         // items is specific to the YT API
//         data.items.map(function (video) {
          
//             results += `<div class="videoChoices thumbnail pointer" data-bind="click: $parent.AddSearchResultToList">
//             <a id="${video.id.videoId}" target="_self">${video.snippet.title}</a><br />
//             <img src="${video.snippet.thumbnails.medium.url}" class="videoThumbnail" /></div><br />`;
//         })
//     }
//     else {
//         if (state.results === false) {
//             $('.img-container').empty();
//         }
//         else {
//             results += "<p>no results</p>";
//         }
//     }

//     if (state.previous) { 
//         $('#prevBtn').removeClass('hide');
//     }

//     if (state.next) {
//         $('#nextBtn').removeClass('hide');     
//     }
    
//     $('.img-container').html(results);
// }

// $('#search').submit(function (event) {
//     event.preventDefault();
//     var userInput = $('form input').val();
//     getData(userInput, displayData);
// })

// $('#nextBtn').click(function (event) {
//     var userInput = $('form input').val();
//     getData(userInput, displayData, state.next);
// })

// $('#prevBtn').click(function (event) {
//     var userInput = $('form input').val();
//     getData(userInput, displayData, state.previous);
// })






// $('body').on('click', '.videoChoices a', function(event){
//   event.preventDefault();
//   console.log("Play video pressed")
//   // 2. This code loads the IFrame Player API code asynchronously.
//   var tag = document.createElement('script');

//   tag.src = "https://www.youtube.com/iframe_api";
//   var firstScriptTag = document.getElementsByTagName('script')[0];
//   firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//   // 3. This function creates an <iframe> (and YouTube player)
//   //    after the API code downloads.
//   var player;
//   function onYouTubeIframeAPIReady() {
//     player = new YT.Player('player', {
//       height: '390',
//       width: '640',
//       videoId: 'M7lc1UVf-VE',
//       events: {
//         'onReady': onPlayerReady
//       // 'onStateChange': onPlayerStateChange
//       }
//     });
//   }

//   function onPlayerReady(event) {
//     console.log("onPlayerReady")
//     event.target.playVideo();
//   }
// })

// function playVideo() {
//   console.log("Play video pressed")
//   // 2. This code loads the IFrame Player API code asynchronously.
//   var tag = document.createElement('script');

//   tag.src = "https://www.youtube.com/iframe_api";
//   var firstScriptTag = document.getElementsByTagName('script')[0];
//   firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//   // 3. This function creates an <iframe> (and YouTube player)
//   //    after the API code downloads.
//   var player;
//   function onYouTubeIframeAPIReady() {
//     player = new YT.Player('player', {
//       height: '390',
//       width: '640',
//       videoId: 'M7lc1UVf-VE',
//       events: {
//         'onReady': onPlayerReady
//       // 'onStateChange': onPlayerStateChange
//       }
//     });
//   }

//   function onPlayerReady(event) {
//     console.log("onPlayerReady")
//     event.target.playVideo();
//   }

// }
// playVideo();



// console.log(tag)
// 4. The API will call this function when the video player is ready.


// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
// var done = false;



// function onPlayerStateChange(event) {
// // if (event.data == YT.PlayerState.PLAYING && !done) {
// //   setTimeout(stopVideo, 6000);
// //   done = true;
// // }
// }

// function stopVideo() {
// player.stopVideo();
// }

// function playPauseVideo() {
// 	console.log(player.getPlayerState())
// 	if (player.getPlayerState() === 1) {
// 		// runs if video playing
// 		$('#pauseBtn').text('Start');
// 		player.pauseVideo();
// 	} else if (player.getPlayerState() === 2) {
// 		// runs if video paused
// 		$('#pauseBtn').text('Pause');
// 		player.playVideo();
// 	}
// }

// $('#pauseBtn').on('click', function(e){
//   e.preventDefault();
//   playPauseVideo();
// })

// $('#prevBtn').on('click', function(e){
//   e.preventDefault();
//   console.log(player.getPlayerState())
//   player.previousVideo();
// })

// $('#nextBtn').on('click', function(e){
// 	e.preventDefault();
// 	player.nextVideo();
// })

