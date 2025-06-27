import { messageHandler } from "./message-handler.js";

addEventListener("keydown", (e) => {
  switch (e.key) {
    case "q":
      messageHandler({ type: "query", value: null });
      break;
    case "a":
      messageHandler({ type: "setImage", value: "Sailor" });
      break;
    case "s":
      messageHandler({ type: "setImage", value: "Peace" });
      break;
    case "d":
      messageHandler({ type: "setImage", value: "Y Logo" });
      break;
    case "f":
      messageHandler({ type: "setImage", value: "Fouriest" });
      break;
    case "1":
      messageHandler({ type: "setPeriod", value: 1 });
      break;
    case "2":
      messageHandler({ type: "setPeriod", value: 5 });
      break;
    case "3":
      messageHandler({ type: "setPeriod", value: 25 });
      break;
    case "4":
      messageHandler({ type: "setPeriod", value: 125 });
      break;
    case "z":
      messageHandler({ type: "setZoom", value: "0.5"});
      break;
    case "x":
      messageHandler({ type: "setZoom", value: "1"});
      break;
    case "c":
      messageHandler({ type: "setZoom", value: "5"});
      break;
    case "+":
      messageHandler({ type: "changeFourierAmt", value: "0.05" });
      break;
    case "-":
      messageHandler({ type: "changeFourierAmt", value: "-0.05" });
      break;
    case "[":
      messageHandler({ type: "changeFourierAmt", value: "-1" });
      break;
    case "]":
      messageHandler({ type: "changeFourierAmt", value: "1" });
      break;
    case "{":
      messageHandler({ type: "setFourierAmt", value: "0" });
      break;
    case "}":
      messageHandler({ type: "setFourierAmt", value: "1" });
      break;
    case "j":
      messageHandler({ type: "setFollowIndex", value: null });
      break;
    case "k":
      messageHandler({ type: "setFollowIndex", value: 4 });
      break;
    case "l":
      messageHandler({ type: "setFollowIndex", value: 10 });
      break;
    case " ":
      messageHandler({ type: "setImage", value: null });
      break;
    case "ArrowDown":
      messageHandler({ type: "fullscreen", value: null });
      break;
    case "ArrowRight":
      messageHandler({ type: "fullscreen", value: "right" });
      break;
    case "ArrowLeft":
      messageHandler({ type: "fullscreen", value: "left" });
      break;
    case "<":
      messageHandler({ type: "show", value: "start" });
      break;
    case ">":
      messageHandler({ type: "show", value: "stop" });
      break;
    default:
      console.warn("Non macro key: " + e.key);
  }
});
