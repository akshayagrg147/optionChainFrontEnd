import React from 'react';

const SquareOff = () => {
    const [spread,setSpread] = React.useState('');
    const [gap,setGap] = React.useState('');
 const tableData = Array.from({ length: 42 }, (_, index) => index - 1) // gives -1 to 40
  .filter((num) => num !== 0) // remove 0
  .map((sno) => ({
    sno,
    profit: 0,
    step: 0,
  }));
    return (
        <>
            <div className=" bg-white p-6 rounded-lg shadow-md">
                <form className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mt-10">
                    {/* PURCHASE PRICE LTP */}
                    {/* <div className="flex flex-col">
                        <label className="font-semibold text-gray-700 mb-1">PURCHASE PRICE LTP</label>
                        <input
                            type="text"
                            placeholder="Enter value"
                            className="p-2 border border-gray-300 rounded-md"
                        />
                    </div> */}

                    {/* SPREAD */}
                    <div className="flex flex-col">
                        <label className="font-semibold  mb-1">SPREAD</label>
                        <input
                            type="text"
                            placeholder="Enter value"
                            className="p-2 border border-gray-300 rounded-md"
                            onChange={(e)=>setSpread(e.target.value)}
                        />
                    </div>

                    {/* GAP */}
                    <div className="flex flex-col">
                        <label className="font-semibold text-black mb-1">GAP</label>
                        <input
                            type="text"
                            placeholder="Enter value"
                            className="p-2 border border-gray-300 rounded-md"
                            onChange={(e)=>setGap(e.target.value)}
                        />
                    </div>
                </form>

            </div>
            {/* <div className=" max-w-[70%]  mx-auto overflow-x-auto mt-8 p-4">
                <table className="min-w-full table-auto border border-gray-300 text-center">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-gray-300 px-4 py-2">S NO.</th>
                            <th className="border border-gray-300 px-4 py-2">PROFIT %</th>
                            <th className="border border-gray-300 px-4 py-2">STEP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                                <td className="border border-gray-300 px-4 py-1">{row.sno}</td>
                                <td className="border border-gray-300 px-4 py-1">{row.profit}</td>
                                <td className="border border-gray-300 px-4 py-1">{row.step}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}
        </>
    );
};

export default SquareOff;
