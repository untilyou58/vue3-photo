import Event from "pubsub-js";
import { $gettext } from "./vm";

let ajaxPending = 0;
const ajaxCallbacks: any = [];

const Notify = {
  info: function (message: string) {
    Event.publish("notify.info", { message });
  },
  warn: function (message: string) {
    Event.publish("notify.warning", { message });
  },
  error: function (message: string) {
    Event.publish("notify.error", { message });
  },
  success: function (message: string) {
    Event.publish("notify.success", { message });
  },
  logout: function (message: string) {
    Event.publish("notify.error", { message });
    Event.publish("session.logout", { message });
  },
  ajaxStart: function () {
    ajaxPending++;
    Event.publish("ajax.start");
  },
  ajaxEnd: function () {
    ajaxPending--;
    Event.publish("ajax.end");

    if (!this.ajaxBusy()) {
      ajaxCallbacks.forEach((resolve: any) => {
        resolve();
      });
    }
  },
  ajaxBusy: function () {
    if (ajaxPending < 0) {
      ajaxPending = 0;
    }

    return ajaxPending > 0;
  },
  ajaxWait: function () {
    return new Promise((resolve: any) => {
      if (this.ajaxBusy()) {
        ajaxCallbacks.push(resolve);
      } else {
        resolve();
      }
    });
  },
  blockUI: function () {
    const el = document.getElementById("busy-overlay");

    if (el) {
      el.style.display = "block";
    }
  },
  unblockUI: function () {
    const el = document.getElementById("busy-overlay");

    if (el) {
      el.style.display = "none";
    }
  },
  wait: function () {
    this.warn($gettext("Busy, please wait…"));
  },
};

export default Notify;