import React, { useState, useEffect } from "react";
import { FaPencilAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useWebSocket } from "../../WebSocketContext";
import axios from "axios";


const TradeTable = ({ data, setData, rtpValue, setRtpValue, reverseTrade, setReverseTrade, spreadSize, setSpreadSize }) => {

  // useEffect(() => {
  //   if (data.length === 0) return;

  //   // Only run when all editMode are false
  //   const anyEditing = data.some(d => d.editMode);
  //   if (anyEditing) return;

  //   handleGetToken();
  // }, [
  //   JSON.stringify(
  //     data.map(d => ({
  //       instrument: d.instrument,
  //       strikePrice: d.strikePrice,
  //       dateOfContract: d.dateOfContract,
  //       type: d.type,
  //       editMode: d.editMode    // <-- Added
  //     }))
  //   )
  // ]);
  useEffect(() => {
    if (data.length === 0) return;

    // 🚫 Stop if any row is being edited
    const anyEditing = data.some(d => d.editMode);
    if (anyEditing) return;

    // 🚫 Stop if any row is active
    const anyActive = data.some(d => d.active);
    if (anyActive) return;
    console.log('Fetching tokens as no rows are being edited or active');
    // ✅ Run only when no editMode and no active rows
    const interval = setInterval(() => {
      handleGetToken();
    }, 60000);
    return () => clearInterval(interval);
  }, [
    JSON.stringify(
      data.map(d => ({
        instrument: d.instrument,
        strikePrice: d.strikePrice,
        dateOfContract: d.dateOfContract,
        type: d.type,
        editMode: d.editMode,
        // active: d.active,   // <-- added to trigger when active changes
      }))
    )
  ]);
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

  const handleGetToken = async () => {
    const payload = {
      options: data.map((f) => ({
        name: f.instrument === 'Nifty Bank' ? 'BANKNIFTY' : f.instrument,
        expiry: f.dateOfContract,
        option_type: f.type === 'CALL' ? 'CE' : 'PE',
        strike: parseFloat(f.strikePrice),
      })),
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}ManualTrade/gettoken/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(result, 'result');

        // const tempData = data.map((item) => {
        //   const matched = result.results.find(
        //     (res) =>
        //       res.name === item.instrument &&
        //       res.expiry === item.dateOfContract &&
        //       res.option_type === (item.type === 'CALL' ? 'CE' : 'PE') &&
        //       res.strike === parseFloat(item.strikePrice)
        //   );

        //   if (matched) {
        //     // Pass type explicitly: CALL or PUT
        //     countLtp(matched.instrument_key, item.type);

        //     const isCE = matched.tradingsymbol.endsWith('CE');
        //     const isPE = matched.tradingsymbol.endsWith('PE');
        //     console.log(matched, "isCE");

        //     return {
        //       ...item,
        //       instrument_key: matched.instrument_key,
        //       ...(isCE ? { trading_symbol: matched.tradingsymbol, trading_symbol_2: matched.tradingsymbol } : {}),
        //       ...(isPE ? { trading_symbol_2: matched.tradingsymbol } : {}),
        //     };
        //   }

        //   return item;
        // });

        const tempData = data.map((item) => {
          const matched = result.results.find(
            (res) =>
              // res.name === item.instrument &&
              res.expiry === item.dateOfContract &&
              res.option_type === (item.type === "CALL" ? "CE" : "PE") &&
              res.strike === parseFloat(item.strikePrice)
          );

          if (matched) {
            countLtp(matched.instrument_key, item.type);

            return {
              ...item,
              instrument_key: matched.instrument_key,
              trading_symbol:
                matched.tradingsymbol.endsWith("CE")
                  ? matched.tradingsymbol
                  : item?.trading_symbol, // keep CE if already set
              trading_symbol_2:
                matched.tradingsymbol.endsWith("PE")
                  ? matched.tradingsymbol
                  : item.trading_symbol_2, // keep PE if already set
            };
          }

          return item;
        });
        console.log(tempData, 'tempData');

        setData(tempData);
      } else {
        alert('❌ Failed to track.');
      }
    } catch (error) {
      console.error('API error:', error);
      alert('❌ Error occurred during tracking.');
    }
  };

  // ✅ countLtp now accepts type
  const countLtp = async (instrument_key, type) => {
    const fundsData = JSON.parse(localStorage.getItem('funds'));
    console.log(fundsData, 'fundsData');

    const url = `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrument_key}`;
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${fundsData[0]?.token}`,
    };

    if (instrument_key) {
      try {
        const response = await axios.get(url, { headers });
        const data = response.data?.data;

        if (data) {
          const firstKey = Object.keys(data)[0];
          const lastPrice = data[firstKey]?.last_price;

          if (lastPrice) {
            calculateAndStoreQuantities(lastPrice, type);
          }
        } else {
          console.error('No data returned');
        }
      } catch (error) {
        console.error(
          'Error fetching LTP:',
          error.response?.data || error.message
        );
      }
    }
  };

  // ✅ Separate call and put calculation
  function calculateAndStoreQuantities(ltp, type) {
    console.log(type, "type");

    if (!ltp || ltp <= 0) {
      console.error('Invalid LTP');
      return;
    }

    const fundsRaw = localStorage.getItem('funds');
    if (!fundsRaw) {
      console.error('No funds found in localStorage');
      return;
    }

    const funds = JSON.parse(fundsRaw);

    const updatedFunds = funds.map((fund, index) => {
      const investableAmount = parseInt(fund.investable_amount);
      const lotSize = parseInt(data[index]?.lotSize); // use correct lotSize per instrument
      console.log(lotSize, "lotSize");

      if (!investableAmount || !lotSize) {
        console.error(`Invalid fund at index ${index}`);
        return { ...fund };
      }
      console.log(investableAmount / (ltp * lotSize), "investableAmount");

      const numberOfLots = Math.floor(investableAmount / (ltp * lotSize * 1.015));
      const quantity = numberOfLots * lotSize;

      console.log(
        `${type} => LTP: ${ltp}, Lots: ${numberOfLots}, Qty: ${quantity}`
      );

      if (type === 'CALL') {
        return { ...fund, call_quantity: Math.round(quantity), call_lot: lotSize };
      } else if (type === 'PUT') {
        return { ...fund, put_quantity: Math.round(quantity), put_lot: lotSize };
      } else {
        return { ...fund };
      }
    });

    localStorage.setItem('funds', JSON.stringify(updatedFunds));
    console.log('Updated funds saved with LTP calculation.');
  }

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
            </thead>   <tbody className="text-gray-800">
              {data.map((row, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{row.type}</td>
                  <td className="px-4 py-2">
                    {row.editMode ? (
                      <select
                        className="px-2 py-1 border rounded"
                        value={row.instrument}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const updated = data.map((item, i) => {
                            // Apply the change to all rows with same instrument
                            if (item.instrument === row.instrument) {
                              return { ...item, instrument: newValue };
                            }
                            return item;
                          });
                          setData(updated);
                        }}
                      >
                        <option value="Nifty Bank">Bank Nifty</option>
                        <option value="NIFTY">Nifty</option>
                        <option value="FINNIFTY">Fin Nifty</option>
                        <option value="MIDCPNIFTY">MIDCPNIFTY</option>
                        <option value="SENSEX">SENSEX</option>
                        <option value="BANKEX">BANKEX</option>
                        <option value="SX50">SX50</option>
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
                          // const newValue = e.target.value;
                          // const updated = data.map((item, i) => {
                          //   // Apply the change to all rows with same instrument
                          //   if (item.strikePrice === row.strikePrice) {
                          //     return { ...item, strikePrice: newValue };
                          //   }
                          //   return item;
                          // });
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
                          const newValue = e.target.value;
                          const updated = data.map((item, i) => {
                            // Apply the change to all rows with same instrument
                            if (item.dateOfContract === row.dateOfContract) {
                              return { ...item, dateOfContract: newValue };
                            }
                            return item;
                          });
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
                          const newValue = e.target.value;
                          const updated = data.map((item, i) => {
                            // Apply the change to all rows with same instrument
                            if (item.lotSize === row.lotSize) {
                              return { ...item, lotSize: newValue };
                            }
                            return item;
                          });
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.lotSize
                    )}
                  </td>
                  <td className="px-4 py-2">{row.ltpLocked}</td>
                  <td className="px-4 py-2">
                    {/* {row.editMode ? (
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
                    )} */}
                    {row.status}
                  </td>
                  <td className="px-4 py-2">{row.pl}</td>
                  <td className="px-4 py-2">{row.buyInLTP}</td>
                  <td className="px-4 py-2 text-green-500">{row.liveInLTP}</td>
                  {/* <td className="px-4 py-2" rowSpan={2}>
                    {index == 0 && (
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
                      </div>)}
                  </td>
                  <td className="px-4 py-2 flex gap-2 items-center" rowSpan={2}>
                    {index === 0 && (
                      <button
                        className={`text-blue-500 hover:text-blue-700 ${row.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (row.active) return;

                          // 🔄 Toggle editMode for ALL rows based on first one
                          const allEdit = data[0].editMode;
                          const updated = data.map(item => ({
                            ...item,
                            editMode: !allEdit,
                          }));
                          setData(updated);
                        }}
                        disabled={row.active}
                      >
                        <FaPencilAlt />
                      </button>
                    )}
                  </td> */}
                  <td
                    className="px-4 py-2 text-center align-middle "
                    rowSpan={2}
                  >
                    {index === 0 && (
                      <div
                        onClick={() => {
                          const allActive = data.some((d) => d.active);
                          const updated = data.map((item) => ({
                            ...item,
                            active: !allActive,
                          }));
                          setData(updated);
                        }}
                        className={`w-12 h-6 mx-auto rounded-full relative cursor-pointer transition-colors duration-300 ${data.some((d) => d.active) ? "bg-blue-500" : "bg-gray-300"
                          }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${data.some((d) => d.active) ? "left-[1.60rem]" : "left-1"
                            }`}
                        />
                      </div>
                    )}
                  </td>

                  {index === 0 && (
                    <td
                      className="px-4 py-2 text-center align-middle gap-2 items-center "
                      rowSpan={2}
                    >
                      <button
                        className={`text-blue-500 hover:text-blue-700 ${data.some((d) => d.active) ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() => {
                          if (data.some((d) => d.active)) return;

                          const allEdit = data[0].editMode;
                          const updated = data.map((item) => ({
                            ...item,
                            editMode: !allEdit,
                          }));
                          setData(updated);
                        }}
                        disabled={data.some((d) => d.active)}
                      >
                        <FaPencilAlt size={16} />
                      </button>
                    </td>
                  )}

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
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">SPREAD Size</label>
          <input
            type="text"
            value={spreadSize}
            onChange={(e) => setSpreadSize(e.target.value)}
            className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 w-64"
            placeholder="Enter RTP"
          />
        </div>
      </div>
    </>
  );
};

export default TradeTable;

