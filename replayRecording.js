/**
 * Record and save the state of the game, emitting an event to the
 * window with the replay data.
 * 
 * This file is injected into the page by the content script
 * TagProReplays. This is necessary in order to listen to the game
 * socket which provides game state information.
 */
(function(window, document, undefined) {

/**
 * Create an array of size N filled with zeros.
 * @param {integer} N - The size of the array to create.
 * @return {Array.<integer>} - An array of size `N` filled with zeros.
 */
function createZeroArray(N) {
    return Array.apply(null, {length: N}).map(Number.call, function() {
        return 0;
    });
}

/**
 * Read cookie with given name, returning its value if found. If no
 * cookie with the name is found, returns `null`.
 * @param {string} name - The name of the cookie to retrieve the value
 *   for.
 * @return {?string} - The value of the cookie, or null if not found.
 */
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * @typedef Options
 * @type {object}
 * @property {integer} fps - The FPS at which the replay should be
 *   recorded at.
 * @property {integer} duration - The duration (in seconds) of the
 *   replay.
 * @property {boolean} record_key_enabled - Whether or not the record
 *   hotkey should function.
 * @property {integer} record_key - The KeyCode for the hotkey that can
 *   be used to save a replay.
 * @property {boolean} record - Whether or not recording should occur.
 * @property {??} treter - ??
 */
/**
 * Get set options from cookies, or default options if no cookies are
 * set.
 * @return {Options} - The options to use when recording.
 */
function getOptions() {
    function getBooleanCookie(name, defaultValue) {
        var cookie = readCookie(name);
        if (cookie) {
            return cookie == "true";
        } else {
            return defaultValue;
        }
    }

    var fps = +readCookie('fps') || 60;
    var duration = +readCookie('duration') || 30;
    var record_key_enabled = getBooleanCookie('useRecordKey', true);
    var record_key = +readCookie('replayRecordKey') || 47;
    var record = getBooleanCookie('record', true);

    var options = {
        fps: fps,
        duration: duration,
        record_key_enabled: record_key_enabled,
        record_key: record_key,
        record: record
    };
    return options;
}

// Initially retrieve options.
var options = getOptions();

function recordReplayData() {
    var fps = options.fps;
    var saveDuration = options.duration;

    // set up position data object
    positions.bombs = [];
    positions.camera = createZeroArray(saveDuration * fps);
    positions.chat = [];
    positions.displayTime = createZeroArray(saveDuration * fps);
    positions.floorTiles = [];
    positions.map = tagpro.map;
    positions.players = {};
    positions.score = createZeroArray(saveDuration * fps);
    positions.spawns = [];
    positions.splats = [];
    positions.time = createZeroArray(saveDuration * fps);
    positions.wallMap = tagpro.wallMap;

    // ideally we would keep these and add them to the splats object, but there is no team indicator??
    delete positions.map.splats;


    // set up replay info data object
    replayInfo.mapName = $('#mapInfo').text().replace('Map: ', '').replace(/ by.*/, '');
    replayInfo.fps = fps;
    replayInfo.player = tagpro.playerId;
    replayInfo.spectating = tagpro.spectator !== false;
    
    // the following properties will be updated after the data are sent to the background page
    replayInfo.name = '';
    replayInfo.duration = 0;
    replayInfo.players = {};
    replayInfo.rendered = false;
    replayInfo.renderId = undefined;
    replayInfo.dateRecorded = 0;


    // set up listener for chats, splats, and bombs
    tagpro.socket.on('chat', function (CHAT) {
        var CHATOBJ = {
            from: CHAT.from,
            time: Date.now(),
            to: CHAT.to,
            message: CHAT.message
        };
        positions.chat.push(CHATOBJ);
    });

    tagpro.socket.on('splat', function (SPLAT) {
        var SPLATOBJ = {
            team: SPLAT.t,
            x: SPLAT.x,
            y: SPLAT.y,
            time: Date.now()
        };
        positions.splats.push(SPLATOBJ);
    });

    tagpro.socket.on('bomb', function (BOMB) {
        var BOMBOBJ = {
            time: Date.now(),
            type: BOMB.type,
            x: BOMB.x,
            y: BOMB.y
        };
        positions.bombs.push(BOMBOBJ);
    });

    tagpro.socket.on('spawn', function (SPAWN) {
        var SPAWNOBJ = {
            team: SPAWN.t,
            wait: SPAWN.w,
            x: SPAWN.x,
            y: SPAWN.y,
            time: Date.now()
        }; 
        positions.spawns.push(SPAWNOBJ);
    });

    tagpro.socket.on('end', function (END) {
        var ENDOBJ = {
            time: Date.now(),
            winner: END.winner
        };
        positions.gameEnd = END;
    });

    // 

    // function to save game data
    saveGameData = function () {
        for (var player in tagpro.players) {
            if (!positions.players[player]) {
                positions.players[player] = {
                    nameInfo: [{
                        time: Date.now(),
                        name: tagpro.players[player].name,
                        auth: tagpro.players[player].auth,
                        flair: tagpro.players[player].flair
                    }],
                    angle: createZeroArray(saveDuration * fps),
                    auth: createZeroArray(saveDuration * fps),
                    bomb: createZeroArray(saveDuration * fps),
                    dead: createZeroArray(saveDuration * fps),
                    degree: createZeroArray(saveDuration * fps),
                    draw: createZeroArray(saveDuration * fps),
                    flag: createZeroArray(saveDuration * fps),
                    flair: createZeroArray(saveDuration * fps),
                    grip: createZeroArray(saveDuration * fps),
                    name: createZeroArray(saveDuration * fps),
                    tagpro: createZeroArray(saveDuration * fps),
                    team: createZeroArray(saveDuration * fps), //players[player].team, // 1:red, 2:blue
                    x: createZeroArray(saveDuration * fps),
                    y: createZeroArray(saveDuration * fps)
                };
            }
        }
        for (var playerId in positions.players) {
            for (var prop in positions.players[playerId]) {
                // Only apply to properties tracked each frame
                if (positions.players[playerId][prop].length == saveDuration * fps) {
                    var frames = positions.players[playerId][prop];
                    
                    frames.shift();
                    if (typeof tagpro.players[playerId] !== 'undefined') {
                        frames.push(tagpro.players[playerId][prop]);
                    } else {
                        frames.push(null);
                    }
                }
            }
        }
        for (var j in positions.floorTiles) {
            positions.floorTiles[j].value.shift();
            positions.floorTiles[j].value.push(tagpro.map[positions.floorTiles[j].x][positions.floorTiles[j].y]);
        }
        positions.time.shift();
        positions.time.push(Date.now());
        positions.score.shift();
        positions.score.push(tagpro.score);
        positions.displayTime.shift();
        positions.displayTime.push(tagpro.gameEndsAt - Date.now());
        positions.camera.shift();
        positions.camera.push({x: tagpro.players[tagpro.playerId].x, y: tagpro.players[tagpro.playerId].y});
    };

    tagpro.socket.on('p', function(message){
        if(!Array.isArray(message)) {
            message = [message];
        }
        for (var i = 0; i < message.length; i++) {
            var data = message[i].u;

            if(data === undefined) return;
            for(var j = 0; j < data.length; j++) {
                if(data[j].name && positions.players[data[j].id]) {
                    var id = data[j].id;
                    var nameInfo = {
                        time: Date.now(),
                        name: data[j].name,
                        auth: data[j].auth,
                        flair: data[j].flair
                    };
                    positions.players[id].nameInfo.push(nameInfo);
                }
            }
        }
    });

    thing = setInterval(saveGameData, 1000 / fps);
}




function emit(event, data) {
    var e = new CustomEvent(event, {detail: data});
    window.dispatchEvent(e);
}


// send position data to content script
function saveReplayData(positions) {
    var data = JSON.stringify(positions);
    console.log('Sending replay data from injected script to content script.');
    emit('saveReplay', data);
}

// this function sets up a listener wrapper
function listen(event, listener) {
    window.addEventListener(event, function (e) {
        listener(e.detail);
    });
}

// TODO: Handle possible failure alert from content script.
listen('replaySaved', function() {
    console.log('Got message confirming data save.');
    $(savedFeedback).fadeIn(300);
    $(savedFeedback).fadeOut(900);
});


// function to add button to record replay data AND if user has turned on key recording, add listener for that key.
function makeRecordButton() {
    var recordButton = document.createElement("img");
    recordButton.id = 'recordButton';
    recordButton.src = 'http://i.imgur.com/oS1bPqR.png';
    recordButton.style.cursor = "pointer";
    recordButton.onclick = function () {
        saveReplayData(positions);
    };
    $('#sound').append(recordButton);

    var savedFeedback = document.createElement('a');
    savedFeedback.id = 'savedFeedback';
    savedFeedback.textContent = 'Saved!';
    savedFeedback.style.color = '#00CC00';
    savedFeedback.style.fontSize = '20px';
    savedFeedback.style.fontWeight = 'bold';
    $('#recordButton').after(savedFeedback);
    $(savedFeedback).hide();

    if (options.record_key_enabled) {
        $(document).on("keypress", function (e) {
            if (e.which == options.record_key) {
                saveReplayData(positions);
            }
        });
    }
}

if(options.record) {
    tagpro.ready(function() {
        var startInterval = setInterval(function() {
            if(tagpro.map && tagpro.wallMap) {
                clearInterval(startInterval);
                positions = {};
                replayInfo = {};
                makeRecordButton();
                recordReplayData();
            }
        }, 1000);
    });
}

})(window, document);
