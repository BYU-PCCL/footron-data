import { Box } from "@material-ui/core";
import { standardBottomUiStyle } from "./style";
import MovementControls from "./Movement";
import TimeSlider from "./time";

interface Props {
  children?: React.ReactNode;
}

export default function StandardBottomUi({ children }: Props) {
  return (
    <Box css={standardBottomUiStyle}>
      {children}
      <MovementControls />
      <TimeSlider />
    </Box>
  );
}
