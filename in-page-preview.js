
function createReplay(positions) {	
	thisI = 0
	for(j in positions) {
		if(positions[j].me == 'me') {
			me = j
		}
    }
	tileSize = 40
	
	can = document.createElement('canvas')
	can.id = 'mapCanvas'
	can.width = 30*tileSize
	can.height = 18*tileSize
	can.style.zIndex = 200
	can.style.position = 'absolute'
	can.style.top = (window.innerHeight - can.height - 20)/2 + 'px'
	can.style.left = (window.innerWidth - can.width - 20)/2 + 'px'
	can.style.display = 'block'
	can.style.transition = "opacity 0.5s linear"
	can.style.opacity = 0

	document.body.appendChild(can)
	can = document.getElementById('mapCanvas')
	context = can.getContext('2d')
	
	imgDiv = document.createElement('div')
	
	img = new Image()
	img.src = 'images/tiles.png'
	img.id = 'tiles'
	img = document.body.appendChild(img)
	img.onload = function() {
		mapImgData = drawMap(0, 0, positions)
		mapImg = new Image()
		mapImg.src = mapImgData
		imgDiv.appendChild(mapImg)
		mapImg.onload = function() {
			animateReplay(thisI, positions, mapImg)
		}
	}
	
	portalImg = new Image()
	portalImg.src = 'images/portal.png'
	portalImg.id = 'portal'
	imgDiv.appendChild(portalImg)

	speedpadImg = new Image()
	speedpadImg.src = 'images/speedpad.png'
	speedpadImg.id = 'speedpad'
	speedpadImg = imgDiv.appendChild(speedpadImg)

	speedpadredImg = new Image()
	speedpadredImg.src = 'images/speedpadred.png'
	speedpadredImg.id = 'speedpadred'
	speedpadredImg = imgDiv.appendChild(speedpadredImg)

	speedpadblueImg = new Image()
	speedpadblueImg.src = 'images/speedpadblue.png'
	speedpadblueImg.id = 'speedpadblue'
	speedpadblueImg = imgDiv.appendChild(speedpadblueImg)

	tagproImg = new Image()	
	tagproImg.src = 'http://i.imgur.com/N11aYYg.png'
	tagproImg.id = 'tagpro'
	tagproImg = imgDiv.appendChild(tagproImg)

	rollingbombImg = new Image()
	rollingbombImg.src = 'http://i.imgur.com/kIkEHPK.png'
	rollingbombImg.id = 'rollingbomb'
	rollingbombImg = imgDiv.appendChild(rollingbombImg)
	
	////////////////////////////////////
	/////     Playback buttons     /////
	////////////////////////////////////
	
	function updateMap(mapImg) {
		thingy = setInterval(function() {
			if(thisI == positions.clock.length - 1) {
				clearInterval(thingy)
			}
			animateReplay(thisI, positions, mapImg)
			thisI++
		}, 1000/positions[me].fps)
	}

  // functions to show, hide, and remove buttons
  function showButtons() {
    var buttons = {pause  : pauseButton,
                   play   : playButton,
                   stop   : stopButton,
                   reset  : resetButton,
    }
    for(button in buttons) {
      buttons[button].style.opacity="1.0"
      buttons[button].style.cursor="pointer"
    }
  }
  
  function hideButtons() {
    var buttons = {pause  : pauseButton,
                   play   : playButton,
                   stop   : stopButton,
                   reset  : resetButton,
    }
    for(button in buttons) {
      buttons[button].style.opacity="0"
    }
  }
  
  function removeButtons() {
    var buttons = {pause  : pauseButton,
                   play   : playButton,
                   stop   : stopButton,
                   reset  : resetButton,
    }
    for(button in buttons) {
      buttons[button].remove()
    }
  }
	
  // functions to control replay playback
  function resetReplay() {
    thisI=0
    clearInterval(thingy)
    animateReplay(thisI, positions, mapImg)
    delete(thingy)
    isPlaying=false
    showButtons()
  }
  function stopReplay() {
    thisI=0
    if(typeof thingy !== 'undefined') {
      clearInterval(thingy)
      delete(thingy)
      isPlaying=false
    }
    openReplayMenu()
    hideButtons()
    can.style.opacity = 0
    setTimeout(function(){
    	imgDiv.remove()
    	removeButtons()
    	can.remove()
    	newcan.remove()
    	img.remove()
    	delete(mapImg)
    }, 600)    
  }
  function playReplay() {
    if(typeof thingy === 'undefined') {
      updateMap(mapImg)
      isPlaying=true
      hideButtons()
    }
  }
  function pauseReplay() {
    clearInterval(thingy)
    delete(thingy)
    isPlaying=false
    showButtons()
  }
  
  // playback control buttons
  buttonURLs = {
    'stop'    : 'http://i.imgur.com/G32WYvH.png',
    'play'    : 'http://i.imgur.com/KvSKqpI.png',
    'pause'   : 'http://i.imgur.com/aSpd4cK.png',
    'forward' : 'http://i.imgur.com/TVtAO69.png',
    'reset'   : 'http://i.imgur.com/vs3jWpc.png'
  }
  
  // stop button
  stopButton = new Image()
  stopButton.id = 'stopButton'
  stopButton.src = buttonURLs['stop']
  stopButton.onclick=stopReplay
  stopButton.onmouseover = showButtons
  stopButton.onmouseleave = function() {if(isPlaying) hideButtons()}
  stopButton.style.position = "absolute"
  stopButton.style.top = +can.style.top.replace('px','') + can.height + 10 -70 + 'px'
  stopButton.style.left = window.innerWidth/2 - 199 + 'px'
  stopButton.style.transition = "opacity 0.25s linear"
  stopButton.style.zIndex = 300
  stopButton.style.opacity = 0
  document.body.appendChild(stopButton)
  
  // reset button
  var resetButton = new Image()
  resetButton.id = 'resetButton'
  resetButton.src = buttonURLs['reset']
  resetButton.onclick=resetReplay
  resetButton.onmouseover = showButtons
  resetButton.onmouseleave = function() {if(isPlaying) hideButtons()}
  resetButton.style.position="absolute"
  resetButton.style.top = +can.style.top.replace('px','') + can.height + 10 -70 + 'px'
  resetButton.style.left=window.innerWidth/2 - 85 + 'px'
  resetButton.style.transition="opacity 0.25s linear"
  resetButton.style.zIndex = 300
  resetButton.style.opacity = 0
  document.body.appendChild(resetButton)
  
  // play button
  var playButton = new Image()
  playButton.id = 'playButton'
  playButton.src = buttonURLs['play']
  playButton.onclick=playReplay
  playButton.onmouseover = showButtons
  playButton.onmouseleave = function() {if(isPlaying) hideButtons()}
  playButton.style.position="absolute"
  playButton.style.top = +can.style.top.replace('px','') + can.height + 10 -70 + 'px'
  playButton.style.left=window.innerWidth/2 + 28 + 'px'
  playButton.style.transition="opacity 0.25s linear"
  playButton.style.zIndex = 300
  playButton.style.opacity = 0
  document.body.appendChild(playButton)

  // pause button
  var pauseButton = new Image()
  pauseButton.id = 'pauseButton'
  pauseButton.src = buttonURLs['pause']
  pauseButton.onclick=pauseReplay
  pauseButton.onmouseover = showButtons
  pauseButton.onmouseleave = function() {if(isPlaying) hideButtons()}
  pauseButton.style.position="absolute"
  pauseButton.style.top = +can.style.top.replace('px','') + can.height + 10 -70 + 'px'
  pauseButton.style.left=window.innerWidth/2 + 142 + 'px'
  pauseButton.style.transition="opacity 0.25s linear"
  pauseButton.style.zIndex = 300
  pauseButton.style.opacity = 0
  document.body.appendChild(pauseButton)
  
  
  // because of the way the play button works, must ensure 'thingy' is undefined first
  delete(thingy)
  // define variable that stores play state
  isPlaying = false
  
  can.style.opacity = 1
  showButtons()
}	
	

	
