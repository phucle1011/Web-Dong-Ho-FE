import React, { useState, useEffect } from "react";
import CartVarian from "./cartVarian";

export default function ParentComponent({ allAttributes, onVariantsChange }) {
  const [variantForms, setVariantForms] = useState([]);

  useEffect(() => {
    if (onVariantsChange) {
      onVariantsChange(variantForms); // Cập nhật đúng biến
    }
  }, [variantForms, onVariantsChange]);

  const handleChange = (index, field, value) => {
    const updatedForms = [...variantForms];
    updatedForms[index][field] = value;
    setVariantForms(updatedForms);
  };

  const handleAttributeChange = (index, attrIndex, field, value) => {
    const updatedForms = [...variantForms];
    const updatedAttrs = [...updatedForms[index].attributes];
    updatedAttrs[attrIndex][field] = value;
    updatedForms[index].attributes = updatedAttrs;
    setVariantForms(updatedForms);
  };

  const addAttributeRow = (index) => {
    const updatedForms = [...variantForms];
    updatedForms[index].attributes.push({ attribute_id: "", value: "" });
    setVariantForms(updatedForms);
  };

  const removeVariantForm = (index) => {
    const updatedForms = [...variantForms];
    updatedForms.splice(index, 1); // Xoá 1 phần tử tại vị trí index
    setVariantForms(updatedForms);
  };
  const removeAttributeRow = (variantIndex, attrIndex) => {
    const updatedForms = [...variantForms];
    updatedForms[variantIndex].attributes.splice(attrIndex, 1);
    setVariantForms(updatedForms);
  };

  const handleSetImages = (index, newImages) => {
  const updatedForms = [...variantForms];
  updatedForms[index].images = newImages;
  setVariantForms(updatedForms);
};
  const addVariantForm = () => {
    setVariantForms([
      ...variantForms,
      {
        sku: "",
        price: "",
        stock: "",
        attributes: [{ attribute_id: "", value: "" }],
        images: [],
        errors: {},
      },
    ]);
  };

  return (
    <div>
  {variantForms.map((form, index) => (
    <div key={index} className="border p-4 mb-6 rounded shadow relative">
      {/* Nút xoá */}
      <button
        type="button"
        onClick={() => removeVariantForm(index)}
        className="absolute top-2 right-2 text-red-500 font-bold text-xl"
        title="Xóa biến thể"
      >
        &times;
      </button>

      <CartVarian
        sku={form.sku}
        setSku={(value) => handleChange(index, "sku", value)}
        price={form.price}
        setPrice={(value) => handleChange(index, "price", value)}
        stock={form.stock}
        setStock={(value) => handleChange(index, "stock", value)}
        errors={form.errors}
        attributes={form.attributes}
        setAttributes={(attrs) => handleChange(index, "attributes", attrs)}
        allAttributes={allAttributes}
        handleAttributeChange={(attrIndex, field, value) =>
          handleAttributeChange(index, attrIndex, field, value)
        }
        removeAttributeRow={(attrIndex) =>
          removeAttributeRow(index, attrIndex)
        }
        addAttributeRow={() => addAttributeRow(index)}
        images={form.images}
        setImages={(imgs) => handleSetImages(index, imgs)}
      />
    </div>
  ))}

  {/* Nút thêm biến thể nằm dưới cùng */}
  <button
    type="button"
    onClick={addVariantForm}
    className="w-full bg-blue-600 text-white px-4 py-2 rounded mb-4"
  >
    + Thêm biến thể
  </button>
</div>

  );
}
