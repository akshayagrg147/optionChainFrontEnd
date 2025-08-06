import MarketTable from "../../components/Dashboard/MarketTable";

import Sidebar from "../../components/Dashboard/Sidebar";
import Topbar from "../../components/Dashboard/Topbar";
import TradeControls from "../../components/Dashboard/TradeControls";
import React, { useState } from "react";
import TradeTableSecond from "../../components/Dashboard/TradeControlSecond";
import { WebSocketProvider } from "../../WebSocketContext";
import TradeTable from "../../components/Dashboard/TradeControls";

const DashboardPage = () => {
      const [reverseTrade, setReverseTrade] = useState(false);
      const [rtpValue, setRtpValue] = useState(0);
    const [data, setData] = useState([
        {
            type: 'CALL',
            instrument: 'NIFTY',
            instrument_key:'',
            strikePrice: 25000,
            dateOfContract: '2025-08-14',
            targetMarketCE: 25130,
            targetMarketPE: 25350,
            currentMarket: 22650,
            lotSize: 50,
            ltpLocked: '-',
            status: 'Inactive',
            pl: '-',
            buyInLTP: 102.5,
            liveInLTP: 26.5,
            active: false,
            editMode: false,
            trading_symbol: 'NIFTY2571725200CE',
            trading_symbol_2: 'BANKNIFTY2571749000PE',
        },
        {
            type: 'PUT',
            instrument: 'NIFTY',
            strikePrice: 25000,
             instrument_key:'',
            dateOfContract: '2025-08-14',
            targetMarketCE: 25130,
            targetMarketPE: 25350,
            currentMarket: 49200,
            lotSize: 25,
            ltpLocked:'-',
            status: 'Inactive',
            pl: '-',
            buyInLTP: 185.7,
            liveInLTP: 10.7,
            active: false,
            editMode: false,
            trading_symbol: 'BANKNIFTY2571749000PE',
        }
    ]);
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <div className=" p-4 gap-4">
                    <div className=" space-y-4">
                        <WebSocketProvider tradeData={data} setTradeData={setData} setReverseTrade={setReverseTrade}  setRtpValue={setRtpValue} >
                            <TradeTable data={data} setData={setData} setReverseTrade={setReverseTrade} reverseTrade={reverseTrade} rtpValue={rtpValue} setRtpValue={setRtpValue}/>
                            {/* <TradeTableSecond /> */}
                            <MarketTable data={data} setData={setData} />
                        </WebSocketProvider>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default DashboardPage;