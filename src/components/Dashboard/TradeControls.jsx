import React, { useState, useEffect } from "react";
import { FaPencilAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useWebSocket } from "../../WebSocketContext";
import axios from "axios";


const TradeTable = ({ data, setData,rtpValue,setRtpValue,reverseTrade,setReverseTrade }) => {

  console.log(rtpValue, "data");


  // const [data, setData] = useState([
  //   {
  //     type: 'CALL',
  //     instrument: 'Nifty 50',
  //     strikePrice: 22500,
  //     dateOfContract: '2025-07-10',
  //     targetMarket: 23000,
  //     currentMarket: 22650,
  //     lotSize: 50,
  //     ltpLocked: 'No',
  //     status: 'Inactive',
  //     pl: '3.25%',
  //     buyInLTP: 102.5,
  //     liveInLTP: 26.5,
  //     active: false,
  //     editMode: false,
  //   },
  //   {
  //     type: 'PUT',
  //     instrument: 'Bank Nifty',
  //     strikePrice: 49000,
  //     dateOfContract: '2025-07-10',
  //     targetMarket: 48000,
  //     currentMarket: 49200,
  //     lotSize: 25,
  //     ltpLocked: 'Yes',
  //     status: 'Inactive',
  //     pl: '-2.15%',
  //     buyInLTP: 185.7,
  //     liveInLTP: 10.7,
  //     active: false,
  //     editMode: false,
  //   },
  // ]);
  // useEffect(() => {
  //   if (data?.length > 0) {
  //     handleGetToken();
  //   }
  // }, []);


  const { ceData, peData } = useWebSocket();

  useEffect(() => {
    if (!ceData && !peData) return;

    setData((prevData) =>
      prevData.map((item) => {
        if (item.editMode) return item;

        if (ceData && item.type === "CALL") {
          return { ...item, liveInLTP: ceData.ltp, strikePrice: ceData.strike, currentMarket: ceData.spot_price };
        }
        if (peData && item.type === "PUT") {
          return { ...item, liveInLTP: peData.ltp, strikePrice: peData.strike, currentMarket: peData.spot_price };
        }
        return item;
      })
    );
  }, [ceData, peData]);

  // const handleGetToken = async () => {
  //   const payload = {
  //     options: data.map((f) => ({
  //       name: f.instrument === 'Nifty Bank' ? 'BANKNIFTY' : f.instrument,
  //       expiry: f.dateOfContract,
  //       option_type: f.type === 'CALL' ? 'CE' : 'PE',
  //       strike: parseFloat(f.strikePrice),
  //     })),
  //   };

  //   try {
  //     const response = await fetch(`${process.env.REACT_APP_BASE_URL}ManualTrade/gettoken/`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     const result = await response.json();

  //     if (response.ok) {
  //       // Map response back to original data and update state
  //       // const updatedData = data.map((item) => {
  //       //   const matched = result.results.find(
  //       //     (res) =>
  //       //       res.name === item.instrument &&
  //       //       res.expiry === item.dateOfContract &&
  //       //       res.option_type === (item.type === 'CALL' ? 'CE' : 'PE') &&
  //       //       res.strike === parseFloat(item.strikePrice)
  //       //   );

  //       //   return matched
  //       //     ? {
  //       //         ...item,
  //       //         instrument_key: matched.instrument_key,
  //       //         trading_symbol: matched.tradingsymbol,
  //       //       }
  //       //     : item;
  //       // });
  //       const updatedData = data.map((item) => {
  //         const matched = result.results.find(
  //           (res) =>
  //             res.name === item.instrument &&
  //             res.expiry === item.dateOfContract &&
  //             res.option_type === (item.type === 'CALL' ? 'CE' : 'PE') &&
  //             res.strike === parseFloat(item.strikePrice)
  //         );

  //         if (matched) {
  //           // Call countLtp here with matched instrument_key
  //           countLtp(matched.instrument_key);

  //           return {
  //             ...item,
  //             instrument_key: matched.instrument_key,
  //             trading_symbol: matched.tradingsymbol,
  //           };
  //         }

  //         return item;
  //       });

  //       setData(updatedData);
  //     } else {
  //       alert('❌ Failed to track.');
  //     }
  //   } catch (error) {
  //     console.error('API error:', error);
  //     alert('❌ Error occurred during tracking.');
  //   }
  // };
  // const countLtp = async (instrument_key) => {
  //   const fundsData = JSON.parse(localStorage.getItem('funds'));
  //   console.log(fundsData,"fundsData");
    
  //   const url = `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrument_key}`;
  //   const headers = {
  //     'Accept': 'application/json',
  //     'Authorization': `Bearer ${fundsData[0]?.token}`
  //   };

  //   if (instrument_key) {
  //     try {
  //       const response = await axios.get(url, { headers });
  //       const data = response.data?.data;

  //       if (data) {
  //         // Extract the first key dynamically
  //         const firstKey = Object.keys(data)[0];
  //         const lastPrice = data[firstKey]?.last_price;
  //         calculateAndStoreQuantities(lastPrice)

  //       } else {
  //         console.error('No data returned');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching LTP:', error.response?.data || error.message);
  //     }
  //   }
  // };

  // function calculateAndStoreQuantities(ltp) {
  //   if (!ltp || ltp <= 0) {
  //     console.error("Invalid LTP");
  //     return;
  //   }

  //   const fundsRaw = localStorage.getItem("funds");
  //   if (!fundsRaw) {
  //     console.error("No funds found in localStorage");
  //     return;
  //   }

  //   const funds = JSON.parse(fundsRaw);

  //   const updatedFunds = funds.map((fund, index) => {
  //     const investableAmount = parseInt(fund.funds);
  //     const lotSize = parseInt(fund.call_lot) + parseInt(fund.put_lot)
  //     // const lotSize = parseInt(fund.lotSize);

  //     if (!investableAmount || !lotSize) {
  //       console.error(`Invalid fund at index ${index}`);
  //       return { ...fund, call_quantity: 0,put_quantity:0 };
  //     }

  //     const numberOfLots = Math.floor(investableAmount / (ltp * lotSize));
  //     const quantity = numberOfLots * lotSize;

  //     return {
  //       ...fund,
  //       call_quantity: quantity,
  //       put_quantity: quantity
  //     };
  //   });

  //   // Save updated funds back to localStorage
  //   localStorage.setItem("funds", JSON.stringify(updatedFunds));
  //   console.log("Updated funds with manualTradeQuantity saved to localStorage.");
  // }
  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow border border-gray-200 overflow-x-auto ml-4 h-auto">
        <div className="overflow-y-auto h-full">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Instrument</th>
                <th className="px-4 py-2">Strike Price</th>
                <th className="px-4 py-2">Date Of Contract</th>
                <th className="px-4 py-2">Current Market</th>
                <th className="px-4 py-2">Target Market</th>
                <th className="px-4 py-2">Lot Size</th>
                <th className="px-4 py-2">LTP Locked</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">P/L %</th>
                <th className="px-4 py-2">Buy In LTP</th>
                <th className="px-4 py-2">Live LTP</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {data.map((row, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{row.type}</td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <select
                        className="px-2 py-1 border rounded"
                        value={row.instrument}
                        onChange={(e) => {
                          const updated = [...data];
                          updated[index].instrument = e.target.value;
                          setData(updated);
                        }}
                      >
                        <option value="Nifty Bank">Bank Nifty</option>
                        <option value="NIFTY">Nifty</option>
                        <option value="FINNIFTY">Fin Nifty</option>
                      </select>
                    ) : (
                      row.instrument
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border rounded"
                        value={row.strikePrice}
                        onChange={(e) => {
                          const updated = [...data];
                          updated[index].strikePrice = e.target.value;
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.strikePrice
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <input
                        type="date"
                        className="px-2 py-1 border rounded"
                        value={row.dateOfContract}
                        onChange={(e) => {
                          const updated = [...data];
                          updated[index].dateOfContract = e.target.value;
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.dateOfContract
                    )}
                  </td>
                  <td className="px-4 py-2">{row.currentMarket}</td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border rounded"
                        value={row.type === "CALL" ? row.targetMarketCE : row.targetMarketPE}
                        onChange={(e) => {
                          const updated = [...data];
                          if (row.type === "CALL") {
                            updated[index].targetMarketCE = Number(e.target.value);
                          } else {
                            updated[index].targetMarketPE = Number(e.target.value);
                          }
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.type === "CALL" ? row.targetMarketCE : row.targetMarketPE
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={row.lotSize}
                        onChange={(e) => {
                          const updated = [...data];
                          updated[index].lotSize = e.target.value;
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.lotSize
                    )}
                  </td>
                  <td className="px-4 py-2">{row.ltpLocked}</td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <select
                        className="px-2 py-1 border rounded"
                        value={row.status}
                        onChange={(e) => {
                          const updated = [...data];
                          updated[index].status = e.target.value;
                          setData(updated);
                        }}
                      >
                        <option value="Inactive">Inactive</option>
                        <option value="Vigilant">Vigilant</option>
                        <option value="Waiting for Square-Off">Waiting for Square-Off</option>
                      </select>
                    ) : (
                      row.status
                    )}
                  </td>
                  <td className="px-4 py-2">{row.pl}</td>
                  <td className="px-4 py-2">{row.buyInLTP}</td>
                  <td className="px-4 py-2 text-green-500">{row.liveInLTP}</td>
                  <td className="px-4 py-2">
                    <div
                      onClick={() => {
                        const updated = [...data];
                        updated[index].active = !updated[index].active;
                        setData(updated);
                      }}
                      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${row.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${row.active ? 'left-[1.50rem]' : 'left-1'}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <button
                      className={`text-blue-500 hover:text-blue-700 ${row.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (row.active) return;
                        const updated = [...data];
                        updated[index].editMode = !updated[index].editMode;
                        setData(updated);
                      }}
                      disabled={row.active}
                    >
                      <FaPencilAlt />
                    </button>
                    <Link to="/manual-trade">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
                        Buy / Sell
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-6 bg-white p-4 rounded shadow w-full ml-4 mt-4">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reverse Trade</label>
          <div
            onClick={() => setReverseTrade(!reverseTrade)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${reverseTrade ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${reverseTrade ? 'left-[1.50rem]' : 'left-1'}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">RTP Value</label>
          <input
            type="number"
            value={rtpValue}
            onChange={(e) => setRtpValue(e.target.value)}
            className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 w-64"
            placeholder="Enter RTP"
          />
        </div>
      </div>
    </>
  );
};

export default TradeTable;

