import { useEffect, useRef, useState } from "react";
import { FaCaretUp, FaSortDown, FaTrash } from "react-icons/fa";
import { FaUpload } from "react-icons/fa6";
import ExcelUploadPopup from "../ExcelUploadPopup";

import axios from "axios";
import { toast } from "react-toastify";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import AddAccountPopup from "../Dashboard/AddAccountPopup";

const ZerodhaSidebar = () => {
  const [accounts, setAccounts] = useState([]);
  const [accordionOpen, setAccordionOpen] = useState({});
  const [applyValue, setApplyValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [addAccountPopup, setAddAccountPopup] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetchAccounts().then(fundCheck);

    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (event) => {
      if (event.key === 'funds') {
        const updatedFunds = JSON.parse(event.newValue || '[]');
        setAccounts((prev) =>
          prev.map((acc) => {
            const matched = updatedFunds.find((f) => f.name === acc.name);
            return matched ? { ...acc, status: matched.status || acc.status } : acc;
          })
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BASE_URL}fund-instrument/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access-token')}`,
        },
      });

      if (res.data.length === 0) {
        setIsOpenPopup(true);
      } else {

        const fundsData = res.data.map((f, i) => ({
          id: i + 1,
          name: f.name,
          token: f.token,
          lotSize: '',
          invest_amount: '',
          percentage: parseInt(f?.percentage),
          sandBoxToken: f['sanbox token'],
          status: 'Pending',
          zerodha_token: f.zerodha_token,
          api_key: f.api_key
        }));
        console.log(fundsData, "res.data");
        
        localStorage.setItem('zerodha-funds', JSON.stringify(fundsData));
        const getData = JSON.parse(localStorage.getItem('zerodha-funds'));
        console.log(getData, "getData");
        
      }

      const openState = {};
      res.data.forEach((acc) => {
        openState[acc.id] = true;
      });

      setAccordionOpen(openState);
      setAccounts(res.data.map((acc) => ({
        ...acc,
        status: 'Pending',
      })));
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    fetchAccounts().then(fundCheck);
  }, []);


  useEffect(() => {
    const updatedFunds = accounts.map(({ id, name, token, lotSize, invest_amount, sandbox_token, status, percentage, funds, investable_amount, call_lot, put_lot,zerodha_token ,api_key }) => ({
      id,
      name,
      token,
      lotSize,
      invest_amount,
      sandbox_token,
      status,
      percentage,
      funds,
      investable_amount,
      call_lot,
      put_lot,
      zerodha_token,
      api_key
    }));
    console.log(updatedFunds,"updatedFunds");
    
    localStorage.setItem("zerodha-funds", JSON.stringify(updatedFunds));
  }, [accounts]);

  // const fundCheck = async () => {
  //   const storedFunds = JSON.parse(localStorage.getItem('zerodha-funds') || '[]');

  //   if (!storedFunds.length) {
  //     toast.error("No funds found in local storage.");
  //     return;
  //   }

  //   const updatedFunds = [];
  //   let updatedAccounts = [...storedFunds]; // work with a local copy


  //   for (const fund of storedFunds) {
  //     try {
  //       const res = await axios.get(`https://api.kite.trade/user/margins`, {
  //         headers: {
  //           Authorization: `Bearer ${fund.token}`,
  //         },
  //       });

  //       const fetchedFund = res.data;
  //       const fundAmount = Number(fetchedFund.margins?.available_margin || 0);
  //       // setAccounts((prev) =>
  //       //   prev.map((acc) => ({
  //       //     ...acc,
  //       //     name:  res?.data?.user_name
  //       //   }))
  //       // );
  //       // console.log(accounts,fund, "accounts");

  //       // const percentage = Number(
  //       //   accounts.find((acc) => acc.name === fund.name)?.percentage || 0
  //       // );
  //       // const investableAmount = (fundAmount * percentage) / 100;
  //       // console.log(investableAmount, percentage, "investableAmount");

  //       // // Update state
  //       // setAccounts((prev) =>
  //       //   prev.map((acc) =>
  //       //     acc.name === fund.name
  //       //       ? {
  //       //         ...acc,
  //       //         funds: fundAmount,
  //       //         investable_amount: investableAmount.toFixed(2),
  //       //       }
  //       //       : acc
  //       //   )
  //       // );

  //       // // Prepare updated local storage item
  //       // updatedFunds.push({
  //       //   ...fund,
  //       //   funds: fundAmount,
  //       //   investable_amount: investableAmount.toFixed(2),
  //       // });
  //       setAccounts((prev) =>
  //         prev.map((acc) =>
  //           acc.token === fund.token
  //             ? { ...acc, name: fetchedFund.user_name }
  //             : acc
  //         )
  //       );

  //       const percentage = Number(fund.percentage || 0);
  //       const investableAmount = (fundAmount * percentage) / 100;
  //       console.log(investableAmount, percentage, "investableAmount");

  //       setAccounts((prev) =>
  //         prev.map((acc) =>
  //           acc.token === fund.token
  //             ? {
  //               ...acc,
  //               funds: fundAmount,
  //               investable_amount: investableAmount.toFixed(2),
  //             }
  //             : acc
  //         )
  //       );

  //       updatedFunds.push({
  //         ...fund,
  //         funds: fundAmount,
  //         investable_amount: investableAmount.toFixed(2),
  //       });
  //     } catch (err) {
  //       console.error(`Error fetching fund for ${fund.name}:`, err);
  //     }
  //   }

  //   // Update localStorage after all API calls
  //   localStorage.setItem('zerodha-funds', JSON.stringify(updatedFunds));
  // };



  const fundCheck = async () => {
    const storedFunds = JSON.parse(localStorage.getItem('zerodha-funds'));

    if (!storedFunds.length) {
      toast.error("No Zerodha funds found in local storage.");
      return;
    }

    const updatedFunds = [];

    for (const fund of storedFunds) {
      try {
        const res = await axios.get(
          "https://api.kite.trade/user/margins",
          {
            headers: {
              "X-Kite-Version": "3",
              Authorization: `token ${fund.api_key}:${fund.zerodha_token}`,
            },
          }
        );

        const fetchedFund = res.data.data; // Zerodha returns inside 'data'
        const fundAmount = Number(fetchedFund.equity?.available?.live_balance || 0);

        const percentage = Number(fund.percentage || 0);
        const investableAmount = (fundAmount * percentage) / 100;

        // Update UI (optional)
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.token === fund.token
              ? {
                ...acc,
                funds: fundAmount,
                investable_amount: investableAmount.toFixed(2),
              }
              : acc
          )
        );

        updatedFunds.push({
          ...fund,
          funds: fundAmount,
          investable_amount: investableAmount.toFixed(2),
        });

      } catch (err) {
        console.error(`Error fetching Zerodha fund for ${fund.name}:`, err);
        toast.error(`Failed to fetch fund for ${fund.name}`);
      }
    }

    localStorage.setItem('zerodha-funds', JSON.stringify(updatedFunds));
  };



  const handleInputChange = (id, field, value) => {
    setAccounts((prev) => {
      const updated = prev.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc
      );
      localStorage.setItem('zerodha-funds', JSON.stringify(updated)); // optional if you use the useEffect
      return updated;
    });
  };

  const handleRemoveAccount = async (id) => {
    // await fetch(`${process.env.REACT_APP_BASE_URL}fund-instrument/${id}/`, { method: "DELETE" });
    axios.delete(`${process.env.REACT_APP_BASE_URL}fund-instrument/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access-token')}`
      }
    }).then((res) => {
      toast.error('Delete Successfully');
      fetchAccounts()
    }).catch((err) => console.log(err))

  };

  const toggleAccordion = (key) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const confirmAction = () => {
    if (modalType === "apply") {
      setAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          percentage: applyValue
        }))
      );
    } else if (modalType === "reset") {
      setApplyValue("");
      setAccounts((prev) =>
        prev.map((acc) => ({ ...acc, percentage: "" }))
      );
    }
    setShowModal(false);
    setModalType(null);
  };

  const saveAllChanges = async () => {
    for (const acc of accounts) {
      await fetch(`${process.env.REACT_APP_BASE_URL}fund-instrument/${acc.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('access-token')}`
        },
        body: JSON.stringify({
          invest_amount: acc.invest_amount,
          percentage: acc.percentage,
          call_lot: acc.call_lot,
          put_lot: acc.put_lot
        })
      });
    }
    alert("Changes saved!");
  };
  const handleExportExcel = () => {
    const exportData = accounts.map((acc) => ({
      Name: acc.name,
      fund: acc.funds ?? 0, // as you mentioned duplicate "fund"
      investable_amount: acc.investable_amount || 0,
      timestamp: new Date().toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Funds");

    XLSX.writeFile(workbook, "funds_export.xlsx");
  };



  return (
    <>
      <div className="w-full md:w-80 bg-white border-r border-gray-200 
          p-4 flex flex-col h-screen overflow-y-auto
          max-h-screen">
        <div className="mb-3 flex justify-between items-center flex-wrap gap-3">
          <Link to="/" className="w-50 h-50 ">
            <img src="/assets/Zerodha logo.png" className="w-[100px] h-[50px] object-contain cursor-pointer" />
          </Link>
          <div>
            {/* <input
              type="file"
              accept=".xls,.xlsx,.csv"
              ref={fileInputRef}
              onChange={(e) => console.log(e.target.files[0])}
              style={{ display: "none" }}
            /> */}
            <button
              className="border-[1px] text-green-700 p-2 mr-4 hover:bg-gray-100 rounded-lg"
              // onClick={() => setIsOpenPopup(true)}
              onClick={() => handleExportExcel()}
            >
              <PiMicrosoftExcelLogo />
            </button>
            <button
              className="border-[1px] p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsOpenPopup(true)}
            >
              <FaUpload />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={applyValue}
            onChange={(e) => setApplyValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
            placeholder="Enter 0-100"
          />
          <button
            onClick={() => {
              setModalType("apply");
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setModalType("reset");
              setShowModal(true);
            }}
            className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-400"
          >
            Reset
          </button>
        </div>

        {accounts.map((acc) => (
          <div key={acc.id} className="w-70 bg-white border rounded-lg border-gray-200 p-4 flex flex-col mb-4 relative">
            <div onClick={() => toggleAccordion(acc.id)} className="flex items-center justify-between cursor-pointer mb-4">
              <span className="text-sm font-medium">{acc.name}</span>
              <div className={`px-1 rounded text-xs ${acc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                acc.status === 'Failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                {acc.status}
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-start gap-2 font-semibold">
                  {/* <span>₹{parseFloat(acc.funds).toLocaleString()}</span> */}
                  {accordionOpen[acc.id] ? <FaCaretUp /> : <FaSortDown />}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAccount(acc.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>

            {accordionOpen[acc.id] && (
              <div>
                <div className="mb-4">
                  <label className="text-xs block mb-1">Investment Amount</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={acc.funds}
                    onChange={(e) => handleInputChange(acc.id, "invest_amount", e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs block mb-1">Percentage</label>
                  <input
                    type="text"
                    value={acc.percentage}
                    onChange={(e) => handleInputChange(acc.id, "percentage", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    placeholder="Enter 0-100"
                  />
                </div>

                <div className="mb-4 mt-4">
                  <label className="text-xs block mb-1">Investable Amount</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-100"
                    value={acc.investable_amount}
                    readOnly
                  />
                </div>

                <div className="mb-2">
                  <label className="text-xs block mb-1">Number of Lot</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={acc.call_lot}
                      onChange={(e) => handleInputChange(acc.id, "call_lot", e.target.value)}
                      className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={acc.put_lot}
                      onChange={(e) => handleInputChange(acc.id, "put_lot", e.target.value)}
                      className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button onClick={() => setAddAccountPopup(true)} className="bg-blue-700 rounded-lg w-full text-white py-1 text-[14px]">+ Add Account</button>
          <button onClick={saveAllChanges} className="bg-green-600 rounded-lg w-full text-white py-1 text-[14px] hover:bg-green-700">Save Changes</button>
        </div>

        <AddAccountPopup isOpen={addAccountPopup} onClose={() => setAddAccountPopup(false)} />
      </div>

      <ExcelUploadPopup accounts={accounts} fetchAccounts={fetchAccounts} isOpen={isOpenPopup} onClose={() => setIsOpenPopup(false)} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-5 rounded-md shadow-md w-80">
            <h3 className="text-md font-semibold mb-3 text-center">
              {modalType === "apply"
                ? `Apply "${applyValue}%" to all accounts?`
                : "Reset all percentages to blank?"}
            </h3>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ZerodhaSidebar;
