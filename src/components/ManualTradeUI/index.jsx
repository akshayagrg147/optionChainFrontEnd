// import React from 'react';
// import MarketTable from '../Dashboard/MarketTable';
// import TradeTable from '../Dashboard/TradeControls';
// import TradeTableSecond from '../Dashboard/TradeControlSecond';

// const ManualTradeUI = () => {
//   return (
//     <div className="p-6 space-y-8">
//       {/* Manual Trade Setup */}
//       <div className="bg-white rounded-lg shadow-md p-6 w-full mx-auto">
//         <h2 className="text-lg font-semibold mb-4">Manual Trade Setup</h2>

//         <div className="flex flex-wrap items-end gap-4">
//           {/* Option Type Dropdown - updated label */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Underlying</label>
//             <select
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//             >
//               <option value="CE">Call (CE)</option>
//               <option value="PE">Put (PE)</option>
//             </select>
//           </div>

//           {/* Underlying Key Dropdown - updated label */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Instrument</label>
//             <select
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//             >
//               <option value="NSE_INDEX|Nifty 50">Nifty 50</option>
//               <option value="NSE_INDEX|Bank Nifty">Bank Nifty</option>
//               <option value="NSE_INDEX|FINNIFTY">Fin Nifty</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Date of expiry</label>
//             <input
//               type="Date"
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Strike Price</label>
//             <input
//               type="text"
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//             />
//           </div>

//           {/* Instrument Key */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Contract Name </label>
//             <input
//               type="text"
//               value="NSE_INDEX|Nifty 50"
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//               readOnly
//             />
//           </div>



//           {/* Quantity */}

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Quantity</label>
//             <input
//               type="number"
//               className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
//             />
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-1">
//             <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Simulate</button>
//             <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Buy</button>
//             <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sell</button>
//           </div>
//         </div>
//       </div>


//     </div>


//   );
// };

// export default ManualTradeUI;
import React, { useState, useEffect, useRef } from 'react';
import ManualTradeTable from '../ManualTradeTable';
import MarketWatchManual from '../MarketWatchManual';
import { useManualWebSocketData } from '../../ManualWebSocketContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ManualTradeUI = () => {
  const [optionType, setOptionType] = useState("CE");
  const [instrument, setInstrument] = useState("Nifty Bank");
  const [lockedBuyLtp, setLockedBuyLtp] = useState(false);
  const [buyLtp, setBuyLtp] = useState(0)
  const [expiry, setExpiry] = useState("");
  const [strike, setStrike] = useState("");
  const [contactName, setContactName] = useState();
  const [instrumentKey, setInstrumentKey] = useState();
  const [orderId, setOrderId] = useState();
  const [lotSizeState, setLotSizeState] = useState()
  const [OrderPrice, setOrderPrice] = useState(0);
  const [realTrade, setRealTrade] = useState(true);
  const [sellOrderPrice, setSellOrderPrice] = useState();
  const [sellSocket,setSellSocket] = useState()
  const socketsRef = useRef([]);

  let manualQuantity = JSON.parse(localStorage.getItem('funds') || '[]')[0]?.manualTradeQuantity;
  const { socketData, setSocketData } = useManualWebSocketData();

  useEffect(() => {
    if (!instrument || !expiry || !strike || !optionType || !contactName) return;

    const funds = JSON.parse(localStorage.getItem("funds") || "[]");
    if (funds.length === 0) return;

    const newSockets = [];

    funds.forEach((fund, index) => {
      const ws = new WebSocket(process.env.REACT_APP_MANUAL_WEB_SOCKET_URL);

      ws.onopen = () => {
        const payload = {
          instrument_key: `NSE_INDEX|${instrument === "NIFTY" ? "Nifty 50" : instrument}`,
          expiry_date: expiry,
          access_token: fund.token,
          trading_symbol: contactName
        };

        console.log(`🟢 Sending payload to WebSocket [${index}]:`, payload);
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📩 WS Response [${index}]:`, data);
          setSocketData(data); // 🎯 Set via context
        } catch (error) {
          console.error(`❌ JSON parse error for token ${fund.token_id}`, error);
        }
      };

      ws.onerror = (err) => {
        console.error(`❌ WebSocket error [${index}]:`, err);
      };

      ws.onclose = () => {
        console.warn(`⚠️ WebSocket closed [${index}]`);
      };

      newSockets.push(ws);
    });

    socketsRef.current = newSockets;

    return () => {
      newSockets.forEach((ws) => ws.close());
    };
  }, [instrument, expiry, strike, optionType, contactName]);

  useEffect(() => {
    if (!strike && !optionType) return;
    handleGetToken()
  }, [optionType])



  const handleGetToken = async () => {
    if (!instrument || !expiry || !strike || !optionType) return;
    const payload = {
      options: [
        {
          name: instrument === 'Nifty Bank' ? 'BANKNIFTY' : instrument,
          expiry: expiry,
          option_type: optionType,
          strike: parseFloat(strike)
        }
      ]
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}ManualTrade/gettoken/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {

        if (result?.results?.length > 0) {
          setContactName(result.results[0].tradingsymbol || "");
          setInstrumentKey(result.results[0].instrument_key || "");
        }
      } else {
        alert("❌ Failed to Tracking.");
      }
    } catch (error) {
      console.error("API error:", error);
      alert("❌ Error occurred during Tracking List.");
    }
  };
  const handleBuy = async () => {

    const funds = JSON.parse(localStorage.getItem("funds") || "[]");
    if (funds.length === 0) return;

    let allSuccess = null; // track if all orders succeeded
    let message = '';

    for (const fund of funds) {
      const jsonData = {
      quantity: fund?.manualTradeQuantity,
        instrument_token: instrumentKey,
        access_token: realTrade ? fund.token : fund.sandbox_token,
        total_amount: fund?.funds,
        investable_amount: fund?.investable_amount,
      };

      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}ManualTrade/api/place-upstox-order-buy/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
          }
        );
        const result = await response.json();

        if (response.ok) {
          setLockedBuyLtp(true);
          setOrderId(result.order_id);
          setOrderPrice(result?.price);
          allSuccess = true;
          message = result?.message
        } else {
          allSuccess = false;
        }
      } catch (err) {
        allSuccess = false;
        console.error("❌ Buy API Error:", err);
      }
    }

    // ✅ Toast only once after the loop
    if (allSuccess) {
      toast.success(message);
    } else {
      toast.error("❌ Failed to place one or more Buy orders.");
    }
  };



  // const handleSell = () => {
  //   const funds = JSON.parse(localStorage.getItem("funds") || "[]");
  //   if (funds.length === 0) return;


  //   funds.forEach(async (fund, index) => {
  //     const jsonData = {
  //       quantity: 70,
  //       instrument_token: instrumentKey,
  //       access_token: fund.sandbox_token,
  //       total_amount:fund?.funds,
  //       investable_amount:fund?.investable_amount,
  //     };
  //     const response = await fetch(`${process.env.REACT_APP_BASE_URL}ManualTrade/api/place-upstox-order-sell/`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify(jsonData)
  //     });
  //     const result = await response.json();
  //     if (response.ok) {
  //       console.log(result, "result");
  //       toast.success(result?.message)
  //     } else {
  //       alert("❌ Failed to Tracking.");
  //     }
  //   })
  // }
  const handleSell = () => {
    const funds = JSON.parse(localStorage.getItem("funds") || "[]");
    if (funds.length === 0) return;

    // 🔴 Close all active WebSocket connections before selling
    // Clear references

    funds.forEach(async (fund) => {
      const jsonData = {
        quantity: fund?.manualTradeQuantity,
        instrument_token: instrumentKey,
        access_token: realTrade ? fund.token : fund.sandbox_token,
        total_amount: fund?.funds,
        investable_amount: fund?.investable_amount,
      };

      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}ManualTrade/api/place-upstox-order-sell/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
          }
        );

        const result = await response.json();
        if (response.ok) {
          console.log(result, "result");
          toast.success(result?.message);
          setSellOrderPrice(result?.price);

          socketsRef.current.forEach((ws) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          });
          socketsRef.current = [];
        } else {
          toast.error("❌ Failed to place Sell order.");
        }
      } catch (error) {
        console.error("❌ Sell API Error:", error);
      }
    });
  };

  useEffect(() => {
    if (instrumentKey) {
      countLtp();
    }
  }, [instrumentKey]);

  const countLtp = async () => {
    const fund = JSON.parse(localStorage.getItem('funds'))
    const url = `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`;
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${fund[0]?.token}` // keep secure
    };

    try {
      const response = await axios.get(url, { headers });
      const data = response.data?.data;

      if (data) {
        const firstKey = Object.keys(data)[0];
        const lastPrice = data[firstKey]?.last_price;

        if (lotSizeState && lastPrice > 0) {
          calculateAndStoreQuantities(lastPrice, lotSizeState);
        } else {
          console.warn("Missing lotSizeState or invalid LTP.");
        }

      } else {
        console.error('No data returned from LTP API');
      }
    } catch (error) {
      console.error('Error fetching LTP:', error.response?.data || error.message);
    }
  };



  function calculateAndStoreQuantities(ltp, lotSize) {
    if (!ltp || !lotSize || ltp <= 0) {
      console.error("Invalid LTP or lotSize");
      return;
    }

    const fundsRaw = localStorage.getItem("funds");
    if (!fundsRaw) {
      console.error("No funds found in localStorage");
      return;
    }

    let funds;
    try {
      funds = JSON.parse(fundsRaw);
    } catch (e) {
      console.error("Failed to parse funds JSON:", e);
      return;
    }

    const updatedFunds = funds.map((fund, index) => {
      const investableAmount = realTrade ? parseFloat(fund?.investable_amount) : parseFloat(fund?.invest_amount);

      if (isNaN(investableAmount) || investableAmount <= 0) {
        console.warn(
          `[${fund.name}] Invalid investableAmount for fund at index ${index}`
        );
        return { ...fund, manualTradeQuantity: 0 }; // ❌ Always reset to 0 if invalid
      }
      console.log(
        `[${fund.name}] ➤ LTP: ${ltp}, LotSize: ${lotSize}, Investable: ${investableAmount}`
      );
      const costPerLot = ltp * lotSize;
      const numberOfLots = costPerLot > 0 ? Math.floor(investableAmount / costPerLot) : 0;
      const quantity = numberOfLots * lotSize;
      console.log(investableAmount / (ltp * lotSize), 'numberOfLots');

      console.log(
        `[${fund.name}] ➤ LTP: ${ltp}, LotSize: ${lotSize}, Investable: ${investableAmount}, Quantity: ${quantity}`
      );

      return {
        ...fund,
        manualTradeQuantity: quantity
      };
    });

    localStorage.setItem("funds", JSON.stringify(updatedFunds));
    console.log("✅ Updated funds with manualTradeQuantity:", updatedFunds);
  }


  // console.log(buyLtp, "buyLtp");
  // function calculateAndStoreQuantities(ltp, lotSize) {
  //   if (!ltp || !lotSize || ltp <= 0) {
  //     console.error("Invalid LTP or lotSize");
  //     return;
  //   }

  //   const fundsRaw = localStorage.getItem("funds");
  //   if (!fundsRaw) {
  //     console.error("No funds found in localStorage");
  //     return;
  //   }

  //   let funds;
  //   try {
  //     funds = JSON.parse(fundsRaw);
  //   } catch (e) {
  //     console.error("Failed to parse funds JSON:", e);
  //     return;
  //   }

  //   const updatedFunds = funds.map((fund, index) => {
  //     const investableAmount = parseFloat(fund.invest_amount);

  //     if (!investableAmount || investableAmount <= 0) {
  //       console.warn(`Invalid investableAmount for fund at index ${index}`);
  //       return { ...fund, manualTradeQuantity: 0 };
  //     }

  //     const numberOfLots = Math.floor(investableAmount / (ltp * lotSize));
  //     const quantity = numberOfLots * lotSize;

  //     console.log(`[${fund.name}] ➤ LTP: ${ltp}, LotSize: ${lotSize}, Investable: ${investableAmount}, Quantity: ${quantity}`);

  //     return {
  //       ...fund,
  //       manualTradeQuantity: quantity
  //     };
  //   });

  //   localStorage.setItem("funds", JSON.stringify(updatedFunds));
  //   console.log("✅ Updated funds with manualTradeQuantity saved.");
  // }

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6 w-full mx-auto">
        <h2 className="text-lg font-semibold mb-4">Manual Trade Setup</h2>
        <div className=" gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Configure Trade</label>
          <div
            onClick={() => setRealTrade(!realTrade)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${realTrade ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${realTrade ? 'left-[1.50rem]' : 'left-1'}`}
            />
          </div>
          <p className='my-2'>
            If this configure trade is set to <strong>"ON"</strong>, it will make a real trade.
            If it is set to <strong>"OFF"</strong>, the trade will be a dry run.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Underlying</label>
            <select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            >
              <option value="CE">Call (CE)</option>
              <option value="PE">Put (PE)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Instrument</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            >
              <option value="Nifty Bank">Bank Nifty</option>
              <option value="NIFTY">Nifty</option>
              <option value="FINNIFTY">Fin Nifty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of expiry</label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lot Size</label>
            <input
              type="number"
              value={lotSizeState}
              onChange={(e) => { setLotSizeState(e.target.value) }}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Strike Price</label>
            <input
              type="text"
              onBlur={handleGetToken}
              value={strike}
              onChange={(e) => setStrike(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700">Contract Name</label>
            <input
              type="text"
              value={instrumentKey}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              readOnly
            />
          </div>


          <div className="flex gap-1">
            <button onClick={handleBuy} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Buy
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={handleSell}>Sell</button>
          </div>
        </div>
      </div>

      {socketData?.ltp && (
        <>
          <ManualTradeTable sellOrderPrice={sellOrderPrice} setLockedBuyLtp={setLockedBuyLtp} setBuyLtp={setBuyLtp} OrderPrice={OrderPrice} buyLtp={buyLtp} lockedBuyLtp={lockedBuyLtp} expiry={expiry} optionType={optionType} instrument={instrument} handleSell={handleSell} />
          <MarketWatchManual />
        </>
      )}
    </div>
  );
};

export default ManualTradeUI;



