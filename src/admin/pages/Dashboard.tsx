import React from "react";

const Dashboard = () => {
  return (
    <>
      <div className="w-full px-6 py-6 mx-auto text-left">
        <div className="flex flex-wrap -mx-3">
          <div className="w-full px-3 mb-6 sm:w-1/2 xl:w-1/4">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <div className="flex">
                <div className="w-2/3">
                  <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">
                    Today's Money
                  </p>
                  <h5 className="font-bold text-slate-800 dark:text-white">
                    $53,000
                  </h5>
                  <p className="text-slate-500 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">+55%</span>{" "}
                    since yesterday
                  </p>
                </div>
                <div className="w-1/3 flex justify-end items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-blue-500 to-violet-500 flex items-center justify-center">
                    <i className="ni ni-money-coins text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-3 mb-6 sm:w-1/2 xl:w-1/4">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <div className="flex">
                <div className="w-2/3">
                  <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">
                    Today's Users
                  </p>
                  <h5 className="font-bold text-slate-800 dark:text-white">
                    2,300
                  </h5>
                  <p className="text-slate-500 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">+3%</span>{" "}
                    since last week
                  </p>
                </div>
                <div className="w-1/3 flex justify-end items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-red-600 to-orange-600 flex items-center justify-center">
                    <i className="ni ni-world text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-3 mb-6 sm:w-1/2 xl:w-1/4">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <div className="flex">
                <div className="w-2/3">
                  <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">
                    New Clients
                  </p>
                  <h5 className="font-bold text-slate-800 dark:text-white">
                    +3,462
                  </h5>
                  <p className="text-slate-500 dark:text-slate-300">
                    <span className="text-red-600 font-bold">-2%</span> since
                    last quarter
                  </p>
                </div>
                <div className="w-1/3 flex justify-end items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-emerald-500 to-teal-400 flex items-center justify-center">
                    <i className="ni ni-paper-diploma text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-3 mb-6 sm:w-1/2 xl:w-1/4">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <div className="flex">
                <div className="w-2/3">
                  <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-300">
                    Sales
                  </p>
                  <h5 className="font-bold text-slate-800 dark:text-white">
                    $103,430
                  </h5>
                  <p className="text-slate-500 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">+5%</span> than
                    last month
                  </p>
                </div>
                <div className="w-1/3 flex justify-end items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-orange-500 to-yellow-500 flex items-center justify-center">
                    <i className="ni ni-cart text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap mt-6 -mx-3">
          <div className="w-full px-3 mb-6 lg:mb-0 lg:w-7/12">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <h6 className="mb-4 text-slate-700 dark:text-white font-semibold">
                Sales by Country
              </h6>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-gray-200 dark:divide-white/20">
                    <tr>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src="./assets/img/icons/flags/US.png"
                            className="w-6 h-6"
                          />
                          <div className="ml-4">
                            <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                              Country:
                            </p>
                            <h6 className="text-sm text-slate-700 dark:text-white">
                              United States
                            </h6>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Sales:
                        </p>
                        <h6 className="text-sm dark:text-white">2500</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Value:
                        </p>
                        <h6 className="text-sm dark:text-white">$230,900</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Bounce:
                        </p>
                        <h6 className="text-sm dark:text-white">29.9%</h6>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src="./assets/img/icons/flags/DE.png"
                            className="w-6 h-6"
                          />
                          <div className="ml-4">
                            <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                              Country:
                            </p>
                            <h6 className="text-sm dark:text-white">Germany</h6>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Sales:
                        </p>
                        <h6 className="text-sm dark:text-white">3,900</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Value:
                        </p>
                        <h6 className="text-sm dark:text-white">$440,000</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Bounce:
                        </p>
                        <h6 className="text-sm dark:text-white">40.22%</h6>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src="./assets/img/icons/flags/GB.png"
                            className="w-6 h-6"
                          />
                          <div className="ml-4">
                            <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                              Country:
                            </p>
                            <h6 className="text-sm dark:text-white">
                              Great Britain
                            </h6>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Sales:
                        </p>
                        <h6 className="text-sm dark:text-white">1,400</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Value:
                        </p>
                        <h6 className="text-sm dark:text-white">$190,700</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Bounce:
                        </p>
                        <h6 className="text-sm dark:text-white">23.44%</h6>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src="./assets/img/icons/flags/BR.png"
                            className="w-6 h-6"
                          />
                          <div className="ml-4">
                            <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                              Country:
                            </p>
                            <h6 className="text-sm dark:text-white">Brasil</h6>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Sales:
                        </p>
                        <h6 className="text-sm dark:text-white">562</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Value:
                        </p>
                        <h6 className="text-sm dark:text-white">$143,960</h6>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-white/60 font-semibold">
                          Bounce:
                        </p>
                        <h6 className="text-sm dark:text-white">32.14%</h6>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-full px-3 lg:w-5/12">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4">
              <h6 className="text-slate-700 dark:text-white font-semibold mb-4">
                Categories
              </h6>

              <ul className="space-y-3">
                <li className="flex justify-between items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-700/30">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tl from-zinc-800 to-zinc-700 flex items-center justify-center mr-4">
                      <i className="ni ni-mobile-button text-white text-xs"></i>
                    </div>
                    <div>
                      <h6 className="text-sm dark:text-white">Devices</h6>
                      <p className="text-xs dark:text-white/80">
                        250 in stock,{" "}
                        <span className="font-semibold">346+ sold</span>
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-700 dark:text-white text-xs">
                    <i className="ni ni-bold-right"></i>
                  </button>
                </li>

                <li className="flex justify-between items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-700/30">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tl from-zinc-800 to-zinc-700 flex items-center justify-center mr-4">
                      <i className="ni ni-tag text-white text-xs"></i>
                    </div>
                    <div>
                      <h6 className="text-sm dark:text-white">Tickets</h6>
                      <p className="text-xs dark:text-white/80">
                        123 closed,{" "}
                        <span className="font-semibold">15 open</span>
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-700 dark:text-white text-xs">
                    <i className="ni ni-bold-right"></i>
                  </button>
                </li>

                <li className="flex justify-between items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-700/30">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tl from-zinc-800 to-zinc-700 flex items-center justify-center mr-4">
                      <i className="ni ni-box-2 text-white text-xs"></i>
                    </div>
                    <div>
                      <h6 className="text-sm dark:text-white">Error logs</h6>
                      <p className="text-xs dark:text-white/80">
                        1 active,{" "}
                        <span className="font-semibold">40 closed</span>
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-700 dark:text-white text-xs">
                    <i className="ni ni-bold-right"></i>
                  </button>
                </li>

                <li className="flex justify-between items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-700/30">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tl from-zinc-800 to-zinc-700 flex items-center justify-center mr-4">
                      <i className="ni ni-satisfied text-white text-xs"></i>
                    </div>
                    <div>
                      <h6 className="text-sm dark:text-white">Happy users</h6>
                      <p className="text-xs dark:text-white/80">
                        <span className="font-semibold">+430</span>
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-700 dark:text-white text-xs">
                    <i className="ni ni-bold-right"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
