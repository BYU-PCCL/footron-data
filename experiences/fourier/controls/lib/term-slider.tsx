import { useState, JSX } from "react";
import { IconButton, Slider, SvgIcon } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";
import {
  ChevronLeft,
  ChevronRight,
  KeyboardArrowLeft,
  SkipPrevious,
} from "@material-ui/icons";

type TermSliderProps = {
  onChange: (num: number) => void;
};

const TermSlider = ({ onChange }: TermSliderProps): JSX.Element => {
  const [maxNumTerms, setMaxNumTerms] = useState<number>(-1);
  const [numTermsPercentage, setNumTermsPercentage] = useState<number>(1);
  const [helpUsed, setHelpUsed] = useState<boolean>(false);
  const [helpHidden, setHelpHidden] = useState<boolean>(false);
  const [helpRemoved, setHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging((message: any) => {
    if (message.maxNumTerms) {
      setMaxNumTerms(message.maxNumTerms);
    }
    if (message.currentNumTerms) {
      setNumTermsPercentage(message.currentNumTerms / maxNumTerms);
    }
  });

  const handleChange = (event: any, value: number | number[]) => {
    if (maxNumTerms === -1) {
      sendMessage({ type: "termInfo" });
      changeHelpText();
      return;
    }
    value = value as number;
    value = Math.max(value, 0);
    value = Math.min(value, 1);
    setNumTermsPercentage(value);
    onChange(value);
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
    <div className="full-width">
      <div className="vert-container full">
        <div className="slider-description hidable-children centered">
          <div
            className={
              "description-item" +
              (helpHidden != helpRemoved ? " hidden-item " : "")
            }
          >
            {helpRemoved
              ? Math.round(numTermsPercentage * maxNumTerms) + " / " + maxNumTerms + " terms"
              : "Choose how many terms are used to display the image"}
          </div>
        </div>
        <div className="slider-container">
          <Slider
            value={numTermsPercentage}
            onChange={handleChange}
            min={0}
            max={1}
            step={0.005}
          />
        </div>
        <div className="slider-container centered">
          <IconButton
            disabled={numTermsPercentage <= 0}
            onClick={() => handleChange(null, numTermsPercentage / 2)}
          >
            <SvgIcon>
              <svg viewBox="0 0 24 24">
                <path d="M17.59 18 19 16.59 14.42 12 19 7.41 17.59 6l-6 6z"></path>
                <path d="m11 18 1.41-1.41L7.83 12l4.58-4.59L11 6l-6 6z"></path>
              </svg>
            </SvgIcon>
          </IconButton>
          <IconButton
            disabled={numTermsPercentage <= 0}
            onClick={() => handleChange(null, (numTermsPercentage * maxNumTerms - 1) / maxNumTerms)}
          >
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton
            disabled={numTermsPercentage >= 1}
            onClick={() => handleChange(null, (numTermsPercentage * maxNumTerms + 1) / maxNumTerms)}
          >
            <ChevronRight />
          </IconButton>
          <IconButton
            disabled={numTermsPercentage >= 1}
            onClick={() => handleChange(null, numTermsPercentage * 2)}
          >
            <SvgIcon>
              <svg viewBox="0 0 24 24">
                <path d="M6.41 6 5 7.41 9.58 12 5 16.59 6.41 18l6-6z"></path>
                <path d="m13 6-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z"></path>
              </svg>
            </SvgIcon>
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default TermSlider;
