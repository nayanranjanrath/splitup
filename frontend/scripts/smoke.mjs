import { renderToString } from "react-dom/server";
import { createElement as h } from "react";
import { MemoryRouter } from "react-router-dom";

// minimal browser globals for render-time code
globalThis.window = {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
  devicePixelRatio: 1,
  innerWidth: 1200,
  innerHeight: 800,
};
globalThis.document = {
  cookie: "",
  createElement: () => ({ getContext: () => null, style: {} }),
  addEventListener() {},
  removeEventListener() {},
  body: {},
};
globalThis.navigator = { deviceMemory: 8 };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.IntersectionObserver = class {
  observe() {}
  disconnect() {}
};
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const pages = {
  Landing: (await import("/src/pages/Landing.jsx")).default,
  HomePage: (await import("/src/pages/HomePage.jsx")).default,
  SearchPage: (await import("/src/pages/SearchPage.jsx")).default,
  CreatePage: (await import("/src/pages/CreatePage.jsx")).default,
  DiscussPage: (await import("/src/pages/DiscussPage.jsx")).default,
  GroupsPage: (await import("/src/pages/GroupsPage.jsx")).default,
  ProfilePage: (await import("/src/pages/ProfilePage.jsx")).default,
  TempChatPage: (await import("/src/pages/ChatPage.jsx")).TempChatPage,
  FinalChatPage: (await import("/src/pages/ChatPage.jsx")).FinalChatPage,
  AuthLogin: (await import("/src/pages/AuthPage.jsx")).default,
  AuthRegister: (await import("/src/pages/AuthPage.jsx")).default,
  GoogleCallback: (await import("/src/pages/GoogleCallback.jsx")).default,
  AppliedListPage: (await import("/src/pages/MyListsPages.jsx")).AppliedListPage,
  MyRequestsListPage: (await import("/src/pages/MyListsPages.jsx")).MyRequestsListPage,
};

for (const [name, Cmp] of Object.entries(pages)) {
  try {
    const el =
      name === "AuthLogin"
        ? h(Cmp, { mode: "login" })
        : name === "AuthRegister"
          ? h(Cmp, { mode: "register" })
          : h(Cmp);
    const route =
      name === "ProfilePage"
        ? "/profile/abc"
        : name === "TempChatPage"
          ? "/chat/abc"
          : name === "FinalChatPage"
            ? "/groupchat/abc"
            : "/";
    renderToString(h(MemoryRouter, { initialEntries: [route] }, el));
    console.log("OK  ", name);
  } catch (e) {
    console.log("FAIL", name, "->", e.message);
  }
}
