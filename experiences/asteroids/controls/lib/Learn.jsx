import React, { useCallback, useState } from "react";
import { Box, Button, Fab, IconButton } from "@material-ui/core";
import { Replay, SkipPrevious, Close } from "@material-ui/icons";
import { useMessaging } from "@footron/controls-client";

import StandardBottomUi from "./standardBottomUi";
import {
  fullUIStyle,
  largeIconStyle,
  storyBoxStyle,
  thinWidgetStyle,
  topUI
} from "./style";

const dummyText = "Loading";

export default function Learn() {
  const [slideshowPlaying, setSlideShowPlaying] = useState(false);
  const [slideshowTitle, setSlideShowTitle] = useState("No title provided");
  const [progressString, setProgressString] = useState(`[0 of 0]`);
  const [showReplay, setShowReplay] = useState(false);
  const [prevSlide, setPrevSlide] = useState(false);
  const [nextSlide, setNextSlide] = useState(false);
  const [infoText, setInfoText] = useState(dummyText);
  const { sendMessage } = useMessaging((content) => {
    if (content.type != "slideInfo") return;
    content = content.slideInfo;
    console.log("Incoming info: ", content);
    if (content.title != null) setSlideShowTitle(content.title);
    if (content.storyLength != null && content.index != null)
      setProgressString(`[${content.index} of ${content.storyLength}]`);
    if (content == undefined) content = { info: "Error loading info" };
    if (content.replay != null) setShowReplay(true);
    else setShowReplay(false);
    setInfoText(content.info);
    setPrevSlide(!content.prevSlideButton); // not disabled
    setNextSlide(!content.nextSlideButton);
    console.log(prevSlide, nextSlide);
  });
  const getInfoText = useCallback(
    async (value) => {
      await sendMessage({ type: "learn", value: value });
    },
    [sendMessage]
  );

  const prev = async () => {
    getInfoText("previous");
  };

  const next = async () => {
    getInfoText("next");
  };

  const first = async () => {
    getInfoText("first");
  };

  const replay = () => {
    sendMessage({ type: "learn", value: "replay" });
  };

  const close = async () => {
    setSlideShowPlaying(false);
    sendMessage({ type: "context", value: "home" });
  };

  const startShow = async (value) => {
    setSlideShowPlaying(true);
    getInfoText(value);
  };

  return (
    <Box css={fullUIStyle}>
      {slideshowPlaying ? (
        <Box css={fullUIStyle}>
          <Box css={topUI}>
            <Fab onClick={close} size="small" color="primary">
              <Close />
            </Fab>
            <Box>
              <h2>{slideshowTitle}</h2>
              <h6>{progressString}</h6>
              <div dangerouslySetInnerHTML={{ __html: infoText }}></div>
            </Box>
          </Box>
          <StandardBottomUi>
            <Box css={thinWidgetStyle}>
              {nextSlide && (
                <IconButton color="primary" onClick={first}>
                  <SkipPrevious css={largeIconStyle} />
                </IconButton>
              )}
              <Button
                color="primary"
                variant="contained"
                disabled={prevSlide}
                size="large"
                onClick={prev}
              >
                <strong>{"<"}</strong>
              </Button>
              <Button
                color="primary"
                variant="contained"
                disabled={nextSlide}
                size="large"
                onClick={next}
              >
                <strong>{">"}</strong>
              </Button>
              {showReplay && (
                <IconButton color="primary"
                  onClick={replay}
                >
                  <Replay />
                </IconButton>
              )}
            </Box>
          </StandardBottomUi>
        </Box>
      ) : (
        <Box css={topUI}>
          <h3>Deep dives</h3>
          <p>Take a deeper dive into Asteroids with our interactive stories</p>
          <Box css={storyBoxStyle}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => startShow("asteroids-101")}
            >
              Asteroids 101
            </Button>
            <p>What are asteroids?</p>
            <p>What does this experience show me?</p>
          </Box>
          <Box css={storyBoxStyle}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => startShow("close-approaches")}
            >
              Close Approaches
            </Button>
            <p>What is a close approach?</p>
            <p>Are we in danger of impact?</p>
          </Box>
          <Box css={storyBoxStyle}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => startShow("missions")}
            >
              Missions
            </Button>
            <p>Can we visit an asteroid</p>
            <p>What can missions achieve?</p>
          </Box>
        </Box>
      )}
    </Box>
  );
}
