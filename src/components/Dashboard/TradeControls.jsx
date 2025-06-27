import React, { useEffect, useState } from "react";

const TradeTable = () => {
  const [data, setData] = useState([
    {
      type: "Call",
      instrument: "NIFTY",
      strikePrice: "-",
      targetMarket: 18725.25,
      currentMarket: 18725.25,
      lotSize: "-",
      ltpLocked: "VL",
      status: "-",
      pl: "-",
      active: true,
    },
    {
      type: "Put",
      instrument: "NIFTY",
      strikePrice: "-",
      targetMarket: 18725.25,
      currentMarket: 18725.25,
      lotSize: "-",
      ltpLocked: "VL",
      status: "-",
      pl: "-",
      active: true,
    },
  ]);

  // Update currentMarket every second
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) =>
        prevData.map((row) => ({
          ...row,
          currentMarket: (parseFloat(row.currentMarket) + (Math.random() * 2 - 1)).toFixed(2),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200 overflow-x-auto w-[1400px] ml-4">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Instrument</th>
            <th className="px-4 py-2">Strike Price</th>
            <th className="px-4 py-2">Target Market</th>
            <th className="px-4 py-2">Current Market</th>
            <th className="px-4 py-2">Lot Size</th>
            <th className="px-4 py-2">LTP Locked</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">P/L %</th>
            <th className="px-4 py-2">Active</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="text-gray-800">
          {data.map((row, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{row.type}</td>
              <td className="px-4 py-2">{row.instrument}</td>
              <td className="px-4 py-2">{row.strikePrice}</td>
              <td className="px-4 py-2">{row.targetMarket}</td>
              <td className="px-4 py-2">{row.currentMarket}</td>
              <td className="px-4 py-2">{row.lotSize}</td>
              <td className="px-4 py-2">{row.ltpLocked}</td>
              <td className="px-4 py-2">{row.status}</td>
              <td className="px-4 py-2">{row.pl}</td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={() => {
                    const updated = [...data];
                    updated[index].active = !updated[index].active;
                    setData(updated);
                  }}
                  className="accent-blue-500"
                />
              </td>
              <td className="px-4 py-2">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
                  Buy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeTable;