import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "route-views";
import "./global.scss";
import "./main.scss";
import "./polyfills";
import { stateActions } from "@common/state";
import { PageRoute } from "@models/PageRoute";


const router = createBrowserRouter(routes)
const pages: any = import.meta.glob("./pages/**/*.tsx", { eager: true });

const searchRoutes: Array<PageRoute> = [];
for (const path of Object.keys(pages)) {
  const fileName = path.match(/\.\/pages\/(.*)\.tsx$/)?.[1];
  if (!fileName) {
    continue;
  }

  // Normalize the path
  const normalizedPathName = fileName.includes("$")
    ? fileName.replace("$", ":")
    : fileName.replace(/\/index$/, ""); // Remove 'index' if it's at the end

  // Create a proper path, making sure the first letter is capitalized
  const routePath = fileName === "index" ? "/" : `/${normalizedPathName.toLowerCase()}`;

  const makeUpperCaseFirstLetter = (text: string, splitWord: string | RegExp): string => {
    const words = text.split(splitWord) // Split the string by spaces
      .map((word, index) =>
        word.charAt(0).toUpperCase() + word.slice(1)
      );
    if (splitWord instanceof RegExp) {
      return words.join('');
    }
    return words.join(splitWord);
  }

  // Capitalize the first letter of the title
  let title = fileName === "index" ? "Dashboard" : normalizedPathName
    .replace(/_/g, " ");
  title = makeUpperCaseFirstLetter(title, " ");
  title = makeUpperCaseFirstLetter(title, "/");

  searchRoutes.push({
    path: routePath,
    isSearchable: pages[path]?.isSearchable ?? false,
    title: pages[path]?.displayName ?? title,
  });
}

export default function App() {
  stateActions.setPageRoutes(searchRoutes);
  return (
    <RouterProvider
      router={router}
    />
  );
}
