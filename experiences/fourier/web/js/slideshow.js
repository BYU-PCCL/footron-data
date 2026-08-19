import { fullscreen, setFollowIndex, setFourierAmt, setImage, setZoom } from "./main.js";

export default class Slideshow {
  constructor(id, slides, defaultDuration = 5, autoStart = 30, firstWait = 10) {
    this.displayDiv = document.getElementById(id);
    this.slides = slides;
    this.defaultDuration = defaultDuration;
    this.autoStart = autoStart;
    this.currentSlideIndex = 0;
    this.startShowTimeout=null;
    this.image=null;
    this.next=null;
    this.text=null;
    this.next = () => {
      console.error("Slideshow.next() called before show started");
    }
    this.resetWait(firstWait);
  }

  resetWait(waitSeconds = this.autoStart) {
    this.clearWait()
    this.startShowTimeout = setTimeout(() => {
        this.startShow()
      },
      waitSeconds * 1000
    )
  }

  clearWait() {
    window.clearTimeout(this.startShowTimeout);
  }
  
  stopShow() {
    this.setText(null)
    this.next = function() {console.log("show stopped")}
    this.resetWait()
  }
  
  startShow() {
    this.clearWait()
    console.log("Starting slideshow")
    this.currentSlideIndex = 0
    this.next = () => {
      this.currentSlideIndex++
      this.runSlide()
    }
    this.runSlide()
  }

  runSlide() {
    if (this.currentSlideIndex >= this.slides.length) {
      this.stopShow()
      return
    }
    const CURRENT_SLIDE = this.slides[this.currentSlideIndex]
    console.log("Running slide ", this.currentSlideIndex)
    console.log("Slide: ", CURRENT_SLIDE)
    const DURATION = CURRENT_SLIDE.duration ? CURRENT_SLIDE.duration : this.defaultDuration;
    this.setText(CURRENT_SLIDE.text)
    this.setImage(CURRENT_SLIDE.image)
    this.setScreen(CURRENT_SLIDE.screen)
    this.setNumTerms(CURRENT_SLIDE.numTerms)
    this.setZoom(CURRENT_SLIDE.zoom)

    setTimeout(() => {
      this.next();
    }, DURATION * 1000)
  }

  setText(text) {
    this.displayDiv.className = "hidden"
    if (!text) {
      console.log("Clearing Text")
      this.displayDiv.innerText = ""
      return
    }
    setTimeout(() => {
      console.log("Setting Text: " + text)
      this.displayDiv.innerText = text
      this.displayDiv.className = ""
    },
    1000)
  }

  setImage(image) {
    if (image != null) {
      console.log("Setting Image: " + image)
      setImage(image)
    }
  }

  setScreen(screen) {
    if (screen != null) {
      console.log("Setting screen: " + screen)
      fullscreen(screen)
    }
  }

  setNumTerms(numTerms) {
    if (numTerms != null) {
      console.log("Setting NumTerms: " + numTerms)
      setFourierAmt(numTerms)
    }
  }

  setZoom(zoom) {
    if (zoom != null) {
      console.log("Setting Zoom: " + zoom)
      setZoom(zoom)
      if (zoom > 1) {
        setFollowIndex(20)
    } else {
      setFollowIndex(null)
    }
    }
  }
}

