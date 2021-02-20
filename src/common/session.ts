import Api from "./api";
import Event from "pubsub-js";
// import User from "model/user";
import Socket from "./websocket";
import Config from "./config";

export default class Session {
  auth: boolean;
    config: Config;
    storage: Storage;
    data: any;
    user: any;
    session_id: any;
  /**
   * @param {Storage} storage
   * @param {Config} config
   */
  constructor(storage: Storage, config: Config) {
    this.auth = false;
    this.config = config;

    if (storage.getItem("session_storage") === "true") {
      this.storage = window.sessionStorage;
    } else {
      this.storage = storage;
    }

    if (this.applyId(this.storage.getItem("session_id"))) {
      const dataJson = this.storage.getItem("data");
      this.data = dataJson !== null ? JSON.parse(dataJson) : null;
    }

    if (this.data && this.data.user) {
    //   this.user = new User(this.data.user);
    }

    if (this.isUser()) {
      this.auth = true;
    }

    Event.subscribe("session.logout", () => {
    //   return this.onLogout();
    });

    Event.subscribe("websocket.connected", () => {
      this.sendClientInfo();
    });

    this.sendClientInfo();
  }

  useSessionStorage() {
    this.deleteId();
    this.storage.setItem("session_storage", "true");
    this.storage = window.sessionStorage;
  }

  useLocalStorage() {
    this.storage.setItem("session_storage", "false");
    this.storage = window.localStorage;
  }

  applyId(id: string | null) {
    if (!id) {
      this.deleteId();
      return false;
    }

    this.session_id = id;
    Api.defaults.headers.common["X-Session-ID"] = id;

    return true;
  }

  setId(id: string) {
    this.storage.setItem("session_id", id);
    return this.applyId(id);
  }

  setConfig(values: any) {
    this.config.setValues(values);
  }

  getId() {
    return this.session_id;
  }

  hasId() {
    return !!this.session_id;
  }

  deleteId() {
    this.session_id = null;
    this.storage.removeItem("session_id");
    delete Api.defaults.headers.common["X-Session-ID"];
    this.deleteData();
  }

  setData(data: any) {
    if (!data) {
      return;
    }

    this.data = data;
    // this.user = new User(this.data.user);
    this.storage.setItem("data", JSON.stringify(data));
    this.auth = true;
  }

  getUser() {
    return this.user;
  }

  getEmail() {
    if (this.isUser()) {
      return this.user.PrimaryEmail;
    }

    return "";
  }

  getNickName() {
    if (this.isUser()) {
      return this.user.NickName;
    }

    return "";
  }

  getFullName() {
    if (this.isUser()) {
      return this.user.FullName;
    }

    return "";
  }

  isUser() {
    return this.user && this.user.hasId();
  }

  isAdmin() {
    return this.user && this.user.hasId() && this.user.RoleAdmin;
  }

  isAnonymous() {
    return !this.user || !this.user.hasId();
  }

  hasToken(token: any) {
    if (!this.data || !this.data.tokens) {
      return false;
    }

    return this.data.tokens.indexOf(token) >= 0;
  }

  deleteData() {
    this.auth = false;
    // this.user = new User();
    this.data = null;
    this.storage.removeItem("data");
  }

  sendClientInfo() {
    const clientInfo = {
      session: this.getId(),
      js: window.__CONFIG__.jsHash,
      css: window.__CONFIG__.cssHash,
      version: window.__CONFIG__.version,
    };

    try {
      Socket.send(JSON.stringify(clientInfo));
    } catch (e) {
      if (this.config.debug) {
        console.log("session: can't use websocket, not connected (yet)");
      }
    }
  }

  login(username: any, password: any, token: any) {
    this.deleteId();

    return Api.post("session", { username, password, token }).then((resp) => {
      this.setConfig(resp.data.config);
      this.setId(resp.data.id);
      this.setData(resp.data.data);
      this.sendClientInfo();
    });
  }

  redeemToken(token: any) {
    return Api.post("session", { token }).then((resp) => {
      this.setConfig(resp.data.config);
      this.setId(resp.data.id);
      this.setData(resp.data.data);
      this.sendClientInfo();
    });
  }

  onLogout(noRedirect: boolean) {
    this.deleteId();
    if (noRedirect !== true) {
      window.location.href = "/";
    }
    return Promise.resolve();
  }

  logout(noRedirect: boolean) {
    if (this.hasId()) {
      return Api.delete("session/" + this.getId())
        .then(() => {
          return this.onLogout(noRedirect);
        })
        .catch(() => {
          return this.onLogout(noRedirect);
        });
    } else {
      return this.onLogout(noRedirect);
    }
  }
}