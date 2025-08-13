import React from "react";
import BrandCreate from "../../brand/Create/index";

export default function AddBrandModal({ onClose, onSuccess }) {
  return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.2)] backdrop-blur-sm">
  <div className="bg-white max-w-3xl w-full max-h-[90vh] rounded-lg shadow-lg relative flex flex-col">
    
    {/* Header cố định */}
    <div className="flex-shrink-0 p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-gray-500 hover:text-red-500 text-xl font-bold"
      >
        &times;
      </button>
      {/* Bạn có thể để tiêu đề modal ở đây nếu muốn */}
    </div>

    {/* Body scroll */}
    <div className="overflow-y-auto flex-1">
      <BrandCreate onSuccess={onSuccess} isModal={true} />
    </div>
  </div>
</div>

  );
}
