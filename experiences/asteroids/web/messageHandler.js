async function messageHandler(message) {
  console.log(message);
  if (message == null) throw "message is null";
  switch (message.type) {
    case "settings":
      handleSettingsMessage(message);
      break;
    case "fly":
      handleFlyMessage(message);
      break;
    case "time":
      handleTimeMessage(message);
      break;
    case "learn":
      handleLearnMessage(message);
      break;
    case "context":
      handleContextMessage(message);
      break;
    case "watch":
      handleWatchMessage(message);
      break;
    case "zoom":
      handleZoomMessage(message);
      break;
    default:
      throw "Can't understand message: " + message;
  }
}

console.log("MESSAGE HANDLER");
const client = new FootronMessaging.Messaging();
client.mount();
client.addMessageListener(messageHandler);

async function handleSettingsMessage(message) {
  let count = null;
  if (message.setting == null) throw "message.setting is null";
  switch (message.setting) {
    case "asteroids":
      if (message.value == null) throw "message.value is null";
      count = await showAsteroids(message.value);
      // client.sendMessage(count);
      break;
    case "phos":
      if (message.value == null) throw "message.value is null";
      count = await showPHOs(message.value);
      // client.sendMessage(count);
      break;
    case "comets":
      if (message.value == null) throw "message.value is null";
      count = await showComets(message.value);
      // client.sendMessage(count);
      showComets(message.value);
      break;
    case "lighting":
      if (message.value == null) throw "message.value is null";
      else if (message.value == "flood") setLighting("flood");
      else if (message.value == "shadow") setLighting("shadow");
      else if (message.value == "natural") setLighting("natural");
      else throw "unknown value: " + message.value;
      break;
    case "planets":
      toggleLayer("planets");
      break;
    case "spacecraft":
      toggleLayer("spacecraft");
      break;
    case "trails":
      toggleLayer("trails");
      break;
    case "labels":
      toggleLayer("labels");
      break;
    case "icons":
      toggleLayer("icons");
      break;
    case "starfield":
      toggleLayer("starfield");
      break;
    case "userInterface":
      toggleLayer("ui");
      break;
    default:
      throw "Unknown setting: " + message.setting;
  }
}

function handleFlyMessage(message) {
  if (message.value == null) throw "message.value is null";
  flyTo(message.value);
}

function handleTimeMessage(message) {
  if (message.value == null) throw "message.value is null";
  if (message.value == "live") live();
  else setTimeRate(message.value);
}

function handleLearnMessage(message) {
  if (message.value == null) throw "message.value is null";
  if (message.value == "asteroids-101") startStoryAsteroids();
  else if (message.value == "close-approaches") startStoryCloseApproaches();
  else if (message.value == "missions") startStoryMissions();
  else if (message.value == "next") nextSlide();
  else if (message.value == "previous") prevSlide();
  else if (message.value == "first") firstSlide();
  else if (message.value == "replay") replayAnimation();
  else throw "unknown value: " + message.value;
}

function handleContextMessage(message) {
  if (message.value == null) throw "message.value is null";
  if (message.value == "home") goHome();
  else if (message.value == "watch") watch();
  else if (message.value == "fly") goHome();
  else if (message.value == "learn") goHome();
  else throw "unknown value: " + message.value;
}

function handleWatchMessage(message) {
  if (message.value == null) throw "message.value is null";
  if (message.value == "next") nextAsteroidWatch();
  else if (message.value == "previous") prevAsteroidWatch();
  else throw "unknown value: " + message.value;
}

function handleZoomMessage(message) {
  if (message.value == null) throw "message.value is null";
  if (message.value == "in") zoomIn();
  else if (message.value == "out") zoomOut();
  else throw "unknown value: " + message.value;
}
