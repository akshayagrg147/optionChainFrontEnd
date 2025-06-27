import React, { useEffect, useState } from "react";
import dummyMarketData from "../../data/dummyMarketData";

const MarketTable = () => {
  const [marketData, setMarketData] = useState(dummyMarketData);
  const [selectedDate, setSelectedDate] = useState("2025-06-26");

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = marketData.map((row) => ({
        ...row,
        callPrice: (parseFloat(row.callPrice) + Math.random() * 2 - 1).toFixed(2),
        putPrice: (parseFloat(row.putPrice) + Math.random() * 2 - 1).toFixed(2),
        callVolume: row.callVolume + Math.floor(Math.random() * 20 - 10),
        putVolume: row.putVolume + Math.floor(Math.random() * 20 - 10),
      }));
      setMarketData(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [marketData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    
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
          value={selectedDate}
          onChange={handleDateChange}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        />
      </div>

     
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 w-[1400px]">
        <h3 className="text-lg font-semibold mb-4">Market Watch</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-2">Strike Price</th>
                <th className="px-4 py-2">Call Price</th>
                <th className="px-4 py-2">Call Volume</th>
                <th className="px-4 py-2">Put Price</th>
                <th className="px-4 py-2">Put Volume</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-medium">{row.strike}</td>
                  <td className="px-4 py-2 text-green-600">{row.callPrice}</td>
                  <td className="px-4 py-2">{row.callVolume}</td>
                  <td className="px-4 py-2 text-red-600">{row.putPrice}</td>
                  <td className="px-4 py-2">{row.putVolume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketTable;
