import MainLayout from "../layout/MainLayout";
import AuthLayout from "../layout/AuthLayout";
import Request from "../views/Request";
import Businessapprover from "../views/Businessapprover";
import Prscreening from "../views/PRscreening";
import PrivateRoute from "./PrivateRoutes";
import Budgetteam from "../views/Budgetteam";
import Divisionhead from "../views/Divisionhead";
import Budgetreleaseteam from "../views/Budgetreleaseteam";
import POmaker from "../views/POmaker";
import POrelease from "../views/POrelease";
import POchecker from "../views/POchecker";
import Admin from "../views/Admin";
import Dashboard from "../pages/Dashboard";
import PoTat from "../pages/PoTat";
import MailTemplate from "../views/MailTemplate";
import DeliveryPlanner from "../views/DeliveryPlanner";
import InternalAudit from "../views/InternalAudit";
// ==============================|| MAIN ROUTING ||============================== //
const MainRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/request",
      element: <Request />,
    },
    {
      path: "/businessapprover",
      element: <Businessapprover />,
    },
    {
      path: "/prscreening",
      element: <Prscreening />,
    },

    {
      path: "/budgetteam",
      element: <Budgetteam />,
    },
    {
      path: "/businesshead",
      element: <Divisionhead />,
    },
    {
      path: "/budgetreleaseteam",
      element: <Budgetreleaseteam />,
    },
    {
      path: "/pomaker",
      element: <POmaker />,
    },
    {
      path: "/porelease",
      element: <POrelease />,
    },
    {
      path: "/pochecker",
      element: <POchecker />,
    },
    {
      path: "/deliveryplanner",
      element: <DeliveryPlanner />,
    },
    {
      path: "/admin",
      element: <Admin/>,
    },
    {
      path: "/potat",
      element: <PoTat/>,
    },
    {
      path: "/mailtemplate",
      element: <MailTemplate/>,
    },
    {
      path: "/internalaudit",
      element: <InternalAudit/>,
    },
  ],
};
export default MainRoutes;
