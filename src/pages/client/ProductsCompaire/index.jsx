import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Star from "../Helpers/icons/Star";
import InputForm from "../Helpers/InputForm";
import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";
import '@fortawesome/fontawesome-free/css/all.min.css';

const MAX_COMPARE = 4;
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function DescriptionToggle({ description }) {
  const [expanded, setExpanded] = useState(false);
  if (!description || description === "-") return "-";
  const words = description.split(" ");
  const shortText = words.slice(0, 50).join(" ");
  const isLong = words.length > 50;

  return (
    <div className="text-left">
      <p className="text-sm">
        {expanded || !isLong ? description : `${shortText}...`}
      </p>
      {isLong && (
        <button
          className="text-blue-500 text-xs mt-1 underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ẩn bớt" : "Xem thêm"}
        </button>
      )}
    </div>
  );
}

export default function ProductsCompare() {
  const [variants, setVariants] = useState([]);
  const [searchInputs, setSearchInputs] = useState(Array(MAX_COMPARE).fill(""));
  const [selectedVariants, setSelectedVariants] = useState(Array(MAX_COMPARE).fill(null));
  const [filteredLists, setFilteredLists] = useState(Array(MAX_COMPARE).fill([]));
  const [allAttributes, setAllAttributes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/products/compare")
      .then((res) => res.json())
      .then((data) => {
        const variantList = [];

        data.data.forEach((product) => {
          product.variants.forEach((variant) => {
            variantList.push({
              productId: product.id,
              productName: product.name,
              productDescription: product.description,
              productThumbnail: product.thumbnail,
              brand: product.brand?.name || "-",
              averageRating: product.average_rating, 
              variantId: variant.id,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku,
              images: variant.images || [],
              attributeValues: variant.attributeValues || [],
            });
          });
        });

        setVariants(variantList);
        setFilteredLists(Array(MAX_COMPARE).fill(variantList));

        const storedList = JSON.parse(localStorage.getItem("compareList")) || [];
        if (storedList.length > 0) {
          setSelectedVariants(storedList);
          setSearchInputs(
            storedList.map((v) => v.productName).concat(Array(MAX_COMPARE - storedList.length).fill(""))
          );
        }

        const attrSet = new Set();
        variantList.forEach((v) => {
          v.attributeValues?.forEach((av) => {
            attrSet.add(av.attribute.name);
          });
        });
        setAllAttributes(Array.from(attrSet));
      })
      .catch(console.error);
  }, []);

  const handleSearchInputChange = (index, value) => {
    const newSearchInputs = [...searchInputs];
    newSearchInputs[index] = value;
    setSearchInputs(newSearchInputs);

    const filtered = variants
      .filter((v) =>
        v.productName.toLowerCase().includes(value.toLowerCase()) ||
        v.sku?.toLowerCase().includes(value.toLowerCase()) ||
        v.productDescription?.toLowerCase().includes(value.toLowerCase())
      )
      .filter((v) => !selectedVariants.some((sv) => sv?.variantId === v.variantId));

    const newFilteredLists = [...filteredLists];
    newFilteredLists[index] = filtered;
    setFilteredLists(newFilteredLists);
  };

  const handleSelectVariant = (index, variant) => {
    if (selectedVariants.some((v, idx) => v?.variantId === variant.variantId && idx !== index)) {
      Swal.fire({
        icon: "warning",
        title: "Trùng biến thể",
        text: "Biến thể này đã được chọn ở cột khác!",
      });
      return;
    }

    const newSelected = [...selectedVariants];
    newSelected[index] = variant;
    setSelectedVariants(newSelected);

    const newSearchInputs = [...searchInputs];
    newSearchInputs[index] = variant.productName;
    setSearchInputs(newSearchInputs);
  };

  const handleClearVariant = (index) => {
    const newSelected = [...selectedVariants];
    newSelected[index] = null;
    setSelectedVariants(newSelected);

    const newSearchInputs = [...searchInputs];
    newSearchInputs[index] = "";
    setSearchInputs(newSearchInputs);

    const newFilteredLists = [...filteredLists];
    newFilteredLists[index] = variants;
    setFilteredLists(newFilteredLists);

    const updated = newSelected.filter((v) => v !== null);
    localStorage.setItem("compareList", JSON.stringify(updated));
  };

const renderStars = (rating) => {
  if (!rating || isNaN(parseFloat(rating))) return <span>-</span>;

  const stars = [];
  const numericRating = parseFloat(rating);

  for (let i = 1; i <= 5; i++) {
    if (i <= numericRating) {
      stars.push(<i key={i} className="fas fa-star text-yellow-400" />);
    } else if (i - 0.5 <= numericRating) {
      stars.push(<i key={i} className="fas fa-star-half-alt text-yellow-400" />);
    } else {
      stars.push(<i key={i} className="far fa-star text-yellow-400" />);
    }
  }

  return stars;
};



  const getAttributeValue = (variant, attributeName) => {
    const av = variant.attributeValues?.find((a) => a.attribute.name === attributeName);
    return av ? av.value : "-";
  };

  const getImageUrl = (variant) => {
    return variant.images?.[0]?.image_url || null;
  };

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="products-compare-wrapper w-full bg-white pb-[40px]">
        <div className="w-full mb-5">
          <PageTitle
            breadcrumb={[
              { name: "Trang chủ", path: "/" },
              { name: "So sánh sản phẩm", path: "/products-compare" },
            ]}
            title="So sánh sản phẩm"
          />
        </div>

        <div className="container-x mx-auto overflow-x-auto">
          <div className="w-full border border-qgray-border">
            <table className="table-wrapper min-w-[900px] border-collapse border border-gray-300">
              <tbody>
                {/* Hàng đầu tiên có border */}
                <tr className="border-t border-gray-300">
                  <td className="w-[233px] pt-[30px] px-[26px] align-top bg-[#FAFAFA] text-[16px] font-semibold leading-[26px]">
                    So sánh sản phẩm
                    <p className="text-[13px] text-qgraytwo mt-2">
                      Tìm kiếm và chọn biến thể để so sánh
                    </p>
                  </td>
                  {Array(MAX_COMPARE).fill(0).map((_, i) => (
                    <td key={i} className="w-[235px] bg-white p-4 border border-gray-300">
                      <InputForm
                        placeholder="Tìm sản phẩm hoặc biến thể..."
                        value={searchInputs[i]}
                        inputHandler={(e) => handleSearchInputChange(i, e.target.value)}
                      />
                      {!selectedVariants[i] && searchInputs[i] && (
                        <ul className="bg-white border border-qgray-border max-h-40 overflow-y-auto mt-1 rounded shadow-md">
                          {filteredLists[i].slice(0, 5).map((v) => (
                            <li
                              key={v.variantId}
                              className="p-2 cursor-pointer hover:bg-gray-200"
                              onClick={() => handleSelectVariant(i, v)}
                            >
                              {v.productName} - {v.sku}
                            </li>
                          ))}
                          {filteredLists[i].length === 0 && (
                            <li className="p-2 text-center text-gray-500">Không có kết quả</li>
                          )}
                        </ul>
                      )}
                      {selectedVariants[i] && (
                        <div className="mt-4">
                          <div className="flex justify-center mb-3">
                            <img
                              src={selectedVariants[i].productThumbnail}
                              alt={selectedVariants[i].productName}
                              className="w-[161px] h-[161px] object-contain"
                            />
                          </div>
                          <p className="text-center text-[15px] font-medium text-qblack leading-[24px] mb-1">
                            {selectedVariants[i].productName}
                          </p>
                          <p className="text-center text-[15px] font-medium text-qred leading-[24px] mb-1">
                            {Number(selectedVariants[i].price).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </p>
                          <button
                            className="block mx-auto text-xs text-blue-500 "
                            onClick={() => handleClearVariant(i)}
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>


                {[
                  // { label: "Tên sản phẩm", value: (v) => v?.productName || "-" },
                  {
                    label: "Hình ảnh",
                    value: (v) => {
                      const url = getImageUrl(v);
                      return url ? (
                        <img src={url} className="w-20 h-20 mx-auto object-contain" alt="" />
                      ) : "-";
                    },
                  },
                  { label: "Thương hiệu", value: (v) => v?.brand || "-" },
                  {
                    label: "Giá",
                    value: (v) =>
                      Number(v?.price).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }),
                  },
                  { label: "Mã Sản Phẩm", value: (v) => v?.sku || "-" },
                  { label: "Tồn kho", value: (v) => v?.stock ?? "-" },
{
  label: "Đánh giá",
  value: (v) => {
    if (!v || !v.averageRating) return <span className="text-xs">-</span>;

    const rating = parseFloat(v.averageRating);

    return (
      <div className="flex items-center justify-center gap-1">
        <div className="flex">{renderStars(rating)}</div>
        <span className="text-xs text-gray-600">– {rating.toFixed(1)}</span>
      </div>
    );
  }
}




                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="text-[16px] leading-[26px] bg-[#FAFAFA] font-semibold px-[26px] py-[36px]">{label}</td>
                    {selectedVariants.map((v, i) => (
                      <td key={i} className="text-center text-sm px-[26px] py-[20px]">
                        {v ? value(v) : "-"}
                      </td>
                    ))}
                  </tr>
                ))}

                {allAttributes
                  .filter((attr) =>

                    selectedVariants.some((v) => v && getAttributeValue(v, attr) !== "-")
                  )
                  .map((attr) => (
                    <tr key={attr}>
                      <td className="text-[16px] leading-[26px] bg-[#FAFAFA] font-semibold px-[26px] py-[36px]">
                        {capitalizeFirstLetter(attr)}
                      </td>
                      {selectedVariants.map((v, i) => {
                        const value = v ? getAttributeValue(v, attr) : "-";
                        return (
<td key={i} className="text-center text-sm px-[26px] py-[20px]">
  {attr.toLowerCase() === "color" || attr.toLowerCase() === "màu sắc" ? (
    value !== "-" ? (
      <div
        className="w-6 h-6 mx-auto border" 
        style={{ backgroundColor: value }}
        title={value}
      />
    ) : (
      "-"
    )
  ) : (
    value
  )}
</td>

                        );
                      })}
                    </tr>
                  ))}


              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
