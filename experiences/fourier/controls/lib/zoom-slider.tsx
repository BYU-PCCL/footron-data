import React, { useState } from "react";
import { Button, Slider } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";

type ZoomSliderProps = {
  onChange: (num: number) => void;
  onToggleZoom: (useZoom: boolean) => void;
  onToggleOriginal: () => void;
};

export default function ZoomSlider({ onChange, onToggleZoom: onToggle, onToggleOriginal }: ZoomSliderProps) {
  const [currentValue, setValue] = useState<number>(60);
  const [helpUsed, setHelpUsed] = useState<boolean>(false);
  const [helpHidden, setHelpHidden] = useState<boolean>(false);
  const [helpRemoved, setHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging();

  const handleChange = (event: any, value: number | number[]) => {
    sendMessage({type: "zoom", value: value})
    changeHelpText();
    setValue(value as number)
  };

  const sendToggleFollow = (event: any) => {
    sendMessage({type: "toggleFollow"})
  }

  const sendToggleOriginal = (event: any) => {
    sendMessage({type: "toggleOriginal"})
  }

  const sendReset = (event: any) => {
    sendMessage({type: "resetZoom"})
  }

  const changeHelpText = () => {
    if (!helpUsed) {
      setHelpUsed(true);
      setHelpHidden(true);
      setTimeout(() => {
        setHelpRemoved(true);
      }, 1000);
    }
  };

  return (
    <div className="controls-container full-width">
      <div className="slider-description hidable-children centered">
        <div
          className={
            "description-item" +
            (helpHidden != helpRemoved ? " hidden-item " : "")
          }
        >
          {helpRemoved
            ? Math.round(currentValue * 10) / 10 + "x zoom"
            : "Adjust zoom"}
        </div>
      </div>
      <Slider
        defaultValue={60}
        onChange={handleChange}
        min={1}
        max={10}
        step={0.1}
      />
      <div>{" "}</div>
      <div className="slider-container full-width centered">
        <Button color="primary" variant="contained" onClick={sendToggleFollow}>
          Toggle Follow
        </Button>
        <Button color="primary" variant="contained" onClick={sendToggleOriginal}>
          {"Toggle Original"}
        </Button>
        <Button color="primary" variant="contained" onClick={sendReset}>
          {"Reset"}
        </Button>
      </div>
    </div>
  );
}
