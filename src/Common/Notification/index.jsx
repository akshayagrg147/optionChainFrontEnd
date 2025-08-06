import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { AiOutlineCheckCircle, AiOutlineWarning, AiOutlineCloseCircle, AiOutlineInfoCircle } from "react-icons/ai";

const notifications = [
  {
    icon: <AiOutlineCheckCircle className="text-green-500 w-5 h-5" />,
    title: "Trade executed successfully",
    time: "2m ago",
    bg: "bg-green-50",
  },
  {
    icon: <AiOutlineWarning className="text-yellow-500 w-5 h-5" />,
    title: "Account OTP pending",
    time: "5m ago",
    bg: "bg-yellow-50",
  },
  {
    icon: <AiOutlineCloseCircle className="text-red-500 w-5 h-5" />,
    title: "Trade failed - Insufficient funds",
    time: "10m ago",
    bg: "bg-red-50",
  },
  {
    icon: <AiOutlineInfoCircle className="text-blue-500 w-5 h-5" />,
    title: "Market status updated",
    time: "15m ago",
    bg: "bg-blue-50",
  },
];

export default function NotificationPanel() {
  const [data, setData] = useState(notifications);

  return (
    <div className="absolute h-[calc(100vh-100px)] right-6 top-16 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
    <div className="max-w-sm mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        {data.map((note, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg ${note.bg}`}
          >
            <div>{note.icon}</div>
            <div className="flex flex-col text-sm">
              <span className="text-gray-800">{note.title}</span>
              <span className="text-gray-500 text-xs">{note.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
