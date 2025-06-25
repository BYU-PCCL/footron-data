// export default class Slideshow {
//   constructor(id, slides, setImageFunction) {
//     this.displayDiv = document.getElementById(id)
//     this.slides = slides
//     this.setImage = setImageFunction
//   }
//   SLIDE_DURATION = 5; // seconds
//   TEXT = "";
//   currentSlideIndex = null;
//   image=null;
//   next=null;
//   text="";
  
//   stopShow() {
//     this.next = function() {console.log("show stopped")}
//   }
  
//   startShow() {
//     this.runSlide(0)
//   }

//   runSlide(slideIndex) {
//     let {text, duration, image} = this.slides[slideIndex]
//     console.log(this.slides[slideIndex])
//     console.log(text, duration, image)
//     duration = duration ? duration : SLIDE_DURATION;
//     text = text ? text : "";
//     image = image ? image : null;
//     // this.next = slideIndex + 1 >= this.slides.length ? this.runSlide(0) : this.runSlide(slideIndex + 1)
//     this.next = function() {console.log("Unchanged")}
//     this.text = text;
//     this.setImage(image)

//     setTimeout(function(_) {
//       this.next();
//     }, duration * 1000)

//     this.next = function() {console.log("Changed")}

//     console.log(show)
//   }
// }

