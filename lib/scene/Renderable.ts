import FrameState from "./FrameState";

interface Renderable {
  update(frameState: FrameState)
  isDestroyed() : boolean
  destroy()
}

export default Renderable;
