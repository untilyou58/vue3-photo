import Sockette from "sockette";
import Event from "pubsub-js";
import { config } from "../session";

const host = window.location.host;
const prot = "https:" === document.location.protocol ? "wss://" : "ws://";
const url = prot + host + "/api/v1/ws";

const Socket = new Sockette(url, {
  timeout: 5e3,
  onopen: (e: any) => {
    console.log("websocket: connected");
    config.disconnected = false;
    document.body.classList.remove("disconnected");
    Event.publish("websocket.connected", e);
  },
  onmessage: (e) => {
    const m = JSON.parse(e.data);
    Event.publish(m.event, m.data);
  },
  onreconnect: () => console.log("websocket: reconnecting"),
  onmaximum: () => console.warn("websocket: hit max reconnect limit"),
  onclose: () => {
    console.warn("websocket: disconnected");
    config.disconnected = true;
    document.body.classList.add("disconnected");
  },
});

export default Socket;