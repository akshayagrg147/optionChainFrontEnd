import React, { useEffect, useState } from "react";
import { useManualWebSocketData } from "../../ManualWebSocketContext";

const MarketWatchManual = () => {
  const { socketData } = useManualWebSocketData();

  const [data, setData] = useState([
    {
      type: "Call",
      strike: 51400,
      ltp: 102.5,
    },
    {
      type: "PUT",
      strike: 51400,
      ltp: 102.5,
    },
  ]);

  useEffect(() => {
    if (!socketData?.type) return;

    setData((prevData) =>
      prevData.map((row) => {
        if (row.type === "Call" && socketData.type === "CE") {
          return {
            ...row,
            strike: socketData?.strike,
            ltp: socketData?.ltp,
          };
        } else if (row.type === "PUT" && socketData.type === "PE") {
          return {
            ...row,
            strike: socketData?.strike,
            ltp: socketData?.ltp,
          };
        }
        return row;
      })
    );
  }, [socketData]);

  return (
    <div className="w-full">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 w-full">
        <h3 className="text-lg font-semibold mb-4">Market Watch</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Strike Price</th>
                <th className="px-4 py-2">LTP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-2 font-medium">{f.type}</td>
                  <td className="px-4 py-2 font-medium">{f.strike}</td>
                  <td className="px-4 py-2 text-green-600">{f.ltp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketWatchManual;
