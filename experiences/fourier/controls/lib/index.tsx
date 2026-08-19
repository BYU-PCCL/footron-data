/** @jsxImportSource @emotion/react */
import {
  Typography,
} from "@material-ui/core";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import "./index.css";
import AccordionSection from "./accordion-section";
import ZoomSection from "./zoom-section";
import AnimationSection from "./animation-section";
import TermEditor from "./term-editor";

const ControlsComponent = (): JSX.Element => {
  const [focused, setFocused] = useState<string | false>("animation");
  const [maxTerm, setMaxTerm] = useState<number>(512);
  const [currentTerm, setCurrentTerm] = useState<number | false>(false);
  const [termPhase, setTermPhase] = useState<number | false>(false);
  const [termAmplitude, setTermAmplitude] = useState<number | false>(false);
  const [termOriginalPhase, setTermOriginalPhase] = useState<number | false>(
    false
  );
  const [termOriginalAmplitude, setTermOriginalAmplitude] = useState<
    number | false
  >(false);
  
  
  const { sendMessage } = useMessaging((message: any) => {
    if (!message) return;
    const {
      maxTerm: newMaxTerm,
      term: newTerm,
      currentAmplitude: newCurrAmplitude,
      currentPhase: newCurrPhase,
      originalAmplitude: newOrigAmplitude,
      originalPhase: newOrigPhase,
    } = message;
    if (newMaxTerm) {
      setMaxTerm(newMaxTerm);
    }
    if (newTerm) {
      setCurrentTerm(newTerm);
    }
    if (newCurrAmplitude) {
      setTermAmplitude(newCurrAmplitude);
    }
    if (newCurrPhase) {
      setTermPhase(newCurrPhase);
    }
    if (newOrigAmplitude) {
      setTermOriginalAmplitude(newOrigAmplitude);
    }
    if (newOrigPhase) {
      setTermOriginalPhase(newOrigPhase);
    }
  });

  const mySendMessage = useCallback(
    async (message: any) => {
      await sendMessage(message);
    },
    [sendMessage]
  )

  const handleChange = (panel: string, newExpanded: boolean) => {
    setFocused(newExpanded ? panel : false);
  };

  return (
    <>
      <AccordionSection
        sectionID={"animation"}
        focused={focused}
        description={"Change the animation"}
        onChange={handleChange}
      >
        <AnimationSection maxTerm={maxTerm} sendMessage={mySendMessage} />
      </AccordionSection>
      <AccordionSection
        sectionID={"edit"}
        focused={focused}
        description={"Edit a term"}
        onChange={handleChange}
      >
        <TermEditor
          maxTerm={maxTerm}
          term={currentTerm}
          originalAmplitude={termOriginalAmplitude}
          originalPhase={termOriginalPhase}
          sendMessage={mySendMessage}
        />
      </AccordionSection>
      <AccordionSection
        sectionID={"zoom"}
        focused={focused}
        description={"Change the view"}
        onChange={handleChange}
      >
        <ZoomSection sendMessage={mySendMessage} />
      </AccordionSection>
      <AccordionSection
        sectionID={"info"}
        focused={focused}
        description={"Learn more"}
        onChange={handleChange}
      >
        <div className="text">
          <Typography>
            The Fourier transform is so useful accross so many disparate fields
            it is almost like magic. Luckily for us, this mathematical tool is
            far from sorcery; it&apos;s relatively easy to understand its basic
            principles and even easier to apply.
          </Typography>
          <Typography>
            Feel free to explore this demonstration and build a better intuition
            of how this beautiful mathematical tool works.
          </Typography>
          <Typography>
            Enjoy!
            <br />
            -Christian
          </Typography>
          <Typography variant="h5">Further resources</Typography>
          <Typography>
            This demonstration owes much of it&apos;s implimentation to{" "}
            <a href="https://www.jezzamon.com/fourier/index.html">
              Jez Swanson&apos;s amazing article
            </a>{" "}
            on the topic. Both his article and the{" "}
            <a href="https://www.youtube.com/watch?v=r6sGWTCMz2k">
              videos created by Grant Sanderson
            </a>{" "}
            (3blue1brown) are fantastic resources to anyone wanting to get a
            deeper understanding of how these circles learned to cooperate.
          </Typography>
        </div>
      </AccordionSection>
    </>
  );
};

export default ControlsComponent;
