import Sidebar from "../../components/Dashboard/Sidebar";
import Topbar from "../../components/Dashboard/Topbar";
import ManualTradeUI from "../../components/ManualTradeUI";

const ManualTradePage = () => {
  return (
    <>
         <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <ManualTradeUI />
            </div>
        </div>
    </>
  );
}

export default ManualTradePage;