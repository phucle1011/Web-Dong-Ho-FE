import React, { useState, useEffect } from "react";
import axios from "axios";
import DataIteration from "../../../Helpers/DataIteration";
import { Star, StarHalf } from "lucide-react"; // Xóa StarOutline
import Constants from "../../../../../Constants";
import { decodeToken } from "../../../Helpers/jwtDecode";

export default function ReviewTab({ className }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const decoded = decodeToken(token);

        const response = await axios.get(`${Constants.DOMAIN_API}/${decoded.id}/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data?.success) {
          const reviewsData = response.data.data || [];
          setReviews(reviewsData);

          if (reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + (parseFloat(review.rating) || 0), 0);
            const avg = totalRating / reviewsData.length;

            setAverageRating(parseFloat(avg.toFixed(1)));
          }
        } else {
          throw new Error(response.data?.error || 'Không thể lấy đánh giá');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center py-4 text-gray-500">Bạn chưa có đánh giá nào</div>;
  }

  // Hàm renderStars sửa để dùng Star cho sao rỗng
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <>
        {Array(fullStars)
          .fill()
          .map((_, i) => (
            <Star key={`full-${i}`} className="text-yellow-400 w-4 h-4" fill="#FFD700" />
          ))}
        {hasHalfStar && <StarHalf className="text-yellow-400 w-4 h-4" fill="#FFD700" />}
        {Array(emptyStars)
          .fill()
          .map((_, i) => (
            <Star key={`empty-${i}`} className="text-gray-300 w-4 h-4" fill="none" stroke="#D1D5DB" />
          ))}
      </>
    );
  };

  return (
    <div className="review-tab-wrapper w-full">
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Đánh giá của bạn</h3>
        <div className="flex items-center">
          <div className="text-3xl font-bold mr-4">{averageRating}/5</div>
          <div className="flex">
            {renderStars(averageRating)}
          </div>
          <span className="ml-2 text-gray-600">({reviews.length} đánh giá)</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataIteration datas={reviews} startLength={0} endLength={reviews.length}>
          {({ datas }) => {
            const productImage =
              datas.productInfo?.image ||
              datas.productInfo?.variantImages?.[0]?.image_url ||
              datas.productInfo?.thumbnail ||
              "/images/no-image.jpg";


            return (
              <div key={datas.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{datas.userInfo?.name || "Người dùng"}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(datas.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex my-2 items-center">
                      {renderStars(parseFloat(datas.rating || 0))}
                      <span className="ml-2 text-sm text-gray-500">{parseFloat(datas.rating || 0).toFixed(1)}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{datas.comment}</p>
                    {datas.productInfo && (
                      <div className="mt-3 flex items-center space-x-3">
                        <img
                          src={productImage}
                          alt={datas.productInfo.name}
                          className="w-14 h-14 object-contain border rounded"
                        />
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">{datas.productInfo.name}</div>
                          <div className="text-xs text-gray-500">Sản phẩm đã mua</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        </DataIteration>
      </div>
    </div>
  );
}