import MarketTable from "../../components/Dashboard/MarketTable";
import React, { useState } from "react";
import TradeTableSecond from "../../components/Dashboard/TradeControlSecond";
import { ZerodhaWebSocketProvider } from "../../ZerodhaWebSocketContext";
import ZerodhaSidebar from "../../components/Zerodha/ZerodhaSidebar";
import ZerodhaTopbar from "../../components/Zerodha/ZerodhaTopBar";
import ZerodhaTradeTable from "../../components/Zerodha/ZerodhaTradeControls";
import ZerodhaTradeTableSecond from "../../components/Zerodha/ZerodhaTradeControlSecond";
import ZerodhaMarketTable from "../../components/Zerodha/ZerodhaMarketTable";

const initialRows = [
    {
        type: "CALL",
        instrument: "NIFTY",
        instrument_key: "",
        strikePrice: 27100,
        dateOfContract: "2025-10-07",
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
        strikePrice: 22900,
        instrument_key: "",
        dateOfContract: "2025-10-07",
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

const ZerodhaDashboard = () => {
    const [reverseTrade, setReverseTrade] = useState(false);
    const [rtpValue, setRtpValue] = useState(0.25);
    const [spreadSize, setSpreadSize] = useState(0.5);
    const [reverseTradeDataTransfer,setReverseTradeDataTransfer] = useState(false);
    const [isSimulation, setIsSimulation] = useState(false);
    const [data, setData] = useState(initialRows);
    const [reverseData, setReverseData] = useState(initialRows.map((r) => ({ ...r }))); // 🔁 clone for reverse trade

    return (
        <div className="flex h-screen bg-gray-100">
            <ZerodhaSidebar />
            <div className="flex-1 flex flex-col">
                <ZerodhaTopbar />
                <div className="p-4 gap-4">
                    <div className="space-y-4">
                        <ZerodhaWebSocketProvider
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
                            isSimulation={isSimulation}
                        >

                            <ZerodhaTradeTable
                                data={data}
                                setData={setData}
                                setReverseTrade={setReverseTrade}
                                reverseTrade={reverseTrade}
                                rtpValue={rtpValue}
                                setRtpValue={setRtpValue}
                                spreadSize={spreadSize}
                                setSpreadSize={setSpreadSize}
                                isSimulation={isSimulation}
                                setIsSimulation={setIsSimulation}
                            />
                            {reverseTrade &&
                                <ZerodhaTradeTableSecond data={reverseData} setData={setReverseData} />}


                            <ZerodhaMarketTable
                                data={reverseTrade ? reverseData : data}
                                setData={reverseTrade ? setReverseData : setData}
                            />
                        </ZerodhaWebSocketProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZerodhaDashboard;
