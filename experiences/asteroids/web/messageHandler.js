let defaultTime = setTimeout(() => {
  setTimeRate(432000);
  console.log("TIME")
}, 3000);

let automationTimer = setTimeout(automation, 30000);

let automationChoices = [
  () => flyTo("sun"),
  () => flyTo("mercury"),
  () => flyTo("mars"),
  () => flyTo("moon"),
  () => flyTo("earth"),
  () => flyTo("jupiter"),
  () => flyTo("saturn"),
  () => flyTo("uranus"),
  () => flyTo("neptune"),
  () => flyTo("1_ceres"),
  () => flyTo("4_vesta"),
  () => flyTo("134340_pluto"),
  () => flyTo("sc_jwst"),
  () => flyTo("sc_parker_solar_probe"),
]

async function automation() {
  let choice = Math.floor(Math.random() * automationChoices.length)
  automationChoices[choice]()
  live();
  resetTimer();
}

function resetTimer() {
  clearTimeout(automationTimer); // Clear any existing timer
  automationTimer = setTimeout(automation, 20000); // Set a new timer for 30 seconds
}

async function messageHandler(message) {
  if (message == null) throw "message is null";
  clearTimeout(automationTimer);
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
    case "move":
      handleMoveMessage(message);
      break;
    default:
      throw "Can't understand message: " + message;
  }
}

console.log("MESSAGE HANDLER");
const client = new FootronMessaging.Messaging();
client.mount();
client.addMessageListener(messageHandler);

const layersList = [
  "asteroids",
  "constellations",
  "icons",
  "labels",
  "landers",
  "lightOption",
  "planets",
  "spacecraft",
  "starfield",
  "trails",
  "ui",
];
async function handleSettingsMessage(message) {
  let count = null;
  if (message.setting == null) throw "message.setting is null";
  switch (message.setting) {
    case "asteroidsFilter":
      if (message.value == null) throw "message.value is null";
      count = await showAsteroids(message.value);
      // client.sendMessage(count);
      break;
    case "phosFilter":
      if (message.value == null) throw "message.value is null";
      count = await showPHOs(message.value);
      // client.sendMessage(count);
      break;
    case "cometsFilter":
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
    default:
      if (layersList.includes(message.setting)) toggleLayer(message.setting);
      else throw "Unknown setting: " + message.setting;
  }
}

function handleFlyMessage(message) {
  console.log(message);
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

function handleMoveMessage(message) {
  setMotionParameters(message);
}
