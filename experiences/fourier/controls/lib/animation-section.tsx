import React from "react";
import { Button } from "@material-ui/core";
import ImageSelector from "./image-selector";
import TermSlider from "./term-slider";
import TimeSlider from "./time-slider";

type AnimationSectionProps = {
  maxTerm: number | false;
  sendMessage: (message: any) => void;
};

const AnimationSection = ({
  maxTerm,
  sendMessage,
}: AnimationSectionProps): JSX.Element => {
  const helpText = (term: number): string => {
    if (term == 1) {
      return "1 term. The first term is the stationary central term";
    }
    return term + " terms";
  };

  const handleChange = (term: number) => {
    sendMessage({ type: "setNumTerms", value: term });
  };
  
  const toggleBounce = () => {
    sendMessage({ type: "toggleBounce" });
  }

  return (
    <>
      <TermSlider
        initialHelp="Choose how many terms are displayed"
        subsequentHelp={helpText}
        minTerm={1}
        maxTerm={maxTerm == false ? 512 : maxTerm}
        onChange={handleChange}
      />
      <ImageSelector sendMessage={sendMessage} />
      <TimeSlider sendMessage={sendMessage}/>
      <Button color="primary" variant="contained" onClick={toggleBounce}>Toggle Bounce</Button>
    </>
  );
};

export default AnimationSection;
