// src/utils/uploadToCloudinary.js

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "upload_preset"); // thay bằng upload preset của bạn
  formData.append("cloud_name", "disgf4yl7");       // thay bằng cloud name

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/disgf4yl7/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
     return {
    url: data.secure_url,
    public_id: data.public_id,
  };
      
  } catch (err) {
    console.error("Lỗi khi upload ảnh lên Cloudinary:", err);
    throw err;
  }
};
// ✅ HÀM XÓA ẢNH
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const response = await fetch("https://web-dong-ho-be.onrender.com/admin/products/imagesClauding", {
      method: "POST", // phải có method
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_id: publicId }), // đúng format
    });

    return await response.json();
  } catch (err) {
    console.error("Lỗi xóa ảnh Cloudinary:", err);
    return { success: false };
  }
};