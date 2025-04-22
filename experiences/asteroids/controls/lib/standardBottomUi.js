import { Box } from "@material-ui/core";
import { standardBottomUiStyle } from "./style";
import MovementControls from "./Movement";
import TimeSlider from "./time";

export default function StandardBottomUi({ children }) {
  return (
    <Box css={standardBottomUiStyle}>
      {children}
      <MovementControls />
      <TimeSlider />
    </Box>
  );
}
