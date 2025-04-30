import React from 'react';
import { useMessaging } from "@footron/controls-client";
import { Box, Button } from "@material-ui/core";
import { thinWidgetStyle, topUI, fullUIStyle } from "./style";
import StandardBottomUi from "./standardBottomUi";

export default function AsteroidWatch() {
  const { sendMessage } = useMessaging();

  const prev = async () => {
    sendMessage({ type: "watch", value: "previous" });
  };

  const next = async () => {
    sendMessage({ type: "watch", value: "next" });
  };

  return (
    <div css={fullUIStyle}>
      <Box css={topUI}>
        <h3>Select the next close approach</h3>
      </Box>
      <StandardBottomUi>
        <Box css={thinWidgetStyle}>
          <Button
            color="primary"
            variant="contained"
            size="large"
            onClick={prev}
          >
            <strong>{"<"}</strong>
          </Button>
          <Button
            color="primary"
            variant="contained"
            size="large"
            onClick={next}
          >
            <strong>{">"}</strong>
          </Button>
        </Box>
      </StandardBottomUi>
    </div>
  );
}
