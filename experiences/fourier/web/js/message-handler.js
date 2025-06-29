import { setImage, query, setPeriod, setFourierAmt, changeFourierAmt, setZoom, setFollowIndex, fullscreen, startShow, stopShow, queryTerm, maxTerm, termInfo, editTerm, toggleFollow, toggleOriginal } from "./main.js";

export async function messageHandler(message) {
  console.log(message, message.type);
  stopShow()
  switch (message.type) {
    case "zoom":
      setZoom(message.value)
      break
    case "toggleFollow":
      toggleFollow();
      break;
    case "toggleOriginal":
      toggleOriginal();
      break;
    case "resetZoom":
      setZoom(1);
      fullscreen('left')
      setFollowIndex(null)
      break;
    case "setImage":
      client.sendMessage({ maxTerm: setImage(message.value, false, true) });
      break;
    case "maxTerm":
      client.sendMessage({ maxTerm: maxTerm() })
      break;
    case "termInfo":
      client.sendMessage(termInfo())
      break;
    case "queryTerm":
      client.sendMessage(queryTerm(message.value))
      break;
    case "setNumTerms":
      setFourierAmt(message.value)
      client.sendMessage(termInfo())
      break;
    case "setPeriod":
      setPeriod(message.value)
      break;
    case "setZoom":
      setZoom(message.value, message.x, message.y);
      break;
    case "editTerm":
      editTerm(message.term, message.phase, message.amplitude)
      break;
    case "changeFourierAmt":
      changeFourierAmt(message.value)
      break;
    case "query":
      query();
      break;
    case "setFollowIndex":
      setFollowIndex(message.value);
      break;
    case "fullscreen":
      fullscreen(message.value);
      break;
    case "show":
      if (message.value == "start") {
        startShow()
      } else {
        stopShow()
      }
      break;
    default:
      throw "Can't understand message: " + message;
  }
}

const client = new FootronMessaging.Messaging();
client.mount();
client.addMessageListener(messageHandler);