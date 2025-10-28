import Sidebar from "../../components/Dashboard/Sidebar";
import Topbar from "../../components/Dashboard/Topbar";
import DryManualTradeUI from "../../components/DryRunManualTrade";
import ManualTradeUI from "../../components/ManualTradeUI";

const TestingManualTradePage = () => {
  return (
    <>
         <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <DryManualTradeUI />
            </div>
        </div>
    </>
  );
}

export default TestingManualTradePage;