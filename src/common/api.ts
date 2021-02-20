import Axios from "axios";
import Notify from "./notify";
import { $gettext } from "./vm";
import Event from "pubsub-js";

declare global {
  interface Window {
      __CONFIG__:any;
  }
}

const testConfig = { jsHash: "48019917", cssHash: "2b327230", version: "test" };
const config = window.__CONFIG__ ? window.__CONFIG__ : testConfig;

const Api = Axios.create({
  baseURL: "/api/v1",
  headers: {
    common: {
      "X-Session-ID": window.localStorage.getItem("session_id"),
      "X-Client-Hash": config.jsHash,
      "X-Client-Version": config.version,
    },
  },
});

Api.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    Notify.ajaxStart();
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

Api.interceptors.response.use(
  function (resp) {
    Notify.ajaxEnd();

    if (typeof resp.data == "string") {
      Notify.error($gettext("Request failed - invalid response"));
      console.warn("WARNING: Server returned HTML instead of JSON - API not implemented?");
    }

    // Update preview token.
    if (resp.headers && resp.headers["x-preview-token"]) {
      const previewToken = resp.headers["x-preview-token"];
      if (config.previewToken !== previewToken) {
        config.previewToken = previewToken;
        Event.publish("config.updated", { config: { previewToken } });
      }
    }

    return resp;
  },
  function (error) {
    Notify.ajaxEnd();

    if (Axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (console && console.log) {
      console.log(error);
    }

    let errorMessage = $gettext("An error occurred - are you offline?");
    let code = error.code;

    if (error.response && error.response.data) {
      const data = error.response.data;
      code = data.code;
      errorMessage = data.message ? data.message : data.error;
    }

    if (code === 401) {
      Notify.logout(errorMessage);
    } else {
      Notify.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default Api;