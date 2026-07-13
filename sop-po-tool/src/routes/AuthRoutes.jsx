// project import
import AuthLayout from "../layout/AuthLayout";
import AuthLogin from "../views/auth/Login";
import Pagenotfound from "../views/Pagenotfound";
import ForgetPassword from "../views/auth/ForgetPassword.jsx";
import ConfrimPassword from "../views/auth/ConfimPassword.jsx";


// ==============================|| AUTH ROUTING ||============================== //

const LoginRoutes = {
  path: "/",
  element: <AuthLayout />,
  children: [
    {
      path: "/",
      element: <AuthLogin />,
    },
    {
      path: "/login",
      element: <AuthLogin />,
    },
    {
      path: "/forgetpassword",
      element: <ForgetPassword />,
    },
    {
      path: "/resetpassword",
      element: <ConfrimPassword />,
    },
    {
      path: "/pagenotfound",
      element: <Pagenotfound />,
    },
  ],
};
export default LoginRoutes;
