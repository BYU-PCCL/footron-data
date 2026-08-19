// DEV testing tools TODO: remove for prod

let a,
  b = null;

console.log("DEV TOOLS");

async function initDevTools() {
  document.addEventListener("keydown", devShortcuts);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let entityIndex = 0;
let newBroken = [];
let newWorking = [];

async function devShortcuts(event) {
  if (event.key === " ") {
    getEmAll();
  }
  if (event.key === "2") {
    learn();
  }
  if (event.key === "1") {
    await app.cameraScripts.goToSystem("134340_pluto");
  }
  if (event.key === "3") {
    filters();
  }
  if (event.key === "4") {
    showAsteroids(true);
  }
  if (event.key === "5") {
    showComets(true);
  }
  if (event.key === "6") {
    showPHOs(true);
  }
  if (event.key === "7") {
    showAsteroids(false);
  }
  if (event.key === "8") {
    showComets(false);
  }
  if (event.key === "9") {
    showPHOs(false);
  }
  if (event.key === "0") {
    resetFilters();
  }
  if (event.key === "j") {
    setTimeRate(-1);
  }
  if (event.key === "k") {
    showPHOs(false);
  }
  if (event.key === "l") {
    live();
  }
  if (event.key === "u") {
    toggleLayer("ui");
  }
  if (event.key === "m") {
    minimizeWatch();
  }
  if (event.key == "v") {
    startStoryAsteroids();
  }
  if (event.key == "b") {
    startStoryCloseApproaches();
  }
  if (event.key == "n") {
    startStoryMissions();
  }
  if (event.key == "'") {
    closeStory();
  }
  if (event.key == "[") {
    prevSlide();
  }
  if (event.key == "]") {
    nextSlide();
  }
}

notThrowing = [];
throwing = [];

async function getEmAll() {
  for (entity in notWorkingYet) {
    entity = notWorkingYet[entity];
    try {
      await flyTo(entity)
      notThrowing.push(entity);
    } catch (error) {
      console.log(entity, error);
      throwing.push(entity);
    }
  }
  console.log(notThrowing);
  console.log(throwing);
  app.cameraScripts.goToCelestialObject("sun");
}

initDevTools();
