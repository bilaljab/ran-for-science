// Re-exported as a separate module so MotionProvider can dynamic-import it,
// putting the framer-motion feature bundle in its own async chunk instead of
// the synchronous layout chunk. This reduces initial JS parse time (TBT/INP).
export { domAnimation as default } from "framer-motion";
