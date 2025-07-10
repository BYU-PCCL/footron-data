let DEMO_SLIDES = [
  "Triangle",
  "Square",
  "Sailor",
  "Peace",
  "Fourier",
  "Fouriest",
  "Pentagon",
  "Po",
  "Infinity",
]

const FIRST_EXAMPLE = DEMO_SLIDES.splice(Math.floor(Math.random() * DEMO_SLIDES.length), 1);
const SECOND_EXAMPLE = DEMO_SLIDES.splice(Math.floor(Math.random() * DEMO_SLIDES.length), 1);

/**
 * Interpreted values are as follows
 * text: the displayed text on screen
 * image: The string name of the shape data. Passed into setImage()
 * duration: How long before the next slide in seconds
 * screen: a value of "left", "right", or "both" to set the fullscreen mode
 * numTerms: The number of terms used in the left canvas. Passed into setFourierAmt()
 * zoom: The zoom value started with the slide. Values from 0 - 1 are interpreted as percentages, 2+ are literal number of terms 
 * */
export const slides = [
  {
    image: "Y logo",
    screen: "left",
    zoom: 1
  },
  { text: "These circles, arranged in a chain, are currently tracing out the Y logo." },
  { text: "Each circle in the chain has a different frequency, amplitude, and starting angle." },
  { text: "Each one is rotating at a constant rate independently of the others." },
  {
    text: "Suprisingly, by carefully choosing just the amplitude and starting angle of these circles we can trace a continuous path of any complexity.",
    duration: 8
  },
  {
    text: "With a mathematical tool called the \"Fourier transform\" any function — whether that be a signal, field, or the outline of a logo — can be broken down into pieces.",
    image: FIRST_EXAMPLE,
    duration: 10
  },
  {
    text: "Here, we treat our path as a function in the complex plane, and the Fourier transform returns a series of complex sine waves.",
    screen: "left"
  },
  { text: "In other words, a series of rotating circles or 'epicycles'." },
  { duration: 5 },
  {
    text: "Look at how complex it gets.",
    zoom: 5
  },
  { text: "It looks like a chaotic mess." },
  { duration: 5 },
  {
    text: "But it all harmonizes to create a coherent image.",
    zoom: 1
  },
  {
    text: "Part of the utility of Fourier transform comes from being able to filter out unneccessary information.",
    screen: "both"
  },
  {
    text: "Let's see what happens if we use half the number of circles to make this image",
    numTerms: 0.5
  },
  {
    text: "It's nearly unchanged!",
    duration: 3
  },
  { 
    text: "Let's try building up from the beginning and see how many circles it takes.",
    numTerms: 2
  },
  { numTerms: 4 },
  { numTerms: 8 },
  { numTerms: 16 },
  {
    text: "The general shape is created by just the first few terms!",
    numTerms: 0.05
  },
  {
    text: "The detail is refined as more terms are added.",
    numTerms: 0.1
  },
  { numTerms: 0.2 },
  { numTerms: 0.4 },
  { numTerms: 0.8 },
  { numTerms: 1 },
  { screen: "left" },
  {
    text: "The fourier transform is widely used everywhere from phone call audio to quantum mechanics.",
    image: SECOND_EXAMPLE,
  },
]