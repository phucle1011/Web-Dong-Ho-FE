import React from "react";

export default function ConfirmLogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 w-screen h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Xác nhận đăng xuất</h3>
        <p className="text-sm text-gray-600 mb-6">Bạn có chắc chắn muốn đăng xuất?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}