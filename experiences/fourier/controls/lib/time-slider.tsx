/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { Slider } from "@material-ui/core";

type TimeSliderProps = {
  onChange: (num: number) => void;
};

function formatTime(seconds: number) {
  const units = [{ label: "minute", value: 60 }];

  let timeStr = "",
    secondsRemaining = true;

  for (const unit of units) {
    const unitValue = Math.floor(seconds / unit.value);
    if (unitValue > 0) {
      timeStr += `${unitValue} ${unit.label}${unitValue > 1 ? "s" : " "} `;
      seconds -= unitValue * unit.value;
      secondsRemaining = seconds > 0;
      break;
    }
  }
  timeStr += secondsRemaining ? seconds.toFixed(1) + " seconds" : "";
  return timeStr.trim();
}

const TimeSlider = ({ onChange }: TimeSliderProps): JSX.Element => {
  const [currentValue, setValue] = useState<number>(60);
  const [helpUsed, setHelpUsed] = useState<boolean>(false);
  const [helpHidden, setHelpHidden] = useState<boolean>(false);
  const [helpRemoved, setHelpRemoved] = useState<boolean>(false);

  const handleChange = (event: any, value: number | number[]) => {
    setValue(value as number);
    onChange(value as number);
    changeHelpText();
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
    <div className="vert-container full-width">
      <div className="slider-description hidable-children centered">
        <div
          className={
            "description-item" +
            (helpHidden != helpRemoved ? " hidden-item " : "")
          }
        >
          {helpRemoved
            ? formatTime(currentValue)
            : "Change the period of the animation"}
        </div>
      </div>
      <Slider
        defaultValue={60}
        onChange={handleChange}
        min={3}
        max={1800}
        step={0.1}
      />
    </div>
  );
};

export default TimeSlider;
