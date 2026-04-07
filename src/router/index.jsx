import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Tasks from "../pages/Tasks";
import Attendance from "../pages/Attendance";
import Announcements from "../pages/Announcements";
import Employees from "../pages/Employees";
import Departments from "../pages/Departments";
import Salaries from "../pages/Salaries";
import Messages from "../pages/Messages";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},

	{
		path: "/register",
		element: <Register />,
	},

	{
		path: "/",
		element: <ProtectedRoute />,
		children: [
			{
				index: true,
				element: <Navigate to="/home" replace />,
			},
			{
				path: "home",
				element: <Home />,
			},
			{
				path: "tasks",
				element: <Tasks />,
			},
			{
				path: "tasks/:id",
				element: <Tasks />,
			},
			{
				path: "attendance",
				element: <Attendance />,
			},
			{
				path: "announcements",
				element: <Announcements />,
			},
			{
				path: "announcements/:id",
				element: <Announcements />,
			},
			{
				path: "employees",
				element: <Employees />,
			},
			{
				path: "departments",
				element: <Departments />,
			},
			{
				path: "salaries",
				element: <Salaries />,
			},
			{
				path: "messages",
				element: <Messages />,
			},
		],
	},

	{
		path: "*",
		element: <Navigate to="/login" replace />,
	},
]);

export default router;
