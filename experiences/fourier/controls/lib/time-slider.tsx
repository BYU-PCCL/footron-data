import React, { useState } from "react";
import { Slider } from "@material-ui/core";
import HelpText from "./help-text";

function exponentialTime(val: number): number {
  return 3 * 600 ** val;
}

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

type TimeSliderProps = {
  sendMessage: (message: any) => void;
}

const TimeSlider = ({sendMessage}: TimeSliderProps): JSX.Element => {
    const startValue = 0.47;
  const [sliderVal, setSliderVal] = useState(startValue);

  const handleChange = (_: React.ChangeEvent<unknown>, value: number | number[]) => {
    if (Array.isArray(value)) return;
    setSliderVal(value);
    console.log("send 'setPeriod': ", exponentialTime(value));
    sendMessage({type: "setPeriod", value: exponentialTime(value)})
  }
  return (
    <>
      <HelpText
        initialHelp="Change the period of the animation"
        subsequentHelp={"Period: " + formatTime(exponentialTime(sliderVal))}
        helpUsed={sliderVal != startValue}
      />
      <Slider value={sliderVal} min={0} max={1} step={0.005} onChange={handleChange}/>
    </>
  );
};

export default TimeSlider;
