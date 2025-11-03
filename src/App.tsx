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

  const isSearchable: boolean = pages[path]?.isSearchable ?? false;
  const displayName: string = pages[path]?.displayName ?? title;

  searchRoutes.push({
    path: routePath,
    isSearchable,
    title: displayName,
  });

  // Add deep-linked tab routes for searchable multi-tab pages
  if (isSearchable) {
    // Asset Owner main page tabs
    if (routePath === '/asset_owner') {
      const assetOwnerTabs: Array<{ key: string; label: string }> = [
        { key: 'assets', label: 'Assets' },
        { key: 'approvals', label: 'Asset Request Approvals' },
        { key: 'changes', label: 'Change Requests' },
        { key: 'masking', label: 'Data Masking' },
      ];
      for (const tab of assetOwnerTabs) {
        searchRoutes.push({
          path: `${routePath}?tab=${tab.key}`,
          isSearchable: true,
          title: `${displayName} • ${tab.label}`,
        });
      }
    }

    // Auditor audit-trail page tabs
    if (routePath === '/auditor/audit-trail') {
      const auditTrailTabs: Array<{ key: string; label: string }> = [
        { key: 'logs', label: 'Logs' },
        { key: 'stats', label: 'Statistics' },
      ];
      for (const tab of auditTrailTabs) {
        searchRoutes.push({
          path: `${routePath}?tab=${tab.key}`,
          isSearchable: true,
          title: `${displayName} • ${tab.label}`,
        });
      }
    }
  }
}

export default function App() {
  stateActions.setPageRoutes(searchRoutes);
  return (
    <RouterProvider
      router={router}
    />
  );
}
