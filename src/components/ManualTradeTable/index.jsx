import React, { useEffect, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useManualWebSocketData } from "../../ManualWebSocketContext";

const ManualTradeTable = ({ expiry, optionType, instrument, handleSell, OrderPrice, lockedBuyLtp, setLockedBuyLtp, buyLtp, setBuyLtp }) => {
  // console.log(buyLtp, "buyLtpasd");

  const [reverseTrade, setReverseTrade] = useState(false);
  const { socketData } = useManualWebSocketData();
  const [rtpValue, setRtpValue] = useState("");
  const [data, setData] = useState([
    {
      type: "CALL",
      instrument: instrument,
      strikePrice: socketData?.strike,
      dateOfContract: expiry,
      targetMarketCE: 23000,
      targetMarketPE: 0,
      currentMarket: socketData?.spot_price,
      lotSize: 50,
      ltpLocked: 1.32,
      status: "Inactive",
      pl: 0,
      buyInLTP: buyLtp,
      liveInLTP: socketData?.ltp,
      active: false,
    },
    {
      type: "PUT",
      instrument: instrument,
      strikePrice: socketData?.strike,
      dateOfContract: expiry,
      targetMarketCE: 0,
      targetMarketPE: 48000,
      currentMarket: socketData?.spot_price,
      lotSize: 25,
      ltpLocked: "Yes",
      status: "Inactive",
      pl: 0,
      buyInLTP: buyLtp,
      liveInLTP: socketData?.ltp,
      active: false,
    },
  ]);
  useEffect(() => {
    if (!buyLtp) return; // Prevents NaN or division by zero
    const LtpData = data.find((obj) => {
      if (obj.type === "CALL" && optionType === "CE") {
        return obj
      }
      if (obj.type === "PUT" && optionType === "PE") {
        return obj
      }
    })
    setData((prev) =>
      prev.map((item) => ({
        ...item,
        pl: buyLtp
          ? (100 * (LtpData?.liveInLTP - buyLtp) / buyLtp).toFixed(2)
          : 0
      }))
    );
    console.log((100 * (LtpData?.liveInLTP - buyLtp) / buyLtp),buyLtp,"(100 * (LtpData?.liveInLTP - buyLtp) / buyLtp)")
  }, [buyLtp, socketData.ltp, lockedBuyLtp]);

  useEffect(() => {
    if (!socketData?.type) return;

    setData((prevData) =>
      prevData.map((row) => {
        if (row.type === "CALL" && socketData.type === "CE") {
          return {
            ...row,
            strikePrice: socketData.strike,
            currentMarket: socketData.spot_price,
            liveInLTP: socketData.ltp,
          };
        } else if (row.type === "PUT" && socketData.type === "PE") {
          return {
            ...row,
            strikePrice: socketData.strike,
            currentMarket: socketData.spot_price,
            liveInLTP: socketData.ltp,
          };
        }
        return row;
      })
    );
  }, [socketData]);

  useEffect(() => {
    if (lockedBuyLtp) {
      const buyLtpData = data.find((obj) => {
        if (obj.type === "CALL" && optionType === "CE") {
          return obj
        }
        if (obj.type === "PUT" && optionType === "PE") {
          return obj
        }
      })
      console.log(buyLtpData, "buyLtpData");

      setBuyLtp(buyLtpData?.liveInLTP);
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          buyInLTP: buyLtpData?.liveInLTP
        }))
      );
      setLockedBuyLtp(false)
    }
  }, [lockedBuyLtp == true])

  return (
    <>
      <div className=" bg-white rounded-lg shadow border border-gray-200 overflow-x-auto h-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Instrument</th>
              <th className="px-4 py-2">Strike Price</th>
              <th className="px-4 py-2">Date Of Contract</th>
              <th className="px-4 py-2">Current Market</th>
              {/* <th className="px-4 py-2">Target Market</th> */}
              {/* <th className="px-4 py-2">Lot Size</th> */}
              {/* <th className="px-4 py-2">LTP Locked</th> */}
              {/* <th className="px-4 py-2">Status</th> */}
              <th className="px-4 py-2">P/L %</th>
              <th className="px-4 py-2">Buy In LTP</th>
              <th className="px-4 py-2">Live LTP</th>
              {/* <th className="px-4 py-2">Active</th> */}
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {data.filter((obj) => {
              if (obj.type === "CALL" && optionType === "CE") {
                return obj
              }
              if (obj.type === "PUT" && optionType === "PE") {
                return obj
              }
            }).map((row, index) => (
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
                      <option value="Nifty 50">Nifty 50</option>
                      <option value="Bank Nifty">Bank Nifty</option>
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
                {/* <td className="px-4 py-2">
                  {row.editMode ? (
                    <input
                      type="number"
                      className="w-24 px-2 py-1 border rounded"
                      value={row.type === "CALL" ? row.targetMarketCE : row.targetMarketPE}
                      onChange={(e) => {
                        const updated = [...data];
                        if (row.type === "CALL") {
                          updated[index].targetMarketCE = e.target.value;
                        } else {
                          updated[index].targetMarketPE = e.target.value;
                        }
                        setData(updated);
                      }}
                    />
                  ) : (
                    row.type === "CALL" ? row.targetMarketCE : row.targetMarketPE
                  )}
                </td> */}
                {/* <td className="px-4 py-2">
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
                </td> */}
                {/* <td className="px-4 py-2">{row.ltpLocked}</td> */}
                {/* <td className="px-4 py-2">
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
                </td> */}
                <td className="px-4 py-2">{row.pl}</td>
                <td className="px-4 py-2">{row.buyInLTP}</td>
                <td className="px-4 py-2 text-green-500">{row.liveInLTP}</td>
                {/* <td className="px-4 py-2">
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
                </td> */}
                <td className="px-4 py-2 flex gap-2 items-center">
                  {/* <button
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
                  </button> */}
                  {/* <Link to="/manual-trade"> */}
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleSell()}>
                    Square Off
                  </button>
                  {/* </Link> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </>
  );
};

export default ManualTradeTable;
