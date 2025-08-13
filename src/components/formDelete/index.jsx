import { FaExclamationTriangle } from "react-icons/fa";
import { FaTimes } from "react-icons/fa"; 

export default function FormDelete({ isOpen, onClose, onConfirm, message, Id }) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ id: Id });
    };

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-lg"
                >
                    <FaTimes />
                </button>

                <FaExclamationTriangle className="text-red-600 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Xác nhận</h3>
                <p className="text-gray-600 mb-6">
                    {message || "Bạn có chắc chắn muốn thực hiện hành động này không?"}
                </p>

                <div className="flex justify-center gap-4">
                    <button className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-md">
                        Xác nhận
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </form>
    );
}
