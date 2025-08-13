import { useNavigate } from "react-router-dom";

export default function BrandSection({ className, sectionTitle, type, brands = [] }) {
  const navigate = useNavigate();

  const handleClick = (brandId) => {
    navigate("/all-products", { state: { brandId } });
  };

  return (
    <div data-aos="fade-up" className={`w-full ${className || ""}`}>
      <div className="container-x mx-auto">
        <div className="grid lg:grid-cols-5 sm:grid-cols-4 grid-cols-2 gap-1">
          {brands.map((brand) => (
            <div
              className="item cursor-pointer"
              key={brand.id}
              onClick={() => handleClick(brand.id)}
            >
              <div className="w-full h-[130px] bg-white border border-primarygray flex justify-center items-center">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
