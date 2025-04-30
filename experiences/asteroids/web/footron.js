// import { entities } from "./registered_entities";
/*
Script options
app 
    .cameraScripts // there is a way to set "cinematic to true"
        goToCelestialObject("NAME")
        goToSpacecraft("NAME")
        goToSystem("NAME")
    .getManager("time")
        .setDisplayUTC(BOOL)
        .parseTime(???, ???)
        .getTime()
        .getTimeUrl()
        .getDateFormat(???) "date"/"time"/"meridiem"
        .isUTC() ???
        .forcedPause
        .resetLimits()
        .setTimeRate(SECONDS_PER_SECOND
        .setToNow()
        .setToStart() ???
        .isNow()
        .getNow()
        .isWithinLimits(???)
        .momentToET()
        .pause()
        .play()
        .setMax()
        .resetMax()

    .getManager("camera")
        .zoomIn() TRUE / FALSE for clicked or held
        .zoomOut()
        .zoom(ratio) zooms in or out according to the ratio given 0.5 = half way
        .getContext()

    .getManager("scene")
    .getManager("layer")
        Layers = 
            "ui"
            "planets"
            "asteroids"
            "comets"
            "dwarfPlanets"
            "spacecraft"
            "trails"
            "orbits"
            "labels"
            "icons"
            "starfield"
            "constelations"
        .getLayer("LAYER")
        .toggleLayer("LAYER")
        .getLayerFromCategory(???)
        .addCallback("LAYER", ???)
        .resetTarget() ???
        .setTarget(???)
    .getManager("filters")

  .getComponent(COMPONENT)
    "asteroidPanel"
    "asteroid_menu_bottom"
    "asteroid_menu_top"
    "asteroid_modals"
    "auroras"
    "basic"
    "breadcrumb"
    "cameraFollowSearch"
    "clock"
    "clockShortcut"
    "contentPanel"
    "definitionOverlay"
    "filtersModal"
    "followingPanel"
    "infoPanel"
    "kioskSessionClock"
    "laser1"
    "laser2"
    "layerPanel"
    "loadIcon"
    "magnetosphere"
    "microwave"
    "missionPanel"
    "overlay"
    "radiation_belt_1"
    "radiation_belt_2"
    "radiation_belt_3"
    "radiation_belt_4"
    "search"
    "searchDesktop"
    "settings"
      .toggleLightOptions("SETTING")  "flood", "natural", "shadow"
      .toggleUnit()
    "splashScreen"
    "story"
        .goToNextSlide()
        .goToPreviousSlide()
    "timeSlider"
    "toast"
    "tutorialOverlay"
    "viewOptionsBlock"
    "watchPanel"

app.camaeraScrips.gotoCelestialObject()
app.getManager("time").setTimeRate(1) (takes int seconds per second)
*/

// TIME METHODS
/**
 * Sets time to current date and time and the speed of time to 1s/s
 */
async function live() {
  await setTimeRate(1);
  await app.getManager("time")
    .setToNow();
}

/**
 * Sets time to current date and time and the speed of time to 5d/s
 */
function defaultTimeSettings() {
  setTimeRate(432000);
  app.getManager("time")
    .setToNow();
}

/**
 * Sets the speed of time in the experience
 *
 * @param {*} rate - number sim-seconds per second positive or negative
 */
async function setTimeRate(rate) {
  await app.getManager("time")
    .setTimeRate(rate);
}

// FLY METHODS
/**
 * Moves the camera smoothly to destination specified
 *
 * @param {*} destination - The requested destination. Must have a parameters type and target
 */
async function flyTo(destination) {
  console.log(destination);
  let target = entities[destination];
  if (target == null)
    throw "entities doesn't contain " + destination;
  let message = {};
  message.title = destination;
  message.content = entityDescriptions[destination];
  client.sendMessage(message);
  console.log(message)
  await app.cameraScripts.goToSystem("inner_solar_system");
  if (celestialObjects[destination])
    await app.cameraScripts.goToCelestialObject(target);
  else if (spacecraft[destination])
    await app.cameraScripts.goToSpacecraft(target);
  else if (systems[destination])
    await app.cameraScripts.goToSystem(target);
  else throw "destination " + destination + " is not in any confirmed lists.";
}

// async function flyToObject(destination) {
//   console.log(destination);
//   client.sendMessage(entityDescriptions[destination.target]);
//   await flyToSystem("inner_solar_system");
//   await app.cameraScripts.goToCelestialObject(destination, {
//     cinematic: true,
//     duration: 5,
//   });
// }

// async function flyToSpacecraft(destination) {
//   console.log(destination);
//   client.sendMessage(entityDescriptions[destination.target]);
//   await flyToSystem("inner_solar_system");
//   await app.cameraScripts.goToSpacecraft(destination, {
//     cinematic: true,
//     duration: 5,
//   });
// }

// async function flyToSystem(destination) {
//   console.log(destination);
//   client.sendMessage(entityDescriptions[destination.target]);
//   await flyToSystem("inner_solar_system");
//   await app.cameraScripts.goToSystem(destination, {
//     cinematic: true,
//     duration: 5,
//   });
// }

/* TODO: zoom needs to be either 
  managed and set set directly by footron eg: currZoom++ && setZoom(currZoom);
  or 
  deferred to the app layer: app.zoomIn() app.zoomOut()
  the ui will probably decide this, maybe we keep a state variable in an update loop that is set when the ui slider changes
  putting both in, but both shouldn't be used.
  goTo scripts set zoom automatically so zoomIn should be okay if it can be smooth.
  */

/**
 * zooms the camera in
 */
function zoomIn() {
  app.getManager("camera")
    .zoomIn(true);
}

/**
 * zooms the camera out
 */
function zoomOut() {
  app.getManager("camera")
    .zoomOut(true);
}

/**
 * zooms the camera in or out based on the zoom ratio given. 0.5 zooms in halfway
 *
 * @param {number} zoomRatio
 */
function zoom(zoomRatio) {
  // 5% seems a little fast.
  app.getManager("camera")
    .zoom(zoomRatio);
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
  app.getComponent("settings")
    .toggleLightOptions(lightOption);
}

function resetFilters() {
  showPHOs(false);
  showComets(false);
  showAsteroids(false);
}

/**
 * Changes units... only on the asteroid watch view. Eyes doesn't have the unit switch implemented elsewhere
 */
function toggleUnits() {
  app.getComponent("settings")
    .toggleUnit();
  app.getManager("watch")
    .toggleUnit();
}

function filters() {
  app.getManager("router")
    .navigate({
      modal: "filters",
    });
}

async function showAsteroids(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters")
      .setFilter("asteroids", show, (t) => {
        result = t;
        resolve();
      });
  });
  return result;
}

async function showComets(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters")
      .setFilter("comets", show, (t) => {
        result = t;
        resolve();
      });
  });
  return result;
}

async function showPHOs(show) {
  let result = null;
  await new Promise((resolve) => {
    app.getManager("filters")
      .setFilter("phos", show, (t) => {
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
  app.getManager("layer")
    .toggleLayer(layer);
}

// ASTEROID WATCH METHODS
function cycleWatchView() {
  app.getManager("watch")
    .setSlideIndex(0);
}

/**
 * Removes the compenent from the screen
 *
 * @param {*} component
 */
function hideComponent(component) {
  app.getComponent(component)
    .hide();
}

/**
 * adds the compenent to the screen
 *
 * @param {*} component
 */
function showComponent(component) {
  app.getComponent(component)
    .show();
}

function minimizeWatch() {
  app.getManager("watch")
    .updateURL("");
}

function nextAsteroidWatch() {
  index = app.getManager("watch")
    ._slideIndex;
  console.log(index);
  app.getManager("watch")
    .setSlideUrlByIndex((index + 1) % 5);
}

function prevAsteroidWatch() {
  index = app.getManager("watch")
    ._slideIndex;
  console.log(index);
  app.getManager("watch")
    .setSlideUrlByIndex((index + 4) % 5);
}

// GENERAL METHODS
function goHome() {
  app.getManager("router")
    .navigate({
        __remove: "all",
      },
      "/home"
    );
}

function learn() {
  app.getManager("router")
    .navigate({
      modal: "learn",
    });
}

async function watch() {
  live();
  if (!app.getComponent("watchPanel")
    .isEnabled())
    app.getManager("watch")
    .onWatchClick();
}

// STORY METHODS
// It is going to be so much easier to have a local slide info table here and just update with this.
let currentSlideshow = null;
let currentSlideIndex = null;

let asteroidsSlides = [{
    storyLength: 5,
    index: 1,
    title: "Asteroids and Comets 101",
    info: "<p>Control the screen by pressing forward or back</p>",
  },
  {
    storyLength: 5,
    index: 2,
    info: "<p>\
        Asteroids and comets are remnants left over from the early formation of our solar system 4.6 billion years ago.\
        Asteroids are mostly rocky bodies that formed closer to the Sun than Jupiter, while comets formed farther from \
        the Sun and contain substantial amounts of frozen ices. The vast majority of these small bodies are asteroids, \
        and most of them reside within the main belt, between the orbits of Mars and Jupiter.\
    </p>",
  },
  {
    storyLength: 5,
    index: 3,
    info: "<p>\
        Asteroids range in size from Vesta (shown on screen) – one of the largest at about 329 miles (530 kilometers)  \
        in diameter – to bodies that are as small as 3 feet (1 meter) across. Most asteroids are small: the total mass \
        of all of them combined is far less than that of the Earth’s Moon.\
    </p>\
    <p>\
        Asteroids less than about one meter across are called meteoroids, and are generally too small to be detected by\
        telescopes. Meteoroids (or asteroids) that happen to hit Earth’s atmosphere become visible as meteors and      \
        largely disintegrate. Larger asteroids (car-sized or bus-sized) produce bright meteors called fireballs or     \
        bolides, but they also mostly disintegrate. Any solid leftover pieces that make it all the way to the ground   \
        are called meteorites.\
    </p>",
  },
  {
    storyLength: 5,
    index: 4,
    info: "<p>\
        Comets (like 67P/Churyumov-Gerasimenko, shown on screen) also have dust and rock, but also contain large       \
        amounts of various frozen ices. Comets generally follow long elliptical orbits in which they spend most of     \
        their time far from the Sun, where the ices can remain frozen.\
    </p>\
    <p>\
        When a comet’s orbit brings it closer to the Sun, the ices start heating up, creating explosive jets which spew\
        out gas and dust. The expelled material forms into a cloud around the solid nucleus called the “coma”, that can\
        be larger than a planet. The material is also swept back away from the Sun into diffuse tails that can stretch \
        for millions of miles. Eventually, after thousands of orbits, a comet’s ices will be depleted. Some objects now\
        classified as asteroids may simply be “dead” comets.\
    </p>",
  },
  {
    storyLength: 5,
    index: 5,
    info: '<p>\
        Many asteroids orbit nearby. On occasion, one impacts our planet. For example, the dinosaurs are thought to    \
        have been made extinct by the impact of a large asteroid 6-9 miles wide (10-15 km) that collided with Earth 66 \
        million years ago.\
    </p>\
        NASA established the\
        <a href="https://www.nasa.gov/planetarydefense/overview" target="_blank">\
            Planetary Defense Coordination Office (PDCO)\
        </a> to manage its ongoing mission of planetary defense, which includes tracking potentially hazardous objects.\
        The PDCO has a lead role in coordinating U.S. government planning for response to an actual impact threat, and \
        is supported by the\
        <a class="clickable" href="https://cneos.jpl.nasa.gov" target="_blank">\
            Center for Near-Earth Object Studies (CNEOS)\
        </a>,\
        which is NASA’s center for computing asteroid and comet orbits and their odds of impacting Earth.\
    </p>\
    <p>\
        For more on close approaches, try the "Close Approach" lesson under the "Learn" tab.\
    </p>',
  },
];

let closeApproachesSlides = [{
    storyLength: 7,
    index: 1,
    title: "What is a Close Approach?",
    info: "<p>Control the screen by pressing forward or back</p>",
  },
  {
    storyLength: 7,
    index: 2,
    info: '<p>\
        Some asteroids will inevitably approach Earth, and these are tracked by NASA. The\
        <a class="clickable" href="https://cneos.jpl.nasa.gov" target="_blank">\
            Center for Near-Earth Object Studies (CNEOS)\
        </a>\
        computes the orbits of asteroids and comets and their odds of impacting Earth. The orbits of all asteroids     \
        shown on screen are publicly available from NASA’s\
        <a class="clickable" href="https://ssd.jpl.nasa.gov" target="_blank">\
            Solar System Dynamics (SSD)\
        </a>\
        group.\
    </p>',
  },
  {
    storyLength: 7,
    index: 3,
    info: "<p>\
        Apophis is a near-Earth asteroid more than 1000 feet (over 300 meters) in size that will harmlessly pass close \
        to Earth on April 13, 2029. When it was discovered in 2004, the asteroid caused a stir because initial         \
        calculations indicated a small possibility it would impact Earth.\
    </p>",
  },
  {
    storyLength: 7,
    index: 4,
    info: '<p>\
        It’s now predicted the asteroid will safely pass about 23,189 miles (37,320 kilometers) from our planet’s      \
        surface. While that’s a safe distance, it’s close enough that the asteroid will come between Earth and our     \
        Moon, which is about 238,855 miles (384,400 kilometers) away. It’s also near the distance that some spacecraft \
        orbit Earth.\
    </p>\
    <p>\
        This asteroid has the official designation of being both a “Near Earth Object” and a “Potentially Hazardous    \
        Object.”\
    </p>',
    replay: true,
  },
  {
    storyLength: 7,
    index: 5,
    title: "What is a Near Earth Object (NEO)?",
    info: '<p>\
        Over millions of years, some main belt asteroids have been influenced by collisions and gravitational          \
        interactions with planets that have gradually changed their orbits so that they now pass through Earth’s       \
        general region of space. These are the Near-Earth Objects (NEOs).<br>Specifically, an NEO is defined as an     \
        asteroid or comet whose orbit brings it to within 1.3 astronomical units (\
        <a class="clickable" key="auLink">\
            AU\
        </a>\
        s) of the sun. Near-Earth Comets (NECs) are further restricted to only those with “short” orbital periods less \
        than 200 years.\
    </p>',
  },
  {
    storyLength: 7,
    index: 6,
    title: "What is a Potentially Hazardous Object?",
    info: "<p>\
            A Potentially Hazardous Object (PHO) is a Near-Earth Object (NEO) that is at least 140 meters (460 feet)   \
            in size, and whose orbit approaches Earth’s orbit to within 0.05 AU (7,480,000 km or 4,675,000 miles). PHOs\
            are “potentially hazardous” only in a long-term sense: almost all are not currently on Earth-crossing      \
            orbits, but their orbits are close enough that over hundreds or thousands of years, they may evolve to     \
            become Earth-crossing.\
        </p>",
  },
  {
    storyLength: 7,
    index: 7,
    info: '<p>\
        Explore the next 5 closest approaches through the "Watch" tab. These are continuously updated, as NASA is      \
        constantly on the lookout.\
    </p>',
  },
];

let missionSlides = [{
    storyLength: 11,
    index: 1,
    title: "Asteroid and Comet Missions",
    info: "<p>Control the screen by pressing forward or back</p>",
  },
  {
    storyLength: 11,
    index: 2,
    info: "<p>\
        NASA and other space agencies have sent spacecraft to visit, photograph, sample, and even collide with various \
        asteroids like Bennu, Vesta, and Eros, and the comets Tempel 1, 19P/Borrelly, and 67P Churyumov-Gerasimenko    \
        (shown on screen with the Rosetta spacecraft).\
    </p>",
  },
  {
    storyLength: 11,
    index: 3,
    info: "<p>\
        The very first mission to both orbit and land on an asteroid was the NEAR mission (Near Earth Asteroid         \
        Rendezvous, later renamed NEAR Shoemaker after the renowned geologist Eugene Shoemaker). The mission           \
        successfully orbited the asteroid Eros for a year, and ended the mission by landing on the surface on February \
        12th, 2001.\
    </p>",
  },
  {
    storyLength: 11,
    index: 4,
    info: "<p>\
        NASA has also sent several missions to study comets. On the 4th of July, 2005, NASA’s Deep Impact mission      \
        actually collided with a comet named Tempel 1 (9P/Tempel). The spacecraft (Deep Impact) sent a washing-machine \
        sized probe (the Deep Impact Impactor) to hit the comet itself, and then flew through the resulting cloud of   \
        space debris to analyze the composition. The comet’s nucleus had more dust and less ice than models had        \
        suggested.\
    </p>",
    replay: true,
  },
  {
    storyLength: 11,
    index: 5,
    info: "<p>\
        The Dawn mission was the first to orbit an object in the main asteroid belt, as well as the first mission to   \
        orbit two separate destinations.\
    </p>\
    <p>\
        Dawn spent over a year in orbit around Vesta, from July of 2011 until September of 2012. Dawn mapped Vesta's   \
        geology, composition, cratering record and more.\
    </p>"
  },
  {
    storyLength: 11,
    index: 6,
    info: "<p>\
        Dawn then traveled to Ceres, which is the largest object in the asteroid belt. (Ceres is still considered to be\
        an asteroid, but was designated as a dwarf planet in 2006.) The spacecraft arrived in 2015 and continued to    \
        collect data until running out of thruster fuel.\
    </p>\
    <p>\
        Dawn found abundant proof of water ice in the higher latitudes, as well as active geological features. Dawn    \
        remains in orbit around Ceres but will eventually impact the surface.\
    </p>",
  },
  {
    storyLength: 11,
    index: 7,
    info: "<p>\
        Other missions actually take samples of asteroids and comets. The Stardust mission flew by the comet Wild 2 and\
        collected samples from the dust trail of the comet, as well as interstellar dust.\
    </p>\
    <p>\
        These samples were later brought back to Earth via a detachable sample return capsule, which re-entered Earth’s\
        atmosphere on January 15th, 2006. The sample capsule landed in Utah and the millions of dust particles are     \
        still being studied to this day.\
    </p>",
  },
  {
    storyLength: 11,
    index: 8,
    info: "<p>\
        In October of 2020, the OSIRIS-REx mission successfully sampled the surface of the asteroid Bennu, collecting  \
        approximately 60 grams of surface material. The mission successfully dropped off the sample return capsule to  \
        Earth on September 24th, 2023, and is now on course to visit the asteroid Apophis.\
    </p>",
  },
  {
    storyLength: 11,
    index: 9,
    info: "<p>\
        NASA has several new missions to investigate asteroids, including Lucy and Psyche. Each mission promises to    \
        unlock further secrets of the formation and evolution of our solar system by studying asteroids. The Lucy      \
        mission is investigating the ancient Trojan asteroids that share Jupiter’s orbit, and the Psyche mission       \
        (shown on screen) is en route to the unique metal asteroid 16 Psyche.\
    </p>",
  },
  {
    storyLength: 11,
    index: 10,
    info: "<p>\
        The Double Asteroid Redirection Test, or DART, is a NASA mission that could be a plot from a Hollywood movie.  \
        As the very first planetary defense test mission, DART will test whether a spacecraft impact could deflect the \
        orbit of an asteroid. Even a slight change in the orbit of an asteroid could avert a collision with Earth if   \
        the change happens early enough. DART successfully impacted the asteroid moon Dimorphos, which is in a binary  \
        system with the larger asteroid Didymos. The orbital period of Dimorphos changed by 33 minutes.\
    </p>",
    replay: true,
  },
  {
    storyLength: 11,
    index: 11,
    info: "<p>\
        NASA and other space agencies will continue to send robotic explorers throughout our solar system.\
    </p>\
    <p>\
        The journey of discovery is just beginning.\
    </p>",
  },

]

function startStoryAsteroids(message) {
  currentSlideshow = asteroidsSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_101",
  };
  app.getComponent("learnModal")
    .goToStory(t);
  getSlideInfo();
}

function startStoryCloseApproaches() {
  currentSlideshow = closeApproachesSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_close_approach",
  };
  app.getComponent("learnModal")
    .goToStory(t);
  getSlideInfo();
}

function startStoryMissions() {
  currentSlideshow = missionSlides;
  currentSlideIndex = 0;
  let t = {
    path: "asteroids_missions",
  };
  app.getComponent("learnModal")
    .goToStory(t);
  getSlideInfo();
}

function getStorySlideIndex() {
  index = app.getComponent("story")
    ._state.currentSlideIndex;
  console.log("Current index: " + index);
  return index;
}

function nextSlide() {
  if (currentSlideIndex + 1 < currentSlideshow.length) {
    app.getComponent("story")
      .goToNextSlide();
    currentSlideIndex++;
    getSlideInfo();
  } else
    client.sendMessage({
      info: "Error: Trying to load slide past end",
    });
}

function prevSlide() {
  app.getComponent("story")
    .goToPrevSlide();
  if (currentSlideIndex < currentSlideshow.length) currentSlideIndex--;
  getSlideInfo();
}

function firstSlide() {
  app.getComponent("story")
    .goToFirstSlide();
  currentSlideIndex = 0;
  getSlideInfo();
}

function closeStory() {
  app.getComponent("story")
    .close();
  currentSlideshow = null;
  currentSlideIndex = null;
}

function getSlideInfo() {
  info = currentSlideshow[currentSlideIndex];
  console.log("slideIndex: " + currentSlideIndex + " info: " + info);
  info.nextSlideButton = currentSlideIndex + 1 < currentSlideshow.length;
  info.prevSlideButton = currentSlideIndex > 0;
  console.log("Sent info: ", info);
  client.sendMessage(info);
}

function replayAnimation() {
  const t = app.getManager("router");
  t.reload();
}