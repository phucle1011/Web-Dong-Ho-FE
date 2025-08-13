// 👇 Adapter dùng để upload ảnh lên Cloudinary
export default class CustomUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  async upload() {
    const file = await this.loader.file;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "upload_preset"); // 👈 Đổi thành preset của bạn
    formData.append("cloud_name", "disgf4yl7");         // 👈 Đổi thành cloud name của bạn

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/disgf4yl7/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return {
      default: data.secure_url, // đường link ảnh trả về từ Cloudinary
    };
  }

  abort() {
    // Có thể xử lý hủy nếu muốn
  }
}
