/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { Button, Slider } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";

const ZoomSlider = (): JSX.Element => {
  const [currentValue, setValue] = useState<number>(1);
  const [helpUsed, setHelpUsed] = useState<boolean>(false);
  const [helpHidden, setHelpHidden] = useState<boolean>(false);
  const [helpRemoved, setHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging();

  const handleChange = (_: any, value: number | number[]) => {
    sendMessage({ type: "zoom", value: value });
    changeHelpText();
    if (Array.isArray(value)) return;
    setValue(value);
  };

  const sendToggleFollow = (event: any) => {
    sendMessage({ type: "toggleFollow" });
  };

  const sendToggleOriginal = (event: any) => {
    sendMessage({ type: "toggleOriginal" });
  };

  const sendReset = (event: any) => {
    sendMessage({ type: "resetZoom" });
  };

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
        value={currentValue}
        onChange={handleChange}
        min={1}
        max={10}
      />
      <div> </div>
      <div className="slider-container full-width centered">
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={sendToggleFollow}
        >
          Follow
        </Button>
        <Button
          size="small"
          color="primary"
          variant="contained"
          onClick={sendToggleOriginal}
        >
          {"Show Original"}
        </Button>
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={sendReset}
        >
          {"Reset"}
        </Button>
      </div>
    </div>
  );
};

export default ZoomSlider;
