import { Menu } from "electron";

export function createApplicationMenu(): void {
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "View",
      submenu: [{ role: "reload" }, { role: "toggleDevTools" }],
    },
  ]);

  Menu.setApplicationMenu(menu);
}