// FE\src\pages\client\Helpers\SearchBox\index.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import { BlockPicker } from "react-color";
import Select from "react-select";
import { useNavigate, useLocation } from "react-router-dom";

export default function SearchBox({ className, onSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState("");

  // GIỮ NGUYÊN: fallback theo giá trị đã biết
  const [sizes, setSizes] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [waters, setWaters] = useState([]);
  const [colors, setColors] = useState([]);

  const [loadingAttrs, setLoadingAttrs] = useState(true);
  const [attrError, setAttrError] = useState(null);

  // Popover từ NÚT MÀU (chứa luôn chọn thuộc tính)
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Thuộc tính & giá trị
  const [allAttributes, setAllAttributes] = useState([]);            // [{value:id, label:name}]
  const [selectedAttributes, setSelectedAttributes] = useState([]);  // [{value,label}]
  const [valuesByAttr, setValuesByAttr] = useState({});              // { [attrId]: [{value,label}] }
  const [selectedValuesByAttr, setSelectedValuesByAttr] = useState({}); // { [attrId]: string[] }

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          sizeRes,
          originRes,
          materialRes,
          waterRes,
          colorRes,
          attributesRes,
        ] = await Promise.all([
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, { params: { attribute_id: 31, page: 1, limit: 100 } }),
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, { params: { attribute_id: 26, page: 1, limit: 100 } }),
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, { params: { attribute_id: 32, page: 1, limit: 100 } }),
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, { params: { attribute_id: 33, page: 1, limit: 100 } }),
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, { params: { attribute_id: 35, page: 1, limit: 100 } }),
          axios.get(`${Constants.DOMAIN_API}/product-attributes`),
        ]);

        setSizes(sizeRes.data.data.map(v => v.value.toLowerCase()));
        setOrigins(originRes.data.data.map(v => v.value.toLowerCase()));
        setMaterials(materialRes.data.data.map(v => v.value.toLowerCase()));
        setWaters(waterRes.data.data.map(v => v.value.toLowerCase()));
        setColors(
          colorRes.data.data
            .filter(v => /^#([0-9A-Fa-f]{6})$/.test(v.value))
            .map(v => v.value.toLowerCase())
        );

        const attrs = (attributesRes.data?.data || []).map(a => ({ value: a.id, label: a.name }));
        setAllAttributes(attrs);
      } catch (err) {
        console.error("Error fetching attribute-values", err);
        setAttrError("Không lấy được danh sách giá trị thuộc tính.");
      } finally {
        setLoadingAttrs(false);
      }
    };
    fetchAll();
  }, []);

  // Tải options giá trị cho từng thuộc tính
  const ensureValuesLoaded = async (attrIds) => {
    const missings = attrIds.filter(id => !valuesByAttr[id]);
    if (missings.length === 0) return;

    try {
      const results = await Promise.all(
        missings.map(id =>
          axios.get(`${Constants.DOMAIN_API}/attribute-values`, {
            params: { attribute_id: id, page: 1, limit: 200 },
          })
        )
      );
      const next = { ...valuesByAttr };
      missings.forEach((id, idx) => {
        const rows = results[idx].data?.data || [];
        const options = rows
          .map(r => String(r.value).toLowerCase())
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .map(v => ({ value: v, label: v }));
        next[id] = options;
      });
      setValuesByAttr(next);
    } catch (e) {
      console.error("Load attribute values error", e);
    }
  };

  const onChangeAttributes = async (list) => {
    setSelectedAttributes(list || []);
    const ids = (list || []).map(x => x.value);
    await ensureValuesLoaded(ids);
    setSelectedValuesByAttr(prev => {
      const next = {};
      ids.forEach(id => { next[id] = prev[id] || []; });
      return next;
    });
  };

  const onChangeAttrValues = (attrId, valueOptions) => {
    setSelectedValuesByAttr(prev => ({
      ...prev,
      [attrId]: (valueOptions || []).map(o => o.value),
    }));
  };

  const clearAttributeFilters = () => {
    setSelectedAttributes([]);
    setSelectedValuesByAttr({});
  };

  // Chọn màu -> set keyword = hex
  const pickColor = (c) => setKeyword(c.hex);

  // Tạo data submit từ map đã chọn
  const pickedAttrIds = useMemo(
    () =>
      Object.entries(selectedValuesByAttr)
        .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
        .map(([k]) => Number(k)),
    [selectedValuesByAttr]
  );
  const pickedAttrValues = useMemo(
    () =>
      Object.values(selectedValuesByAttr)
        .flat()
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i),
    [selectedValuesByAttr]
  );

  const showCircle = /^#([0-9A-Fa-f]{6})$/.test(keyword.trim());

  // Submit
  const handleSubmit = (e) => {
    e?.preventDefault?.();

    const hasPickedAttr = pickedAttrIds.length > 0 && pickedAttrValues.length > 0;
    const t = keyword.trim().toLowerCase();

    // Nếu trống hết → xóa query URL + báo onSearch rỗng
    if (!hasPickedAttr && !t) {
      if (location.search) navigate(location.pathname, { replace: true });
      onSearch?.({ keyword: "", attributeValues: [], attributeIds: [] });
      setIsPanelOpen(false);
      return;
    }

    // ƯU TIÊN 1: có thuộc tính + giá trị
    if (hasPickedAttr) {
      onSearch?.({
        keyword: "",
        attributeValues: pickedAttrValues,
        attributeIds: pickedAttrIds,
      });
      setIsPanelOpen(false);
      return;
    }

    // ƯU TIÊN 2: fallback theo keyword (bao gồm #hex)
    const params = { keyword: "", attributeValues: [], attributeIds: [] };
    if (sizes.includes(t)) {
      params.attributeIds = [31];
      params.attributeValues = [t];
    } else if (colors.includes(t)) {
      params.attributeIds = [35];
      params.attributeValues = [t];
    } else if (origins.includes(t)) {
      params.attributeIds = [26];
      params.attributeValues = [t];
    } else if (materials.includes(t)) {
      params.attributeIds = [32];
      params.attributeValues = [t];
    } else if (waters.includes(t)) {
      params.attributeIds = [33];
      params.attributeValues = [t];
    } else {
      params.keyword = t;
    }
    onSearch?.(params);
    setIsPanelOpen(false);
  };

  // Nhỏ gọn react-select
  const smallSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 32,
      height: 32,
      borderColor: "#e5e7eb",
      boxShadow: "none",
    }),
    valueContainer: (base) => ({ ...base, padding: "0 6px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: 32 }),
    multiValue: (base) => ({ ...base, padding: "0 2px" }),
    menu: (base) => ({ ...base, zIndex: 60 }),
  };

  return (
    <div className={`w-full flex items-center border bg-white rounded-md ${className || ""}`}>
      {/* Nút TRÒN chọn màu (mở panel chứa Màu + Thuộc tính) */}
      <div className="relative px-2">
        <button
          type="button"
          onClick={() => setIsPanelOpen(o => !o)}
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: showCircle ? keyword : "transparent" }}
          title="Chọn màu & thuộc tính"
        />
        {isPanelOpen && (
          <>
            <div className="absolute left-0 mt-1 p-3 bg-white border rounded shadow z-50 w-[360px] max-w-[92vw]">
              {/* Thuộc tính */}
              <div className="mb-3">
                <div className="text-xs font-small mb-1">Thuộc tính</div>
                <Select
                  classNamePrefix="attr-select"
                  placeholder="Chọn tên thuộc tính…"
                  options={allAttributes}
                  isMulti
                  value={selectedAttributes}
                  onChange={onChangeAttributes}
                  isDisabled={loadingAttrs}
                  styles={smallSelectStyles}
                />
                {selectedAttributes.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {selectedAttributes.map((attr) => {
                      const attrId = attr.value;
                      const valueOptions = valuesByAttr[attrId] || [];
                      const selectedVals = (selectedValuesByAttr[attrId] || []).map(v => ({ value: v, label: v }));
                      return (
                        <div key={attrId} className="flex items-center gap-2">
                          <span className="text-xs min-w-24 truncate">{attr.label}:</span>
                          <div className="flex-1">
                            <Select
                              classNamePrefix="attr-values"
                              placeholder={`Giá trị ${attr.label}`}
                              options={valueOptions}
                              isMulti
                              value={selectedVals}
                              onChange={(vals) => onChangeAttrValues(attrId, vals)}
                              isDisabled={loadingAttrs}
                              styles={smallSelectStyles}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={clearAttributeFilters}
                        className="px-2.5 py-1 text-xs border rounded"
                      >
                        Xóa thuộc tính
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-3 py-1.5 text-xs bg-qh3-blue hover:bg-blue-700 text-white rounded"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Màu sắc */}
              <div>
                <div className="text-xs font-medium mb-1">Màu sắc</div>
                {colors.length > 0 ? (
                  <BlockPicker colors={colors} triangle="hide" onChangeComplete={pickColor} />
                ) : (
                  <p className="text-xs text-red-600">{attrError || "Đang tải màu..."}</p>
                )}
                {showCircle && (
                  <button
                    type="button"
                    className="mt-2 text-xs underline"
                    onClick={() => setKeyword("")}
                  >
                    Xóa màu
                  </button>
                )}
              </div>
            </div>

            {/* click-away */}
            <div className="fixed inset-0 z-40" onClick={() => setIsPanelOpen(false)} />
          </>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-1 relative">
        {showCircle && (
          <div
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border"
            style={{ backgroundColor: keyword }}
          />
        )}
        <input
          type="text"
          className="w-full px-4 py-2 text-sm focus:outline-none"
          placeholder="Tìm size, màu, xuất xứ, chất liệu, kháng nước… hoặc theo tên"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ paddingLeft: showCircle ? 36 : undefined }}
        />
      </form>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="ml-2 px-4 py-2 text-sm bg-qh3-blue hover:bg-blue-700 text-white rounded-md transition-colors"
        disabled={loadingAttrs}
      >
        Tìm kiếm
      </button>
    </div>
  );
}
