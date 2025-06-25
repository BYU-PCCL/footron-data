// TIME METHODS
/**
 * Sets time to current date and time and the speed of time to 1s/s
 */
async function live() {
  await setTimeRate(1);
  await app.getManager("time").setToNow();
}

/**
 * Sets time to current date and time and the speed of time to 5d/s
 */
function defaultTimeSettings() {
  setTimeRate(432000);
  app.getManager("time").setToNow();
}

/**
 * Sets the speed of time in the experience
 *
 * @param {*} rate - number sim-seconds per second positive or negative
 */
async function setTimeRate(rate) {
  await app.getManager("time").setTimeRate(rate);
}

let cameraOrbitParameters = {
  yaw: 0,
  pitch: 0,
  roll: 0,
  zoom: 0,
};

let cameraFreeFlyParameters = {
  xAngleDv: 0,
  yAngleDv: 0,
  zAngleDv: 0,
  velocity: 0,
  context: { id: "sun" },
};

function setMotionParameters(message) {
  isFreefly = app.getManager("camera")._isFreeFly;
  if (isFreefly) {
    if (
      "pitch" in message ||
      "zoom" in message ||
      "yaw" in message ||
      "roll" in message
    )
      app.getManager("camera").toggleFreeFly();
  } else {
    if (
      "xAngleDv" in message ||
      "velocity" in message ||
      "yAngleDv" in message ||
      "zAngleDv" in message
    )
      app.getManager("camera").toggleFreeFly();
  }
  if ("pitch" in message) cameraOrbitParameters.pitch = message.pitch;
  if ("yaw" in message) cameraOrbitParameters.yaw = message.yaw;
  if ("roll" in message) cameraOrbitParameters.roll = message.roll;
  if ("zoom" in message) cameraOrbitParameters.zoom = message.zoom;
  if ("xAngleDv" in message)
    cameraFreeFlyParameters.xAngleDv = message.xAngleDv;
  if ("yAngleDv" in message)
    cameraFreeFlyParameters.yAngleDv = message.yAngleDv;
  if ("zAngleDv" in message) cameraOrbitParameters.roll = message.zAngleDv;
  if ("velocity" in message)
    cameraFreeFlyParameters.velocity = message.velocity;
}

// FLY METHODS

let currentTarget = null;

/**
 * Moves the camera smoothly to destination specified
*
* @param {*} destination - The requested destination. Must have a parameters type and target
*/
async function flyTo(destination) {
  if (Object.values(entities).includes(destination) == null)
    throw "entities doesn't contain " + destination;
  let destinationInfo = allInfo[destination]

  if (destinationInfo == null) throw `${destination} not in allInfo`;

  // duration helps to make sure entities are loaded
  const flyParameters = {duration: 3}
  
  // change date if destination doesn't exist currently.
  if (destinationInfo.dates) {
    timeManager = app.getManager("time");
    currentTime = timeManager.parseTime(timeManager.getTime());
    start = timeManager.parseTime(destinationInfo.dates.start);
    if (!start.isValid()) start = timeManager.getLimits().min;
    end = timeManager.parseTime(destinationInfo.dates.end);
    if (!end.isValid()) end = timeManager.getLimits().max;
    if (currentTime.isBefore(start) || currentTime.isAfter(end)) {
      newTime = null;
      if (destinationInfo.dates.highlight) newTime = destinationInfo.dates.highlight;
      else if (timeManager.getNow().isBefore(end))
        newTime = timeManager.getNow();
      else {
        newTime = timeManager.getMidTime(
          timeManager.parseTime(start),
          timeManager.parseTime(end)
        );
      }
      timeManager.setTime(newTime);
    }
  }

  // go to shared parent if it exists
  if (allInfo[destination].parent) {
    await app.cameraScripts.goToSystem(allInfo[destination].parent, { duration: 3 });
  } else {
    await app.cameraScripts.goToSystem("inner_solar_system", { duration: 3 });
  }

  if (celestialObjects.includes(destination))
    await app.cameraScripts.goToCelestialObject(destination, flyParameters);
  else if (spacecraft.includes(destination)) await app.cameraScripts.goToSpacecraft(destination, flyParameters);
  else if (systems.includes(destination)) {
    destination = systemToTarget[destination]
    await app.cameraScripts.goToSystem(destination, flyParameters);
  } else {
    try {
      await app.cameraScripts.goToCelestialObject(destination, flyParameters);
    } catch (error) {
      destinationInfo.description = {blurb: "Error flying to entity. Please try again"}
      console.error("destination " + destination + " is not in any confirmed lists.");
    }
  }
  client.sendMessage({ title: destination, content: destinationInfo });
}

/**
 * zooms the camera in
 */
function zoomIn() {
  app.getManager("camera").zoomIn(true);
}

/**
 * zooms the camera out
 */
function zoomOut() {
  app.getManager("camera").zoomOut(true);
}

/**
 * zooms the camera in or out based on the zoom ratio given. 0.5 zooms in halfway
 *
 * @param {number} zoomRatio
 */
function zoom(zoomRatio) {
  // 5% seems a little fast.
  app.getManager("camera").zoom(zoomRatio);
}

// SETTINGS METHODS

/**
 * changes the lighting mode
 *
 * @param {string} lightOption - accepts either "flood", "natural", or "shadow"
 */
function setLighting(lightOption) {
  if (
    lightOption !== "flood" &&
    lightOption !== "natural" &&
    lightOption !== "shadow"
  )
    throw lightOption + " is not a valid light setting";
  app.getComponent("settings").toggleLightOptions(lightOption);
}

function resetFilters() {
  showPHOs(false);
  showComets(false);
  showAsteroids(false);
}

/**
 * Changes units... only on the asteroid watch view.
 * Eyes doesn't have the unit switch implemented elsewhere
 */
function toggleUnits() {
  app.getComponent("settings").toggleUnit();
  app.getManager("watch").toggleUnit();
}

function filters() {
  app.getManager("router").navigate({
    modal: "filters",
  });
}

async function showAsteroids(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters").setFilter("asteroids", show, (t) => {
      result = t;
      resolve();
    });
  });
  return result;
}

async function showComets(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters").setFilter("comets", show, (t) => {
      result = t;
      resolve();
    });
  });
  return result;
}

async function showPHOs(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters").setFilter("phos", show, (t) => {
      result = t;
      resolve();
    });
  });
  return result;
}

/**
 * Toggles layers in the ui like star field or labels
 *
 * @param {*} layer - the layer to turn on or off
 */
function toggleLayer(layer) {
  if (layer == "planets") {
    app.getManager("layer").toggleLayer("planets");
    app.getManager("layer").toggleLayer("dwarfPlanets");
  } else {
    app.getManager("layer").toggleLayer(layer);
  }
  getCurrentSettings(); // TODO: remove
}

// ASTEROID WATCH METHODS
function cycleWatchView() {
  app.getManager("watch").setSlideIndex(0);
}

/**
 * Removes the compenent from the screen
 *
 * @param {*} component
 */
function hideComponent(component) {
  app.getComponent(component).hide();
}

/**
 * adds the compenent to the screen
 *
 * @param {*} component
 */
function showComponent(component) {
  app.getComponent(component).show();
}

function minimizeWatch() {
  app.getManager("watch").updateURL("");
}

function nextAsteroidWatch() {
  index = app.getManager("watch")._slideIndex;
  app.getManager("watch").setSlideUrlByIndex((index + 1) % 5);
}

function prevAsteroidWatch() {
  index = app.getManager("watch")._slideIndex;
  app.getManager("watch").setSlideUrlByIndex((index + 4) % 5);
}

// GENERAL METHODS
function goHome() {
  app.getManager("router").navigate(
    {
      __remove: "all",
    },
    "/home"
  );
}

function learn() {
  app.getManager("router").navigate({
    modal: "learn",
  });
}

async function watch() {
  live();
  if (!app.getComponent("watchPanel").isEnabled())
    app.getManager("watch").onWatchClick();
}

// STORY METHODS
// It is going to be so much easier to have a local slide info table here
// and just update with this.
let currentSlideshow = null;
let currentSlideIndex = null;

function startStoryAsteroids() {
  currentSlideshow = asteroidsSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_101",
  };
  app.getComponent("learnModal").goToStory(t);
  getSlideInfo();
}

function startStoryCloseApproaches() {
  currentSlideshow = closeApproachesSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_close_approach",
  };
  app.getComponent("learnModal").goToStory(t);
  getSlideInfo();
}

function startStoryMissions() {
  currentSlideshow = missionSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_missions",
  };
  app.getComponent("learnModal").goToStory(t);
  getSlideInfo();
}

function getStorySlideIndex() {
  index = app.getComponent("story")._state.currentSlideIndex;
  return index;
}

function nextSlide() {
  if (currentSlideIndex + 1 < currentSlideshow.length) {
    currentSlideIndex++;
    app.getComponent("story")._onSlideChange(currentSlideIndex);
    getSlideInfo();
  } else
    client.sendMessage({
      type: "error",
      info: "Error: Trying to load slide past end",
    });
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    app.getComponent("story")._onSlideChange(currentSlideIndex);
    getSlideInfo();
  } else
    client.sendMessage({
      type: "error",
      info: "Error: Trying to load slide before beginning",
    });
}

function firstSlide() {
  app.getComponent("story").goToFirstSlide();
  currentSlideIndex = 0;
  getSlideInfo();
}

function closeStory() {
  app.getComponent("story").close();
  currentSlideshow = null;
  currentSlideIndex = null;
}

function getSlideInfo() {
  info = currentSlideshow[currentSlideIndex];
  info.nextSlideButton = currentSlideIndex + 1 < currentSlideshow.length;
  info.prevSlideButton = currentSlideIndex > 0;
  client.sendMessage({ type: "slideInfo", slideInfo: info });
}

function replayAnimation() {
  const t = app.getManager("router");
  t.reload();
}
