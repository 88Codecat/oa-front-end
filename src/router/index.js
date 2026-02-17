import { createBrowserRouter } from "react-router";
import Login from "../pages/Login"
import Register from "../pages/Register"
import Home from "../pages/Home"



const router = createBrowserRouter([
	{
		path: "/",
		Component: Login,
	},

	{
		path: "/register",
		Component: Register,
	},

	{
		path: "/home",
		Component: Home,
	},
]);

export default router;
