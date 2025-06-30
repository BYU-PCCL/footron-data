/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { useMessaging } from "@footron/controls-client";
import "./index.css";
import TermEditor from "./term-editor";
import ImageSelector from "./image-selector";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Slider,
} from "@material-ui/core";
import TermSlider from "./term-slider";
import ZoomSlider from "./zoom-slider";
import { ExpandMore } from "@material-ui/icons";

type AccordionProps = {
  title: string;
  sectionKey: string;
  children: JSX.Element;
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

const ControlsComponent = (): JSX.Element => {
  const [expanded, setExpanded] = useState<string>("animation");
  const [period, setPeriod] = useState<number>(60);
  const [periodHelpUsed, setPeriodHelpUsed] = useState<boolean>(false);
  const [periodHelpHidden, setPeriodHelpHidden] = useState<boolean>(false);
  const [periodHelpRemoved, setPeriodHelpRemoved] = useState<boolean>(false);

  const { sendMessage } = useMessaging();
  const toggleBounce = () => {
    sendMessage({ type: "toggleBounce" });
  };
  const handlePeriodChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) return;
    setPeriod(value);
    sendMessage({ type: "setPeriod", value: value });
    changeHelpText();
  };

  const changeHelpText = () => {
    if (!periodHelpUsed) {
      setPeriodHelpUsed(true);
      setPeriodHelpHidden(true);
      setTimeout(() => {
        setPeriodHelpRemoved(true);
      }, 1000);
    }
  };

  const handleExpand = (newExpanded: string) => {
    expanded === newExpanded ? setExpanded("none") : setExpanded(newExpanded);
  };

  const AccordionSection = ({
    title,
    sectionKey,
    children,
  }: AccordionProps) => {
    return (
      <Accordion
        expanded={expanded === sectionKey}
        onChange={() => handleExpand(sectionKey)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>{title}</AccordionSummary>
        <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
    );
  };

  return (
    <div>
      {/* Automatically querying would be better but this works for now */}
      <div className="full">
        {/* TermSlider help text may need set here if the internal state isn`&apos;`t preserved */}
        <AccordionSection title="Change the animation" sectionKey="animation">
          <div className="full-width">
            <TermSlider />
            <ImageSelector />
            <div className="vert-container full-width">
              <div className="slider-description hidable-children centered">
                <div
                  className={
                    "description-item" +
                    (periodHelpHidden != periodHelpRemoved
                      ? " hidden-item "
                      : "")
                  }
                >
                  {periodHelpRemoved
                    ? formatTime(period)
                    : "Change the period of the animation"}
                </div>
              </div>
              <Slider
                value={period}
                onChange={handlePeriodChange}
                min={3}
                max={1800}
              />
            </div>
            <Button onClick={toggleBounce}>Toggle Bounce</Button>
          </div>
        </AccordionSection>
        <AccordionSection title="Edit a term" sectionKey="term">
          <TermEditor />
        </AccordionSection>
        <AccordionSection title="Zoom in" sectionKey="zoom">
          <ZoomSlider />
        </AccordionSection>
        <AccordionSection title="Learn More" sectionKey="learn">
          <div className="vert-container">
            <p>
              The Fourier transform is so useful accross so many disparate
              fields it is almost like magic. Luckily for us, this mathematical
              tool is far from sorcery; it`&apos;`s relatively easy to
              understand its basic principles and even easier to apply.
            </p>
            <p>
              Feel free to explore this demonstration and build a better
              intuition of how this beautiful mathematical tool works.
            </p>
            <p>Enjoy!</p>
            <p>-Christian</p>
            <h3>Further resources</h3>
            <p>
              This demonstration owes much of it`&apos;`s implimentation to{" "}
              <a href="https://www.jezzamon.com/fourier/index.html">
                Jez Swanson`&apos;`s amazing article
              </a>{" "}
              on the topic. Both his article and the{" "}
              <a href="https://www.youtube.com/watch?v=r6sGWTCMz2k">
                videos created by Grant Sanderson
              </a>{" "}
              (or 3blue1brown) are fantastic resources to anyone wanting to get
              a deeper understanding of how these circles learned to cooperate.
            </p>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};

export default ControlsComponent;
