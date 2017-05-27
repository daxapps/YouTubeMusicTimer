// var thr;
var tmin;
var tsec;
var x;
var y;
var time = document.getElementById("t");

function startSec(){
      tsec--;
      // if (thr > 0)
      if(tmin > 0 & tsec == -1){
            tsec = 59;
            tmin--;
      }else if (tmin == 0 && tsec == -1) {
            tsec = 59;
      }else if (tmin == 0 && tsec == 0) {
            // alert("Done!");

      }
      time.innerHTML = tmin + "m " + tsec + "s";
}
function startTimer(){
  $('#startBtn').hide()
  $('#stopBtn').show()
  tmin = document.getElementById("min").value;
  tsec = document.getElementById("sec").value;
  time.innerHTML = tmin + ":" + tsec; 
  x = setInterval(startSec, 1000);
}

function stopTimer(){
  $('#startBtn').show()
  $('#stopBtn').hide()
  x = clearTimeout(x)
}

$('#startBtn').on("click", function(e) {
  startTimer();
})

$('#stopBtn').on("click", function(e) {
  e.preventDefault();
  stopTimer();
})

