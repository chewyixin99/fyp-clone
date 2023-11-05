import React from "react";
import { Outlet, Link } from "react-router-dom";
import "../styling/style.css"

const Navbar = () => {
  return (
    <div className="mx-auto">
      <nav className="bg-white border-gray-200 dark:bg-gray-900" style={{backgroundColor: "#d7f5c9"}}>
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center">
            <img
              src="src/assets/buzz-lightyear.jpg"
              className="h-8 mr-3"
              alt="Buzz Lightyear"
            />
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white font-title" style={{color: "#223ca4"}}>
              Infinity <span style={{color: "#223ca4"}}>Visualiser</span>
            </span>
          </a>
          <div className="hidden w-full md:block md:w-auto" id="navbar-default" >
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700" style={{backgroundColor: "#d7f5c9"}}>
            <li>
                <Link
                  to={`/`}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent font-title"
                  style={{color: "#7a2d91"}}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to={`/about`}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent font-title"
                  style={{color: "#7a2d91"}}
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  to={`/complexity`}
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent font-title"
                  style={{color: "#e25950"}}
                >
                  Complexity
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
};

export default Navbar;
