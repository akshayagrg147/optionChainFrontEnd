import MarketTable from "../../components/Dashboard/MarketTable";

import Sidebar from "../../components/Dashboard/Sidebar";
import Topbar from "../../components/Dashboard/Topbar";
import TradeControls from "../../components/Dashboard/TradeControls";
import React from "react";

const DashboardPage = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <div className="flex flex-1 p-4 gap-4">
                    <div className="w-2/3 space-y-4">
                        <TradeControls />
                        <MarketTable />
                    </div>
                    
                </div>
            </div>
        </div>
    )
}

export default DashboardPage;