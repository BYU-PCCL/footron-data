# Layout

* Overall layout is easily controlled from the `view_info.json` file (actually implimented in `app.js`). Simply deleting a listed component causes it not to be rendered.

When individual components are used in non-standard ways UI layout can be odd. Things may not be in the correct locations.

Footron shouldn't ever require the following:

* `asteroid_menu_top`
* `asteroid_menu_bottom`
* `asteroid_modals`
* `definitionOverlay`
* `homeButton`
* `layerPanel`
* `search`
* `settings`
* `splashScreen` (Maybe)
* `timeSlider`
* `tutorialOverlay`

It will probably need these:

* `asteroidPanel`
* `breadcrumb`
* `clock`
* `clockShortcut`
* `followingPanel`
* `loadIcon`
* `missionPanel`
* `overlay`
* `story`
* `watchPanel`


## `view_info.json` components

### `asteroid_menu_top`

The Learn, Asteroid Watch, and Filters header

### `asteroid_menu_bottom`

The Same header options visible on vertical displays.

### `asteroid_modals`

The pop-in menus used for `filters` and `learn`

### `breadcrumb`

The *NASA Eyes on asteroids* button at the top of the page

configurable in `components_info.js`
**Default Options**
```js
params: {
    title: 'Eyes on Asteroids'
}
```

### `homeButton`

The "See all asteroids" button shown on the watch panel

### `clock`

The center date and right time UI

altered in `components_info.js` to have a smaller font

### `clockShortcut`

The *LIVE* button on the left of the time UI

### `timeSlider`

The time slider
configurable in `components_info.js`
**Default Options**
```js
config: {
    // dynamic based off how close the camera is to an entity
    enableDynamicRate: true,
    // variation in fastest time rates (seconds per second)
    fastestRate: {
        min: 3629000, // 6 weeks / sec
        max: 157700000 // 5 yrs / sec
    }
}
```

### `settings`

The right settings panel.

Something I did hid the actual ui; It's present, just transparent or rendering incorrectly.

this is actually the `AsteroidsSettings` component after being remapped in `components_info.js` 

### `layerPanel`

The slide-in settings menu for toggling layers. (only accessable through settings)

configurable in `components_info.js`
**Default Options**
```js
layers: [['planets'], ['spacecraft'], ['trails', 'labels', 'icons', 'starfield'], ['ui']],
checkboxType: 'eyes'
```

### `search`

The search bar.

configurable in `components_info.js`
**Default Options**
```js
config: {
    placeholderText: 'Search asteroids and comets...',
    allowFeatured: true,
    allowDetail: false,
    allowInfo: true,
    stopOnExactMatch: false,
    maxSuggestions: 3
}
```

### `definitionOverlay`

The pop-up definition windows

### `splashScreen`

The Title screen with bennu and the "Scroll to Enter" instruction. 

### `tutorialOverlay`

Also called the InfoPanel this is the info menu with all the definitions and instructions.
It is accessible through the settings component's show-info link

Without the definition overlay, the definition links will give an error to the console.

### `loadIcon`

I believe this is a placeholder while the model of an asteroid or spacecraft gets loaded. 

### `watchPanel`

The slide-in panel on the left shown in the "Asteroid Watch" view.
It is very similar to the [asteroidPanel](#asteroidpanel)

### `missionPanel`

Similar to the [asteroid](#asteroidpanel) or [following](#followingpanel) panels, this is the ui given for spacecraft and their missions.

### `asteroidPanel`

The slide-in panel on the left shown when folowing and asteroid **or** comet.
It is very similar to the [watchPanel](#watchPanel)

### `followingPanel`

This panel is used when following the sun or a non-asteroid planet.
It looks like it only is used collapsed in this site.

### `story`

This is the component used for the the Learn options. 
There is a lot in this component especially in the `blocks` sub component.

### `overlay`

## Internal Components

### `countdown`

Used internally just in the WatchPanel

### `navigation`

Used internally
I believe it just lets components link to other places on the site.

## Unused Components

### `toast`

Presumably a *toast* notification component.
used by `CameraFollowManager` but that doesn't seem like it actually gets used itself.
loads null component when retrieved.


# App Functionality

Script options
`app` 
    `.cameraScripts` // there is a way to set "cinematic to true"
        `.goToCelestialObject("NAME")`
        `.goToSpacecraft("NAME")`
        `.goToSystem("NAME")`
    `.getManager("time")`
        `.setDisplayUTC(BOOL)`
        `.parseTime(???, ???)`
        `.getTime()`
        `.getTimeUrl()`
        `.getDateFormat(???)` "date"/"time"/"meridiem"
        `.isUTC() ???`
        `.forcedPause`
        `.resetLimits()`
        `.setTimeRate(SECONDS_PER_SECOND)`
        `.setToNow()`
        `.setToStart()` ???
        `.isNow()`
        `.getNow()`
        `.isWithinLimits(???)`
        `.momentToET()`
        `.pause()`
        `.play()`
        `.setMax()`
        `.resetMax()`
    `.getManager("camera")`
        `.zoomIn()` TRUE / FALSE for clicked or held
        `.zoomOut()`
        `.zoom(ratio)` zooms in or out according to the ratio given 0.5 = half way
        `.getContext()`
    `.getManager("scene")`
    `.getManager("layer")`
        layer = 
            `"ui"`
            `"planets"`
            `"asteroids"`
            `"comets"`
            `"dwarfPlanets"`
            `"spacecraft"`
            `"trails"`
            `"orbits"`
            `"labels"`
            `"icons"`
            `"starfield"`
            `"constelations"`
        `.getLayer("LAYER")`
        `.toggleLayer("LAYER")`
        `.getLayerFromCategory(???)`
        `.addCallback("LAYER", ???)`
        `.resetTarget() ???`
        `.setTarget(???)`
    `.getManager("filters")`

  `.getComponent(COMPONENT)`
    `"asteroidPanel"`
    `"asteroid_menu_bottom"`
    `"asteroid_menu_top"`
    `"asteroid_modals"`
    `"auroras"`
    `"basic"`
    `"breadcrumb"`
    `"cameraFollowSearch"`
    `"clock"`
    `"clockShortcut"`
    `"contentPanel"`
    `"definitionOverlay"`
    `"filtersModal"`
    `"followingPanel"`
    `"infoPanel"`
    `"kioskSessionClock"`
    `"laser1"`
    `"laser2"`
    `"layerPanel"`
    `"loadIcon"`
    `"magnetosphere"`
    `"microwave"`
    `"missionPanel"`
    `"overlay"`
    `"radiation_belt_1"`
    `"radiation_belt_2"`
    `"radiation_belt_3"`
    `"radiation_belt_4"`
    `"search"`
    `"searchDesktop"`
    `"settings"`
      `.toggleLightOptions("SETTING")  "flood", "natural", "shadow"`
      `.toggleUnit()`
    `"splashScreen"`
    `"story"`
        `.goToNextSlide()`
        `.goToPreviousSlide()`
    `"timeSlider"`
    `"toast"`
    `"tutorialOverlay"`
    `"viewOptionsBlock"`
    `"watchPanel"`

`app.camaeraScrips.gotoCelestialObject()`
`app.getManager("time").setTimeRate(1)` (takes int seconds per second)