import MarketTable from "../../components/Dashboard/MarketTable";
import Sidebar from "../../components/Dashboard/Sidebar";
import Topbar from "../../components/Dashboard/Topbar";
import TradeControls from "../../components/Dashboard/TradeControls";
import React, { useState } from "react";
import TradeTableSecond from "../../components/Dashboard/TradeControlSecond";
import { WebSocketProvider } from "../../WebSocketContext";
import TradeTable from "../../components/Dashboard/TradeControls";

const initialRows = [
    {
        type: "CALL",
        instrument: "NIFTY",
        instrument_key: "",
        strikePrice: 25000,
        dateOfContract: "2025-09-16",
        targetMarketCE: 25130,
        targetMarketPE: 25350,
        currentMarket: 22650,
        lotSize: 25,
        ltpLocked: "-",
        status: "Inactive",
        pl: "-",
        buyInLTP: "-",
        liveInLTP: "-",
        active: false,
        editMode: false,
        trading_symbol: "NIFTY2571725200CE",
        
    },
    {
        type: "PUT",
        instrument: "NIFTY",
        strikePrice: 25000,
        instrument_key: "",
        dateOfContract: "2025-09-16",
        targetMarketCE: 25130,
        targetMarketPE: 25350,
        currentMarket: 49200,
        lotSize: 25,
        ltpLocked: "-",
        status: "Inactive",
        pl: "-",
        buyInLTP: "-",
        liveInLTP: "-",
        active: false,
        editMode: false,
        trading_symbol: "NIFTY2571725200CE",
        trading_symbol_2: "BANKNIFTY2571749000PE",
    },
];

const DashboardPage = () => {
    const [reverseTrade, setReverseTrade] = useState(false);
    const [rtpValue, setRtpValue] = useState(0.25);
    const [spreadSize, setSpreadSize] = useState(0.5);
    const [reverseTradeDataTransfer,setReverseTradeDataTransfer] = useState(false);
    const [data, setData] = useState(initialRows);
    const [reverseData, setReverseData] = useState(initialRows.map((r) => ({ ...r }))); // 🔁 clone for reverse trade

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <div className="p-4 gap-4">
                    <div className="space-y-4">
                        <WebSocketProvider
                            tradeData={data} // 🔁 switch which array goes to socket
                            setTradeData={reverseTradeDataTransfer ?  setReverseData  : setData}
                            reverseTrade={reverseTrade}
                            setReverseTrade={setReverseTrade}
                            setRtpValue={setRtpValue}
                            rtpValue={rtpValue}
                            spreadSize={spreadSize}
                            setReverseData={setReverseData}
                            reverseTradeDataTransfer={reverseTradeDataTransfer}
                            setReverseTradeDataTransfer={setReverseTradeDataTransfer}
                        >

                            <TradeTable
                                data={data}
                                setData={setData}
                                setReverseTrade={setReverseTrade}
                                reverseTrade={reverseTrade}
                                rtpValue={rtpValue}
                                setRtpValue={setRtpValue}
                                spreadSize={spreadSize}
                                setSpreadSize={setSpreadSize}
                            />
                            {reverseTrade &&
                                <TradeTableSecond data={reverseData} setData={setReverseData} />}


                            <MarketTable
                                data={reverseTrade ? reverseData : data}
                                setData={reverseTrade ? setReverseData : setData}
                            />
                        </WebSocketProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
