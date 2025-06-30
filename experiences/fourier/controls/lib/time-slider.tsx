/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { Slider } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";

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

const TimeSlider = (): JSX.Element => {
  const [period, setPeriod] = useState<number>(60);
  const [helpUsed, setHelpUsed] = useState<boolean>(false);
  const [helpHidden, setHelpHidden] = useState<boolean>(false);
  const [helpRemoved, setHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging();

  const handleChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) return;
    setPeriod(value);
    sendPeriodUpdate(value);
    changeHelpText();
  };

  const sendPeriodUpdate = (period: number) => {
    sendMessage({ type: "setPeriod", value: period });
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
            ? formatTime(period)
            : "Change the period of the animation"}
        </div>
      </div>
      <Slider
        value={period}
        onChange={handleChange}
        min={3}
        max={1800}
        step={0.1}
      />
    </div>
  );
};

export default TimeSlider;
