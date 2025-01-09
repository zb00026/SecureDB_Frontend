import { BrowserRouter, createBrowserRouter, RouterProvider, useRoutes } from "react-router-dom";
import routes from "route-views";
import "./global.scss";
import "./main.scss";
import "./polyfills";


const router = createBrowserRouter(routes)

export default function App() {
  return (
    <RouterProvider
      router={router}
    />
  );
}
