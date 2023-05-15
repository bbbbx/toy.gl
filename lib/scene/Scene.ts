import Event from "../core/Event";
import Renderable from "./Renderable";

class Scene {
  objects: Renderable[];

  beforeUpdate: Event;

  constructor() {
    this.objects = [];

    this.beforeUpdate = new Event();
  }
}

export default Scene;
