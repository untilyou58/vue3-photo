export const vm = {
    $gettext: (msgid: string) => msgid,
    $ngettext: (msgid: string, plural: string, n: number) => {
      return n > 1 ? plural : msgid;
    },
    $pgettext: (context: any, msgid: string) => msgid,
    $npgettext: (context: any, msgid: string) => msgid,
  };
  
  export function $gettext(msgid: string) {
    return vm.$gettext(msgid);
  }
  
  export function $ngettext(msgid: string, plural: string, n: number) {
    return vm.$ngettext(msgid, plural, n);
  }
  
  export function Mount(App: any, createApp: any) {
    console.log("join")
    createApp(App).mount('#app');
  }