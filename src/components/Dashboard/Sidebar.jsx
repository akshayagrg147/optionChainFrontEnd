import React, { useState } from "react";

const Sidebar = () => {
  const [demoAccounts, setDemoAccounts] = useState([]);

  const handleAddAccount = () => {
    const newId = demoAccounts.length + 1;
    setDemoAccounts([
      ...demoAccounts,
      { id: newId, balance: 100000 },
    ]);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Active Accounts</h2>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Main Account</span>
        <span className="text-green-500 font-semibold">₹5,00,000</span>
      </div>

      <div className="mb-4">
        <label className="text-xs block mb-1">Investment Amount</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
          placeholder="Enter Amount"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs block mb-1">Percentage</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
          placeholder="Enter 0-100"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs block mb-1">Investable Amount</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-100"
          value="₹2,50,000"
          readOnly
        />
      </div>

      <div className="mb-4">
        <label className="text-xs block mb-1">Number of Lot</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
            placeholder="Call"
          />
          <input
            type="text"
            className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
            placeholder="Put"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {/* Fixed Demo Account */}
        <div className="text-sm mb-2">
          <span className="text-yellow-500">●</span> Demo Account – ₹1,00,000
        </div>

        {/* Fixed Trading Account */}
        <div className="text-sm mb-2">
          <span className="text-red-500">●</span> Trading Account – ₹2,50,000
        </div>

        {/* Dynamic Demo Accounts */}
        {demoAccounts.map((acc, index) => (
          <div key={acc.id} className="text-sm mb-2">
            <span className="text-yellow-500">●</span> Demo {index + 1} – ₹{acc.balance.toLocaleString()}
          </div>
        ))}

        <button
          onClick={handleAddAccount}
          className="w-full bg-blue-600 text-white rounded-md py-1 text-sm hover:bg-blue-700 mt-2"
        >
          + Add Account
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
