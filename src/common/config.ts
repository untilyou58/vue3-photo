import Event from "pubsub-js";
import themes from "../options/themes.json";
import translations from "../locales/translations.json";
import Api from "./api";

export default class Config {
  disconnected: boolean;
  storage: Storage;
  storage_key: string;
  $vuetify: any;
  translations: any;
  debug: boolean;
  test: boolean;
  demo: boolean;
  themeName: string | undefined;
  values: any;
  page: { title: string; caption: string; };
  theme: any;
  /**
   * @param {Storage} storage
   * @param {object} values
   */
  constructor(storage: Storage, values: any) {
    this.disconnected = false;
    this.storage = storage;
    this.storage_key = "config";

    this.$vuetify = null;
    this.translations = translations;

    if (!values || !values.siteTitle) {
      console.warn("config: values are empty");
      this.debug = true;
      this.test = true;
      this.demo = false;
      this.themeName = "";
      this.values = {};
      this.page = {
        title: "PhotoPrism",
        caption: "Browse Your Life",
      };
      return;
    }

    this.page = {
      title: values.siteTitle,
      caption: values.siteCaption,
    };

    this.values = values;
    this.debug = !!values.debug;
    this.test = !!values.test;
    this.demo = !!values.demo;

    Event.subscribe("config.updated", (_ev: any, data: { config: any; }) => this.setValues(data.config));
    Event.subscribe("count", (ev: any, data: any) => this.onCount(ev, data));

    if (this.has("settings")) {
      this.setTheme(this.get("settings").ui.theme);
    } else {
      this.setTheme("default");
    }
  }

  loading() {
    return !this.values.mode || this.values.mode === "public";
  }

  load() {
    if (this.loading()) {
      return this.update();
    }

    return Promise.resolve();
  }

  update() {
    return Api.get("config")
      .then(
        (response) => this.setValues(response.data),
        () => console.warn("failed pulling updated client config")
      )
      .finally(() => Promise.resolve());
  }

  setValues(values: any) {
    if (!values) return;

    if (this.debug) {
      console.log("config: new values", values);
    }

    if (values.jsHash && this.values.jsHash !== values.jsHash) {
      Event.publish("dialog.reload", { values });
    }

    for (const key in values) {
      // eslint-disable-next-line no-prototype-builtins
      if (values.hasOwnProperty(key)) {
        this.set(key, values[key]);
      }
    }

    if (values.settings) {
      this.setTheme(values.settings.ui.theme);
    }

    return this;
  }

  onCount(ev: string, data: { count: any; }) {
    const type = ev.split(".")[1];

    switch (type) {
      case "photos":
        this.values.count.all += data.count;
        this.values.count.photos += data.count;
        break;
      case "videos":
        this.values.count.all += data.count;
        this.values.count.videos += data.count;
        break;
      case "cameras":
        this.values.count.cameras += data.count;
        this.update();
        break;
      case "lenses":
        this.values.count.lenses += data.count;
        break;
      case "countries":
        this.values.count.countries += data.count;
        this.update();
        break;
      case "states":
        this.values.count.states += data.count;
        break;
      case "places":
        this.values.count.places += data.count;
        break;
      case "labels":
        this.values.count.labels += data.count;
        break;
      case "albums":
        this.values.count.albums += data.count;
        break;
      case "moments":
        this.values.count.moments += data.count;
        break;
      case "months":
        this.values.count.months += data.count;
        break;
      case "folders":
        this.values.count.folders += data.count;
        break;
      case "files":
        this.values.count.files += data.count;
        break;
      case "favorites":
        this.values.count.favorites += data.count;
        break;
      case "review":
        this.values.count.review += data.count;
        break;
      case "private":
        this.values.count.private += data.count;
        break;
      default:
        console.warn("unknown count type", ev, data);
    }

    this.values.count;
  }

  setVuetify(instance: any) {
    this.$vuetify = instance;
  }

  setTheme(name: "default" | "grayscale" | "cyano" | "raspberry" | "seaweed" | "lavender" | "moonlight" | "onyx" | "shadow") {
    this.themeName = name;

    const el = document.getElementById("photo");

    if (el) {
      el.className = "theme-" + name;
    }

    this.theme = themes[name] ? themes[name] : themes["default"];

    if (this.theme.dark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    if (this.$vuetify) {
      this.$vuetify.theme = this.theme.colors;
    }

    return this;
  }

  getValues() {
    return this.values;
  }

  storeValues() {
    this.storage.setItem(this.storage_key, JSON.stringify(this.getValues()));
    return this;
  }

  set(key: string, value: any) {
    this.values[key] = value;
    return this;
  }

  has(key: string) {
    return !!this.values[key];
  }

  get(key: string) {
    return this.values[key];
  }

  feature(name: string | number) {
    return this.values.settings.features[name];
  }

  settings() {
    return this.values.settings;
  }

  downloadToken() {
    return this.values["downloadToken"];
  }

  previewToken() {
    return this.values["previewToken"];
  }

  albumCategories() {
    if (this.values["albumCategories"]) {
      return this.values["albumCategories"];
    }

    return [];
  }
}