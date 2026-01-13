import { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import Header from "./Header";
import Footer from "./Footer";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function Book() {
  const bookRef = useRef();
  const transformWrapperRef = useRef(); // Thêm ref cho TransformWrapper
  const [currentPage, setCurrentPage] = useState(1);

  const imageUrls = Array.from({ length: 5 }, (_, i) => `/test/${i + 1}.jpg`);
  const totalPages = imageUrls.length + 1;

  const handlePageChange = (action) => {
    if (!bookRef.current) return;

    if (action === "first") {
      bookRef.current.pageFlip().flip(0);
    } else if (action === "last") {
      bookRef.current.pageFlip().flip(totalPages - 1);
    }
  };

  // Các hàm điều khiển zoom từ bên ngoài (dùng cho Footer)
  const handleZoomIn = () => {
    transformWrapperRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    transformWrapperRef.current?.zoomOut();
  };

  const handleResetZoom = () => {
    transformWrapperRef.current?.resetTransform();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#0e1a26]">
      <style>{`
  @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&display=swap");
  
  * {
    font-family: "Bricolage Grotesque", sans-serif;
  }

  /* === FIX CẮT XÉN KHI ZOOM RA (SCALE < 1) === */
  /* Buộc tất cả parent của pageflip cho phép overflow visible */
  .react-transform-wrapper,
  .react-transform-component,
  .pageflip-container,
  .page-flip__parent,
  .stf__parent,
  .stf__block,
  .page-flip {
    overflow: visible !important;
  }

  /* Các phần tử trang lật và shadow không bị clip */
  .page-flip__page,
  .page-flip__left,
  .page-flip__right,
  .stf__item,
  .page-flip__page__shadow {
    overflow: visible !important;
    transform-style: preserve-3d !important;
  }

  /* Tăng z-index và backface để shadow hiển thị đúng */
  .page-flip__page {
    backface-visibility: visible !important;
  }

  /* Fix cho folding page khi scale nhỏ */
  .page-flip--flipping .page-flip__page {
    overflow: visible !important;
  }

  /* Optional: Làm shadow mềm hơn khi zoom */
  .page-flip__page__shadow {
    box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
  }
      `}</style>

      <Header />

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-visible relative">
          {" "}
          {/* Thêm overflow-visible ở đây nữa */}
          <TransformWrapper
            ref={transformWrapperRef}
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            centerOnInit={true}
            limitToBounds={true} // Không cho pan ra ngoài giới hạn
            // === TẮT HẾT CÁC GESTURE ZOOM & PAN ===
            wheel={{ disabled: true }} // Tắt zoom bằng chuột cuộn
            pinch={{ disabled: true }} // Tắt pinch zoom trên mobile
            doubleClick={{ disabled: true }} // Tắt double click reset
            panning={{ disabled: true }} // Tắt kéo (pan) hoàn toàn
            zoomAnimation={{ disabled: false }} // Vẫn giữ animation mượt khi dùng nút
            alignmentAnimation={{ disabled: false }}
          >
            <TransformComponent wrapperClass="pageflip-container overflow-visible">
              <HTMLFlipBook
                ref={bookRef}
                width={922}
                height={1291}
                size="fixed"
                maxShadowOpacity={0.6}
                drawShadow={true}
                showCover={true}
                flippingTime={1200} // Tăng thời gian lật để mượt hơn khi zoom
                usePortrait={false}
                mobileScrollSupport={false}
                onFlip={(e) => setCurrentPage(e.data + 1)}
                className="origin-center" // Đảm bảo scale từ tâm
              >
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="bg-linear-to-br from-white to-gray-100 rounded-md shadow-lg"
                  >
                    <div className="w-full h-full flex items-center justify-center p-1 bg-green-950">
                      <img
                        src={url}
                        alt={`Pokemon ${index + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                      />
                    </div>
                  </div>
                ))}
              </HTMLFlipBook>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      <Footer
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom} // Nếu muốn thêm nút reset
      />
    </div>
  );
}

export default Book;
