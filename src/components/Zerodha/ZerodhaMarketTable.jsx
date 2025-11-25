import React, { useState } from "react";
import { useWebSocket } from "../../WebSocketContext";
import { useZerodhaWebSocket } from "../../ZerodhaWebSocketContext";

const ZerodhaMarketTable = ({data}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { ceData, peData } = useZerodhaWebSocket();

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label htmlFor="contract-date" className="font-medium text-sm">
          Select Date of Contract:
        </label>
        <input
          type="date"
          id="contract-date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={handleDateChange}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 w-full">
        <h3 className="text-lg font-semibold mb-4">Market Watch</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Current Market</th>
                <th className="px-4 py-2">LTP</th>
              </tr>
            </thead>
            <tbody>
              {ceData && (
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">CALL</td>
                  <td className="px-4 py-2 font-medium">{ceData.spot_price}</td>
                  <td className="px-4 py-2 text-green-600">{ceData.ltp}</td>
                </tr>
              )}
              {peData && (
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">PUT</td>
                  <td className="px-4 py-2 font-medium">{peData.spot_price}</td>
                  <td className="px-4 py-2 text-green-600">{peData.ltp}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ZerodhaMarketTable;
