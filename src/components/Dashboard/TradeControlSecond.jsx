// import React, { useState } from "react";
// import { FaPencilAlt } from "react-icons/fa";
// import { Link } from "react-router-dom";

// const TradeTableSecond = () => {
//   const [reverseTrade, setReverseTrade] = useState(false);
//   const [rtpValue, setRtpValue] = useState('');
//   const [data, setData] = useState([
//     {
//       type: 'CALL',
//       instrument: 'NSE_INDEX|Nifty 50',
//       strikePrice: 22500,
//       dateOfContract: '2025-07-10',
//       targetMarket: 23000,
//       currentMarket: 22650,
//       lotSize: 50,
//       ltpLocked: 'No',
//       status: 'Inactive',
//       pl: '3.25%',
//       buyInLTP: 102.5,
//       liveInLTP: 26.5,
//       active: false,
//       editMode: false,
//     },
//     {
//       type: 'PUT',
//       instrument: 'NSE_INDEX|Bank Nifty',
//       strikePrice: 49000,
//       dateOfContract: '2025-07-10',
//       targetMarket: 48000,
//       currentMarket: 49200,
//       lotSize: 25,
//       ltpLocked: 'Yes',
//       status: 'Inactive',
//       pl: '-2.15%',
//       buyInLTP: 185.7,
//       liveInLTP: 10.7,
//       active: false,
//       editMode: false,
//     },
//   ]);

//   return (
//     <>
//       <div className="p-4 bg-white rounded-lg shadow border border-gray-200 overflow-x-auto ml-4 h-auto">
//         <div className="overflow-y-auto h-full">
//           <table className="min-w-full text-sm text-left">
//             <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
//               <tr>
//                 <th className="px-4 py-2 bg-gray-100">Type</th>
//                 <th className="px-4 py-2 bg-gray-100">Instrument</th>
//                 <th className="px-4 py-2 bg-gray-100">Strike Price</th>
//                 <th className="px-4 py-2 bg-gray-100">Date Of Contract</th>
//                 {/* <th className="px-4 py-2 bg-gray-100">Target Market</th> */}
//                 <th className="px-4 py-2 bg-gray-100">Current Market</th>
//                 <th className="px-4 py-2 bg-gray-100">Lot Size</th>
//                 <th className="px-4 py-2 bg-gray-100">LTP Locked</th>
//                 <th className="px-4 py-2 bg-gray-100">Status</th>
//                 <th className="px-4 py-2 bg-gray-100">P/L %</th>
//                 <th className="px-4 py-2 bg-gray-100">Buy In LTP</th>
//                 <th className="px-4 py-2 bg-gray-100">Live LTP</th>
//                 <th className="px-4 py-2 bg-gray-100">Active</th>
//                 <th className="px-4 py-2 text-center bg-gray-100">Action</th>
//               </tr>
//             </thead>
//             <tbody className="text-gray-800">
//               {data.slice(0, 2).map((row, index) => (
//                 <tr key={index} className="border-t">
//                   <td className="px-4 py-2">{row.type}</td>

//                   <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <select
//                         className="px-2 py-1 border rounded"
//                         value={row.instrument}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].instrument = e.target.value;
//                           setData(updated);
//                         }}
//                       >
//                         <option value="NSE_INDEX|Nifty 50">Nifty 50</option>
//                         <option value="NSE_INDEX|Bank Nifty">Bank Nifty</option>
//                         <option value="NSE_INDEX|FINNIFTY">Fin Nifty</option>
//                       </select>
//                     ) : (
//                       row.instrument
//                     )}5
//                   </td>

//                   <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <input
//                         type="number"
//                         className="w-24 px-2 py-1 border rounded"
//                         value={row.strikePrice}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].strikePrice = e.target.value;
//                           setData(updated);
//                         }}
//                       />
//                     ) : (
//                       row.strikePrice
//                     )}
//                   </td>

//                   <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <input
//                         type="date"
//                         className="px-2 py-1 border rounded"
//                         value={row.dateOfContract}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].dateOfContract = e.target.value;
//                           setData(updated);
//                         }}
//                       />
//                     ) : (
//                       row.dateOfContract
//                     )}
//                   </td>

//                   {/* <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <input
//                         type="number"
//                         className="w-24 px-2 py-1 border rounded"
//                         value={row.targetMarket}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].targetMarket = e.target.value;
//                           setData(updated);
//                         }}
//                       />
//                     ) : (
//                       row.targetMarket
//                     )}
//                   </td> */}

//                   <td className="px-4 py-2">{row.currentMarket}</td>

//                   <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <input
//                         type="number"
//                         className="w-20 px-2 py-1 border rounded"
//                         value={row.lotSize}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].lotSize = e.target.value;
//                           setData(updated);
//                         }}
//                       />
//                     ) : (
//                       row.lotSize
//                     )}
//                   </td>

//                   <td className="px-4 py-2">{row.ltpLocked}</td>

//                   <td className="px-4 py-2">
//                     {row.editMode ? (
//                       <select
//                         className="px-2 py-1 border rounded"
//                         value={row.status}
//                         onChange={(e) => {
//                           const updated = [...data];
//                           updated[index].status = e.target.value;
//                           setData(updated);
//                         }}
//                       >
//                         <option value="Inactive">Inactive</option>
//                         <option value="Vigilant">Vigilant</option>
//                         <option value="Waiting for Square-Off">Waiting for Square-Off</option>
//                       </select>
//                     ) : (
//                       row.status
//                     )}
//                   </td>

//                   <td className="px-4 py-2">{row.pl}</td>
//                   <td className="px-4 py-2">{row.buyInLTP}</td>
//                   <td className="px-4 py-2 text-green-500">{row.liveInLTP}</td>

//                   <td className="px-4 py-2">
//                     <div
//                       onClick={() => {
//                         const updated = [...data];
//                         updated[index].active = !updated[index].active;
//                         setData(updated);
//                       }}
//                       className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${row.active ? 'bg-blue-500' : 'bg-gray-300'}`}
//                     >
//                       <div
//                         className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${row.active ? 'left-[1.50rem]' : 'left-1'}`}
//                       />
//                     </div>
//                   </td>

//                   <td className="px-4 py-2 flex gap-2 items-center">
//                     <button
//                       className={`text-green-500 hover:text-green-700 ${row.active ? 'opacity-50 cursor-not-allowed' : ''}`}
//                       onClick={() => {
//                         if (row.active) return;
//                         const updated = [...data];
//                         updated[index].editMode = !updated[index].editMode;
//                         setData(updated);
//                       }}
//                       disabled={row.active}
//                     >
//                       <FaPencilAlt />
//                     </button>

//                     <Link to="/manual-trade">
//                       <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
//                         Square Off
//                       </button>
//                     </Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

     
//     </>
//   );
// };

// export default TradeTableSecond;
import React, { useState, useEffect } from "react";
import { FaPencilAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useWebSocket } from "../../WebSocketContext";
import axios from "axios";


const TradeTableSecond = ({ data, setData,setRtpValue }) => {



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
            </thead>
            <tbody className="text-gray-800">
              {data.map((row, index) => (
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
                        <option value="Nifty Bank">Bank Nifty</option>
                        <option value="NIFTY">Nifty</option>
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
                          const updated = [...data];
                          updated[index].lotSize = e.target.value;
                          setData(updated);
                        }}
                      />
                    ) : (
                      row.lotSize
                    )}
                  </td>
                  <td className="px-4 py-2">{row.ltpLocked}</td>
                  <td className="px-4 py-2">
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
                  </td>
                  <td className="px-4 py-2">{row.pl}</td>
                  <td className="px-4 py-2">{row.buyInLTP}</td>
                  <td className="px-4 py-2 text-green-500">{row.liveInLTP}</td>
                  <td className="px-4 py-2">
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
                  </td>
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
                    <Link to="/manual-trade">
                      <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
                        Square Off
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
    </>
  );
};

export default TradeTableSecond;

