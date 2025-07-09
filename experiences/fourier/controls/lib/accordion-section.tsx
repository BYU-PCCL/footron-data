/** @jsxImportSource @emotion/react */
import React, { ChangeEvent, PropsWithChildren } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@material-ui/core";
import { ArrowDownward, ArrowDropDown } from "@material-ui/icons";

type AccordionSectionProps = {
  sectionID: string;
  focused: string | false;
  description: string;
  onChange: (section: string, newExpanded: boolean) => void
};

const AccordionSection = ({
  sectionID,
  focused,
  description,
  onChange,
  children,
}: PropsWithChildren<AccordionSectionProps>): JSX.Element => {
  const handleChange = (_: ChangeEvent<{}>, newExpanded: boolean) => {
    onChange(sectionID, newExpanded)
  }
  return (
    <Accordion expanded={sectionID == focused} onChange={handleChange}>
      <AccordionSummary expandIcon={<ArrowDropDown/>}>{description}</AccordionSummary>
      <AccordionDetails className="vertical-container" >{children}</AccordionDetails>
    </Accordion>
  );
};

export default AccordionSection;
