import { Typography } from "@material-ui/core";
import { useState } from "react";

type HelpTextTerms = {
  initialHelp: string;
  subsequentHelp: string;
  helpUsed: boolean;
};

/**
 * Fades from initial text to subsequent text after helpUsed is changed to `true`.
 * The state gets locked and does not change back.
 * @param initialHelp {string} the first helpMessage
 * @param subsequentHelp {string} the message after help is used
 * @param helpUsed {boolean} Flag to move to the secondary message
 */
const HelpText = ({
  initialHelp,
  subsequentHelp,
  helpUsed,
}: HelpTextTerms): JSX.Element => {
  const [helpLocked, setHelpLocked] = useState<boolean>(false);
  const [helpChanged, setHelpChanged] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);

  const handleChange = () => {
    setHidden(true);
    setHelpLocked(true);

    setTimeout(() => {
      setHelpChanged(true);
      setHidden(false);
    }, 300);
  };

  if (!helpLocked && helpUsed && !helpChanged) handleChange();

  return (
    <Typography className={hidden ? "hidable hidden" : "hidable"}>
      {helpChanged ? subsequentHelp : initialHelp}
    </Typography>
  );
};

export default HelpText;
