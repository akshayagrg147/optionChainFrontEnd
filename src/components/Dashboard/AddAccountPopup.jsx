// components/AddAccountPopup.tsx
import React, { useState } from 'react';

const AddAccountPopup = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    funds: '',
    invest_amount: '',
    percentage: '',
    investable_amount: '',
    call_lot: '',
    put_lot: '',
    token:''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}fund-instrument/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: Date.now() })
      });
      const data = await response.json();
      onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">Add New Account</h2>

        {["name", "funds", "invest_amount", "percentage", "investable_amount", "call_lot", "put_lot",'token'].map((key) => (
          <div key={key} className="mb-3">
            <label className="block text-xs mb-1 capitalize">{key.replace('_', ' ')}</label>
            <input
              type="text"
              name={key}
              value={form[key]}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
        ))}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="bg-gray-300 px-4 py-1 text-sm rounded hover:bg-gray-400">Cancel</button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddAccountPopup;