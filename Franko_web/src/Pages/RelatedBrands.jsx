import { useRef, useState, useEffect } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { debounce } from 'lodash';  // Import debounce from lodash

const RelatedBrands = ({ filteredBrands, selectedBrandId, navigate }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Debounced version of checkScrollPosition
  const checkScrollPosition = debounce(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      const hasScroll = scrollElement.scrollWidth > scrollElement.offsetWidth;
      setShowLeftArrow(scrollElement.scrollLeft > 0);
      setShowRightArrow(
        hasScroll &&
        scrollElement.scrollLeft + scrollElement.offsetWidth < scrollElement.scrollWidth
      );
    }
  }, 200);  // Adjust debounce time if needed

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (scrollElement) {
      checkScrollPosition();
      scrollElement.addEventListener('scroll', checkScrollPosition);
    }

    const handleResize = () => {
      checkScrollPosition();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-sm md:text-md font-semibold text-green-700">Related Brands</h3>
      <div className="relative flex items-center">
        {showLeftArrow && (
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            onClick={scrollLeft}
            className="absolute left-0 z-10 bg-green-500 text-white hover:bg-gray-300"
            aria-label="Scroll left"
          />
        )}
        <div
          ref={scrollRef}
          className="flex space-x-4 p-4 py-2 overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            overflowX: 'scroll',
          }}
        >
          {filteredBrands
  .filter(
    (brand) => 
      brand.brandName !== 'Combo productsssss' && 
      brand.brandName !== 'Combo productsssss'
  )
  .map((brand) => (
    <div
      key={brand.brandId}
      className={`${
        brand.brandId === selectedBrandId
          ? 'bg-red-500 text-white'
          : 'bg-gray-200 text-gray-700'
      } py-3 rounded-full text-sm cursor-pointer break-words text-center`}
      style={{ minWidth: '200px' }}
      onClick={() => navigate(`/brand/${brand.brandId}`)}
      role="button"
      aria-label={`Go to ${brand.brandName}`}
    >
      {brand.brandName}
    </div>
  ))}

        </div>
        {showRightArrow && (
          <Button
            shape="circle"
            icon={<RightOutlined />}
            onClick={scrollRight}
            className="absolute right-0 z-10 bg-green-500 text-white hover:bg-gray-300"
            aria-label="Scroll right"
          />
        )}
      </div>
    </div>
  );
};

export default RelatedBrands;
