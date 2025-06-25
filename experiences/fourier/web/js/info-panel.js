export default class InfoPanel {
  constructor(attachedCanvas) {
    console.log("CONSTRUCTOR: ", attachedCanvas.id)
    const panel = document.createElement("div");
    const odDiv = document.createElement("div");
    const odContainer = document.createElement("div");
    const od = new Odometer({
      el: odDiv,
      format: "(dddd)"
    })

    panel.className = "info-panel"
    panel.innerText = "Number of terms: ";

    odContainer.className = "od-container"
    // odDiv.className = "odometer"

    odContainer.appendChild(odDiv)
    panel.appendChild(odContainer)
    
    this.panel = panel;
    this.odDiv = odDiv
    this.od = od

    // Append it next to the canvas
    // attachedCanvas.parentElement.style.position = "relative"; // Ensure positioning context
    attachedCanvas.parentElement.appendChild(panel);
  }

  updateNum(newValue) {
    this.od.update(newValue)
    console.log("Number set to ", newValue)
  }

}
