import { Button, Slider } from "@material-ui/core";
import React, { useState } from "react";
import HelpText from "./help-text";
import TermCanvas from "./term-canvas";
import TermSlider from "./term-slider";

function displayPhase(value: number): string {
  return (value / Math.PI).toFixed(2) + "π radians";
}

/**
 * maps 0 - 1 to 0px - 570px
 */
function exponentialAmplitude(value: number): number {
  const MAX = 570; // 1 meter on screen
  return (MAX + 1) ** value - 1;
}

function displayAmplitude(value: number): string {
  const PIXELS_PER_METER = 570; // 1216px and 7' tall  1216px / 2.1336m = 569.93...
  const meters = value / PIXELS_PER_METER;

  if (meters > 1) return meters.toFixed(2) + " Meters";
  const centimeters = meters * 100;
  if (centimeters > 1) return centimeters.toFixed(2) + " cm";
  const milimeters = meters * 1000;
  if (milimeters > 1) return milimeters.toFixed(2) + " mm";
  const micrometers = meters * 1000000;
  return micrometers.toFixed(2) + " μm";
}

function displayTerm(term: number) {
  return "Term: " + term;
}

type TermEditorProps = {
  maxTerm: number;
  term: number | false;
  originalAmplitude: number | false;
  originalPhase: number | false;
  sendMessage: (message: any) => void;
};

const MAX_EDITABLE_TERM = 512;

const TermEditor = ({
  maxTerm,
  term,
  originalAmplitude,
  originalPhase,
  sendMessage,
}: TermEditorProps): JSX.Element => {
  const minTerm = 1;
  const [selectedTerm, setSelectedTerm] = useState<number | false>(false);
  const [phase, setPhase] = useState<number>(0);
  const [amplitude, setAmplitude] = useState<number>(0);
  const [phaseUsed, setPhaseUsed] = useState<boolean>(false);
  const [amplitudeUsed, setAmplitudeUsed] = useState<boolean>(false);

  const handleTermChange = (term: number) => {
    setSelectedTerm(term);
    sendMessage({ type: "queryTerm", value: term });
  };

  const handlePhaseChange = (
    _: React.ChangeEvent<unknown>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) return;
    setPhase(value);
    setPhaseUsed(true);
    sendMessage({ type: "editTerm", term: selectedTerm, phase: value });
  };

  const handleAmplitudeChange = (
    _: React.ChangeEvent<unknown>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) return;
    setAmplitude(value);
    setAmplitudeUsed(true);
    const exponentialValue = exponentialAmplitude(value);
    sendMessage({
      type: "editTerm",
      term: selectedTerm,
      amplitude: exponentialValue,
    });
  };

  const handleResetTerm = () => {
    sendMessage({type: "resetTerm", value: selectedTerm})
  }

  const handleResetAll = () => {
    sendMessage({type: "resetAll"})
  }

  return (
    <>
      <TermSlider
        initialHelp="Select a term to edit"
        subsequentHelp={displayTerm}
        minTerm={minTerm}
        maxTerm={Math.min(maxTerm, MAX_EDITABLE_TERM)}
        onChange={handleTermChange}
        defaultTerm={1}
      />
      <div className="horizontal-container full">
        <TermCanvas
          phase={phase}
          amplitude={exponentialAmplitude(amplitude)}
          initialPhase={originalPhase ? originalPhase : 0}
          initialAmplitude={originalAmplitude ? originalAmplitude : 0}
          disabled={term == false || term != selectedTerm}
        />
        <div
          className={
            term != selectedTerm
              ? "disabled vertical-container edit-controls"
              : "vertical-container edit-controls"
          }
        >
          <HelpText
            initialHelp="Change the phase"
            subsequentHelp={displayPhase(phase)}
            helpUsed={phaseUsed}
          />
          <Slider
            value={phase}
            min={-1 * Math.PI}
            max={1 * Math.PI}
            step={0.01}
            onChange={handlePhaseChange}
            disabled={term == false || term != selectedTerm}
          />
          <HelpText
            initialHelp="Change the amplitude"
            subsequentHelp={displayAmplitude(exponentialAmplitude(amplitude))}
            helpUsed={amplitudeUsed}
          />
          <Slider
            value={amplitude}
            min={0}
            max={1}
            step={0.005}
            onChange={handleAmplitudeChange}
            disabled={term == false || term != selectedTerm}
          />
          <div className="horizontal-container">
            <Button color="primary" variant="contained" onClick={handleResetTerm}>Reset Term</Button>
            <Button color="primary" variant="contained" onClick={handleResetAll}>Reset All</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermEditor;
