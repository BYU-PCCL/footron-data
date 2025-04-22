import React from "react";
import { Box } from "@material-ui/core";
import { standardBottomUiStyle } from "./style";
import MovementControls from "./Movement";
import TimeSlider from "./time";
import PropTypes from "prop-types";

export default function StandardBottomUi(props) {
  const { children } = props;
  return (
    <Box css={standardBottomUiStyle}>
      {children}
      <MovementControls />
      <TimeSlider />
    </Box>
  );
}

StandardBottomUi.propTypes = {
  children: PropTypes.node
}
