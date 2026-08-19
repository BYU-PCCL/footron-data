import React, { ChangeEvent, useState } from "react"
import { Button, Slider } from "@material-ui/core";
import HelpText from "./help-text"

type ZoomSectionProps = {
    sendMessage: (message: any) => void;
}

const ZoomSection = ({sendMessage}: ZoomSectionProps): JSX.Element => {
    const [zoom, setZoom] = useState<number>(1);
    const zoomValue = "Zoom: " + zoom.toFixed(1) + "x"

    const handleZoomChange = (_: ChangeEvent<unknown>, newVal: number | number[]) => {
        if (Array.isArray(newVal)) return;
        setZoom(newVal);
        sendMessage({type: "setZoom", value: newVal})
    }

    const handleFollow = () => {
        sendMessage({type: "toggleFollow"})
    }
    const handleOriginal = () => {
        sendMessage({type: "toggleOriginal"})
    }
    const handleReset = () => {
        sendMessage({type: "resetZoom"})
    }


    return (
        <>
        <HelpText initialHelp="Change the zoom" subsequentHelp={zoomValue} helpUsed={zoom != 1}></HelpText>
        <Slider value={zoom} min={1} max={10} step={0.1} onChange={handleZoomChange}></Slider>
        <div className="horizontal-container">
        <Button color="primary" variant="contained" onClick={handleFollow}>Toggle Follow</Button>
        <Button color="primary" variant="contained" onClick={handleOriginal}>Toggle Original</Button>
        <Button color="primary" variant="contained" onClick={handleReset}>Reset</Button>
        </div>
        </>
    )
}

export default ZoomSection