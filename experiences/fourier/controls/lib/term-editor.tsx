/** @jsxImportSource @emotion/react */
import React, { useState, useCallback } from "react";
import { IconButton, Slider } from "@material-ui/core";
import { ChevronLeft, ChevronRight } from "@material-ui/icons";
import TermCanvas from "./term-canvas";
import { useMessaging } from "@footron/controls-client";

export type TermChange = {
  term: number;
  phase: number;
  amplitude: number;
};

type TermProps = {
  queryTermResult: undefined;
  phase: number;
  amplitude: number;
  maxTerm: number;
};

type TermSliderProps = {
  onChange: (defaults: TermChange) => void;
  maxTerm: number;
};

const helpUiDelay = 1000;

function getAmplitude(percent: number) {
  return 500 * percent ** 4;
}

function formattedAmplitude(amplitude: number) {
  amplitude = getAmplitude(amplitude);
  return amplitude < 1e-14
    ? 0
    : amplitude < 0.01
    ? amplitude.toExponential(2)
    : amplitude.toFixed(2);
}

const TermEditor = ({ onChange }: TermSliderProps): React.ReactNode => {
  const [maxTerm, setMaxTerm] = useState<number>(1);
  const [term, setTerm] = useState<number>(1);
  const [phase, setPhase] = useState<number>(0);
  const [amplitude, setAmplitude] = useState<number>(0);
  const [haveLiveValues, setHaveLiveValues] = useState<boolean>(false);
  const [queryFailed, setQueryFailed] = useState<boolean>(false);
  const [PAHelpUsed, setPAHelpUsed] = useState<boolean>(false);
  const [PAHelpHidden, setPAHelpHidden] = useState<boolean>(false);
  const [PAHelpRemoved, setPAHelpRemoved] = useState<boolean>(false);
  const [termHelpUsed, setTermHelpUsed] = useState<boolean>(false);
  const [termHelpHidden, setTermHelpHidden] = useState<boolean>(false);
  const [termHelpRemoved, setTermHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging<TermProps>((message) => {
    if (!haveLiveValues && message.queryTermResult) {
      setPhase(message.phase);
      const newAmplitude = (message.amplitude / 400) ** 0.25;
      setAmplitude(newAmplitude);
      setMaxTerm(message.maxTerm);
      setHaveLiveValues(true);
    }
  });

  const queryTerm = useCallback(
    async (term: number) => {
      await sendMessage({ type: "queryTerm", value: term });
    },
    [sendMessage]
  );

  function handleUpdate() {
    onChange({ term: term, phase: phase, amplitude: getAmplitude(amplitude) });
  }

  async function handleTermChange(event: any, value: number | number[]) {
    setTerm(value as number);
    setHaveLiveValues(false);
    changeTermHelpText();
    const getTermInfoTimer = setTimeout(() => {
      setHaveLiveValues(false);
      setQueryFailed(true);
      return;
    });
    await queryTerm(term)
      .then(() => {
        clearTimeout(getTermInfoTimer);
        setQueryFailed(false);
      })
      .catch(() => {
        clearTimeout(getTermInfoTimer);
        setHaveLiveValues(false);
        setQueryFailed(true);
      });
  }

  const handlePhaseChange = (event: any, value: number | number[]) => {
    setPhase(value as number);
    changePAHelpText();
    handleUpdate();
  };
  const handleAmplitudeChange = (event: any, value: number | number[]) => {
    value = value as number;
    setAmplitude(value as number);
    changePAHelpText();
    handleUpdate();
  };

  const changePAHelpText = () => {
    if (!PAHelpUsed) {
      setPAHelpUsed(true);
      setPAHelpHidden(true);
      setTimeout(() => {
        setPAHelpRemoved(true);
      }, helpUiDelay);
    }
  };
  const changeTermHelpText = () => {
    if (!termHelpUsed) {
      setTermHelpUsed(true);
      setTermHelpHidden(true);
      setTimeout(() => {
        setTermHelpRemoved(true);
      }, helpUiDelay);
    }
  };

  return (
    <div className="term-container full-width">
      <div className="slider-description hidable-children centered">
        <div
          className={
            "description-item" +
            (termHelpHidden != termHelpRemoved ? " hidden-item " : "")
          }
        >
          {termHelpRemoved ? "Term: " + term : "Select which term to change"}
        </div>
      </div>
      <div className="slider-container">
        <IconButton
          disabled={term <= 1}
          onClick={() => handleTermChange(null, term - 1)}
        >
          <ChevronLeft />
        </IconButton>
        <Slider
          value={Math.min(term, maxTerm)}
          min={1}
          max={Math.min(maxTerm, 512)}
          onChange={handleTermChange}
        />
        <IconButton
          disabled={term >= maxTerm}
          onClick={() => handleTermChange(null, term + 1)}
        >
          <ChevronRight />
        </IconButton>
      </div>
      <div className="slider-container">
        <div className="canvas-container">
          {queryFailed ? (
            <div>{"Couldn't get live data, please try again"}</div>
          ) : haveLiveValues ? (
            <div className="full">
              <TermCanvas
                phase={phase}
                amplitude={getAmplitude(amplitude)}
                maxAmplitude={100}
              />
            </div>
          ) : (
            <div>{"Loading data..."}</div>
          )}
        </div>
        <div className="vert-container p-a-container">
          <div className="vert-item">
            <div className="slider-description hidable-children">
              <div
                className={
                  "description-item" +
                  (PAHelpHidden != PAHelpRemoved ? " hidden-item " : "")
                }
              >
                {PAHelpRemoved
                  ? "Phase: " + (phase / Math.PI).toFixed(2) + " π"
                  : "Change the phase"}
              </div>
            </div>
            <Slider
              disabled={!haveLiveValues}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              value={phase}
              onChange={handlePhaseChange}
            />
          </div>
          <div className="vert-item">
            {/* Amplitude */}
            <div className="slider-description hidable-children">
              <div
                className={
                  "description-item" +
                  (PAHelpHidden != PAHelpRemoved ? " hidden-item " : "")
                }
              >
                {PAHelpRemoved
                  ? "Amplitude: " + formattedAmplitude(amplitude)
                  : "Change the amplitude"}
              </div>
            </div>
            <Slider
              disabled={!haveLiveValues}
              min={0}
              max={1}
              step={0.01}
              value={amplitude}
              onChange={handleAmplitudeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermEditor;
