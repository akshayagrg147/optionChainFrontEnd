import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const ExcelUploadPopup = ({ isOpen, onClose, accounts, fetchAccounts }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
    } else {
      alert('Only Excel (.xlsx) files are allowed!');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(30);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      setProgress(70);
      console.log(jsonData, "jsonData");

      try {
        for (const row of jsonData) {
          const excel_data = {
            name: row?.name,
            funds: row?.fund || 0,
            invest_amount: row["Investment Amount"] || 0,
            percentage: row.Percentage,
            investable_amount: row["Investable Amount"] || 0,
            call_lot: row["Call Lot"] || 0,
            put_lot: row["Put Lot"] || 0,
            token: row["token"],
            sandbox_token: row["sandboxToken"],
            zerodha_token: row["zerodha Token"],
            api_key: row["zerodha Api Key"],
            type:row['app type']
          };

          await axios.post(`${process.env.REACT_APP_BASE_URL}fund-instrument/`, excel_data, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access-token")}`
            }
          });
        }

        setProgress(100);
        setTimeout(() => {
          toast.success('Upload Successful');
          fetchAccounts(); // refresh data
          resetAll();
          onClose();
        }, 800);

      } catch (err) {
        console.error(err);
        toast.error('Upload failed');
        resetAll();
        onClose();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const resetAll = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
  };

  const getProgressColor = () => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-yellow-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
        <h2 className="text-lg font-bold mb-4">Upload Excel File</h2>

        {/* Hidden input for manual upload */}
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Drag Drop + Click Zone */}
        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="w-full h-32 border-2 border-dashed border-gray-400 rounded flex items-center justify-center text-gray-500 mb-4 cursor-pointer"
        >
          {file ? 'File Ready: Click to Change' : 'Click or Drag & Drop Excel File Here'}
        </div>

        {/* File Info */}
        {file && (
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2">
            <span className="text-sm truncate max-w-[80%]">{file.name}</span>
            <button className="text-red-600 font-bold" onClick={() => setFile(null)}>✕</button>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded h-3 mb-4 overflow-hidden">
            <div
              className={`h-3 rounded transition-all duration-700 ease-in-out ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadPopup;
