import { useEffect, useState } from "react";
import { Box } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";

import { Joystick, JoystickShape } from "./NonStandardDependencies.es.js";
import {
  joystickStyle,
  movementComponentStyle,
  helpMessageStyle,
} from "./style";

interface TabPanelProps {
  children?: React.ReactNode;
  move: (event: any) => void;
  stop: () => void;
}

function CustomJoystick(props: TabPanelProps) {
  const { children, move, stop, ...other } = props;
  return (
    <Joystick
      throttle={100}
      stickColor={"#001E4C"} // from footron style
      baseColor="#99c0fa" // 90% lightness
      move={move}
      stop={stop}
      controlPlaneShape={JoystickShape.Square}
    />
  );
}

export default function MovementControls() {
  const [helpUi, setHelpUi] = useState(true);
  const [controlOption, setControlOption] = useState("standard");
  const [stateMachine, setStateMachine] = useState([0, 0])
  const { sendMessage } = useMessaging();
  const stateMachinePattern = ['FORWARD', 'LEFT', 'BACKWARD', 'RIGHT', 'FORWARD', 'LEFT', 'BACKWARD', 'RIGHT']

  useEffect(() => {
    const timer = setTimeout(() => {
      setHelpUi(false);
    }, 5000); // Adjust time as needed

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, []);

  const toggleFlyMode = () => {
    if (controlOption == "standard") setControlOption("freefly");
    else setControlOption("standard");


  }

  const updateStateMachine = (machineIndex: number, direction: string | null) => {
    if (direction == stateMachinePattern[stateMachine[machineIndex] % stateMachinePattern.length]) {
      stateMachine[machineIndex]++;
    }
    else if (stateMachine[machineIndex] > 0 && direction != stateMachinePattern[(stateMachine[machineIndex] - 1) % stateMachinePattern.length]) {
      setStateMachine([0, 0]);
    }
    if (stateMachine.every((value: number) => value >= stateMachinePattern.length)) {
      toggleFlyMode()
      setStateMachine(stateMachine.fill(0));
    }
  }

  const leftStickMove = (event: IJoystickUpdateEvent) => {
    updateStateMachine(0, event.direction)
    if (helpUi) setHelpUi(false);
    if (controlOption == "standard") {
      sendMessage({ type: "move", yaw: event.x, pitch: event.y });
    } else {
      sendMessage({ type: "move", xAngleDv: event.x, yAngleDv: event.y })
    }
  };

  const rightStickMove = (event: IJoystickUpdateEvent) => {
    updateStateMachine(1, event.direction)
    if (helpUi) setHelpUi(false);
    if (controlOption == "standard") {
      let invertedZoom = null;
      if (event.y) invertedZoom = event.y * -1;
      sendMessage({ type: "move", roll: event.x, zoom: invertedZoom });
    } else {
      sendMessage({ type: "move", zAngleDv: event.x, velocity: event.y })
    }
  };

  const leftStickStop = () => {
    if (controlOption == "standard") {
      sendMessage({ type: "move", yaw: 0, pitch: 0 });
    } else {
      sendMessage({ type: "move", xAngleDv: 0, yAngleDv: 0 })
    }
  };

  const rightStickStop = () => {
    if (controlOption == "standard") {
      sendMessage({ type: "move", roll: 0, zoom: 0 });
    } else {
      sendMessage({ type: "move", zAngleDv: 0, velocity: 0 })
    }
  };

  return (
    <Box css={movementComponentStyle}>
      <Box css={joystickStyle}>
        <CustomJoystick move={leftStickMove} stop={leftStickStop} />
      </Box>
      <Box css={joystickStyle}>
      {controlOption == "standard" ? (<b css={helpMessageStyle(helpUi)}>Move the camera</b>) : (<b css={{color: "red"}}>Expert freefly mode</b>)}
      </Box>
      <Box css={joystickStyle}>
        <CustomJoystick move={rightStickMove} stop={rightStickStop} />
      </Box>
    </Box>
  );
}
