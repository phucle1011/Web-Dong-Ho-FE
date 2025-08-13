import datas from "../../../data/products.json";
import SectionStyleFour from "../Helpers/SectionStyleFour";
import SectionStyleThree from "../Helpers/SectionStyleThree";
import SectionStyleTwo from "../Helpers/SectionStyleTwo";
import ViewMoreTitle from "../Helpers/ViewMoreTitle";
import Banner from "./Banner";
import BrandSection from "./BrandSection";
import CampaignCountDown from "./CampaignCountDown";
import ProductsAds from "./ProductsAds";
import LayoutHomeThree from "../Partials/LayoutHomeThree";
import SectionStyleOneHmThree from "../Helpers/SectionStyleOneHmThree";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Constants from "../../../Constants";

export default function HomeThree() {
  const { products } = datas;
  const brands = [];
  products.forEach((product) => {
    brands.push(product.brand);
  });
  const [productNew, setProductnew] = useState([]);
  const [productSold, setProductTopsold] = useState([]);
  const [productDiscounted, setProductTopDiscounted] = useState([]);
  const [topBrands, setTopBrands] = useState([]);
  const [flashSaleDate, setFlashSaleDate] = useState(null);
const [flashSaleNotification, setFlashSaleNotification] = useState(null);
const [flashSales, setFlashSales] = useState([]);


  const [loading, setLoading] = useState(true);

  // Tạo danh sách thương hiệu từ products


useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [newRes, topSoldRes, topDiscounted, topBrandsRes] = await Promise.all([
        axios.get(`${Constants.DOMAIN_API}/products/getallnew`),
        axios.get(`${Constants.DOMAIN_API}/top-sold-products`),
        axios.get(`${Constants.DOMAIN_API}/top-discounted-products`),
        axios.get(`${Constants.DOMAIN_API}/brands/top`),
      ]);

      setProductnew(newRes.data.data || []);
      setProductTopsold(topSoldRes.data || []);
      setProductTopDiscounted(topDiscounted.data || []);
      setTopBrands(topBrandsRes.data.data || []);

      const flashSaleRes = await axios.get(`${Constants.DOMAIN_API}/client/flashSale`);
      const flashSalesData = flashSaleRes.data?.data || [];
      setFlashSales(flashSalesData); // ✅ gán mảng đầy đủ

    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);



  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <>
      <LayoutHomeThree type={3} childrenClasses="pt-0">
        <Banner className="banner-wrapper mb-[60px]" />
        <BrandSection
          type={3}
          sectionTitle="Shop by Brand"
          className="brand-section-wrapper mb-[60px]"
          brands={topBrands} // 👈 truyền data brand vào props
        />

                <CampaignCountDown flashSales={flashSales} className="mb-[60px]" />


        <SectionStyleThree
          type={3}
          products={productNew}
          sectionTitle="SẢN PHẨM MỚI "
          seeMoreUrl="/all-products"
          className="new-products mb-[60px]"
          startLength={0}
          endLength={productNew.length}
        />
        <ProductsAds
          ads={[
            `https://res.cloudinary.com/disgf4yl7/image/upload/v1752939868/mquyniqauymcrkktt6wq.jpg`,
          ]}
          className="products-ads-section mb-[60px]"
        />

        <SectionStyleOneHmThree
          type={3}
          products={productSold}
          brands={brands}
          categoryTitle="Mobile & Tablet"
          sectionTitle="SẢN PHẨM BÁN CHẠY"
          seeMoreUrl="/all-products"
          className="category-products mb-[60px]"
        />

        {/* <ViewMoreTitle
          className="top-selling-product mb-[60px]"
          seeMoreUrl="/al  l-products"
          categoryTitle="Top Selling Products"
        >
          <SectionStyleTwo
            type={3}
            products={productNew.slice(3, productNew.length)}
          />
        </ViewMoreTitle> */}

        <ProductsAds
          ads={[
            `https://res.cloudinary.com/disgf4yl7/image/upload/v1752939639/aznurov8sarxfem0ojzx.jpg`,
            `https://res.cloudinary.com/disgf4yl7/image/upload/v1752939816/zunyjqffvb2s8lcwc9tp.jpg`,
          ]}
          sectionHeight="sm:h-[295px] h-full"
          className="products-ads-section mb-[60px]"
        />
        <SectionStyleOneHmThree
          type={3}
          // categoryBackground={`${process.env.REACT_APP_PUBLIC_URL}/assets/images/section-category-2.jpg`}
          products={productDiscounted}
          brands={brands}
          categoryTitle="Electronics"
          sectionTitle="SẢN PHẨM GIẢM GIÁ"
          seeMoreUrl="/all-products"
          className="category-products mb-[60px]"
        />




        {/* <SectionStyleFour
          products={productSold} 
          sectionTitle="Popular Sales"
          seeMoreUrl="/all-products"
          className="category-products mb-[60px]"
        /> */}
      </LayoutHomeThree>
    </>
  );
}
