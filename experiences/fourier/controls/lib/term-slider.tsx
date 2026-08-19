import React, { ChangeEvent, useState } from "react";
import { IconButton, Slider, SvgIcon } from "@material-ui/core";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@material-ui/icons";
import HelpText from "./help-text";

type TermSliderProps = {
  initialHelp: string;
  subsequentHelp: (terms: number) => string;
  minTerm: number;
  maxTerm: number;
  onChange: (value: number) => void;
  defaultTerm?: number;
};

function clamp(min: number, val: number, max: number): number {
  val = Math.min(max, val);
  val = Math.max(min, val);
  return val;
}

function termFromVal(val: number) {
  return Math.round(2 ** val);
}

function bLog(val: number) {
  return Math.log2(val);
}

const TermSlider = ({
  initialHelp,
  subsequentHelp,
  minTerm,
  maxTerm,
  onChange,
  defaultTerm,
}: TermSliderProps): JSX.Element => {
  const sliderMin = minTerm <= 0 ? 0 : bLog(minTerm);
  const sliderMax = minTerm <= 0 ? 0 : bLog(maxTerm);

  const [sliderVal, setSliderVal] = useState(
    clamp(sliderMin, bLog(defaultTerm ? defaultTerm : 0), sliderMax)
  );

  const handleChange = (_: ChangeEvent<unknown>, newVal: number | number[]) => {
    if (Array.isArray(newVal)) return;
    update(newVal);
  };

  const update = (val: number) => {
    val = clamp(sliderMin, val, sliderMax);
    setSliderVal(val);
    onChange(termFromVal(val));
  };

  // These change the slider value directly and are unintuitive because the slider uses a log scale
  const half = () => {
    const val = sliderVal - 1;
    update(val);
  };

  const down = () => {
    let val = termFromVal(sliderVal) - 1;
    val = bLog(clamp(minTerm, val, maxTerm));
    update(val);
  };

  const up = () => {
    let val = termFromVal(sliderVal) + 1;
    val = bLog(clamp(minTerm, val, maxTerm));
    update(val);
  };

  const double = () => {
    const val = sliderVal + 1;
    update(val);
  };

  return (
    <>
      <HelpText
        initialHelp={initialHelp}
        subsequentHelp={subsequentHelp(termFromVal(sliderVal))}
        helpUsed={sliderVal != sliderMax}
      />
      <Slider
        value={sliderVal}
        onChange={handleChange}
        min={sliderMin}
        max={sliderMax}
        step={0.01}
      />
      <div className="horizontal-container">
        <IconButton onClick={half}>
          <SvgIcon>
            <svg viewBox="0 0 24 24">
              <path d="M17.59 18 19 16.59 14.42 12 19 7.41 17.59 6l-6 6z"></path>
              <path d="m11 18 1.41-1.41L7.83 12l4.58-4.59L11 6l-6 6z"></path>
            </svg>
          </SvgIcon>
        </IconButton>
        <IconButton onClick={down}>
          <KeyboardArrowLeft />
        </IconButton>
        <IconButton onClick={up}>
          <KeyboardArrowRight />
        </IconButton>
        <IconButton onClick={double}>
          <SvgIcon>
            <svg viewBox="0 0 24 24">
              <path d="M6.41 6 5 7.41 9.58 12 5 16.59 6.41 18l6-6z"></path>
              <path d="m13 6-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z"></path>
            </svg>
          </SvgIcon>
        </IconButton>
      </div>
    </>
  );
};

export default TermSlider;
