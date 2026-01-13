import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page as ReactPdfPage, pdfjs } from "react-pdf";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Worker setup
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import Header from "./Header";
import Footer from "./Footer";
import { useMediaQuery } from "react-responsive";

// Component trang PDF - Tách ra ngoài để tránh re-render
const PDFPage = React.memo(
  React.forwardRef(({ pageNumber, width, height }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white shadow-2xl rounded-sm overflow-hidden"
        style={{ width, height }}
      >
        <ReactPdfPage
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          renderMode="canvas"
          scale={1}
        />
      </div>
    );
  })
);

PDFPage.displayName = "PDFPage";

const PDFBook = () => {
  const bookRef = useRef(null);
  const containerRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const transformRef = useRef(null);
  const mouseDownTimeRef = useRef(null);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isTablet = useMediaQuery({ query: "(min-width: 769px) and (max-width: 1024px)" });

  // Kích thước responsive thông minh cho mọi màn hình
  const getResponsiveSize = useCallback(() => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Trừ đi padding và space cho header/footer
    const availableWidth = containerWidth - (isMobile ? 40 : 80);
    const availableHeight = containerHeight - (isMobile ? 200 : 250);
    
    // Tính toán dựa trên tỷ lệ A4 (1:1.414)
    let width, height;
    
    if (isMobile) {
      // Mobile: ưu tiên chiều rộng
      width = availableWidth;
      height = width * 1.414;
      
      // Nếu quá cao, scale lại theo chiều cao
      if (height > availableHeight) {
        height = availableHeight;
        width = height / 1.414;
      }
    } else if (isTablet) {
      // Tablet: cân bằng
      width = Math.min(availableWidth * 0.8, 700);
      height = width * 1.414;
      
      if (height > availableHeight) {
        height = availableHeight * 0.85;
        width = height / 1.414;
      }
    } else {
      // Desktop: tối ưu cho 2 trang
      const doublePageWidth = availableWidth / 2;
      width = Math.min(doublePageWidth * 0.9, 600);
      height = width * 1.414;
      
      if (height > availableHeight * 0.9) {
        height = availableHeight * 0.9;
        width = height / 1.414;
      }
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
  }, [isMobile, isTablet]);

  const [dimensions, setDimensions] = useState(getResponsiveSize());
  const baseWidth = dimensions.width;
  const baseHeight = dimensions.height;

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getResponsiveSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveSize]);
  
  const options = useMemo(
    () => ({
      cMapUrl: "cmaps/",
      cMapPacked: true,
    }),
    []
  );

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PDF FlipBook",
          text: "Xem cuốn sách tuyệt vời này!",
          url: window.location.href,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link đã được copy vào clipboard!");
    }
  }, []);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = "/pdf/sp1.pdf";
    link.download = "flipbook.pdf";
    link.click();
  }, []);

  // Audio mute handler
  const handleToggleMute = useCallback(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.toggleMute();
    }
  }, []);

  const handlePageChange = useCallback(
    (action) => {
      if (!bookRef.current) return;
      const pageFlip = bookRef.current.pageFlip();

      if (action === "first") pageFlip.flip(0);
      else if (action === "last") pageFlip.flip(numPages - 1);
      else if (action === "next") pageFlip.flipNext();
      else if (action === "prev") pageFlip.flipPrev();
    },
    [numPages]
  );

  // ← SỬA: Thay đổi kiểu dữ liệu từ any sang đúng type
  const handleFlip = useCallback((e) => {
    setCurrentPage(e.data + 1);
    // Delay để DOM render xong trang mới rồi center
    setTimeout(() => {
      transformRef.current?.centerView();
    }, 150);
  }, []);

  // Pre-render tất cả các trang
  const pages = useMemo(() => {
    if (!numPages) return [];
    return Array.from({ length: numPages }, (_, i) => (
      <PDFPage
        key={i}
        pageNumber={i + 1}
        width={baseWidth}
        height={baseHeight}
      />
    ));
  }, [numPages, baseWidth, baseHeight]);

  // Handle mouse down - bắt đầu theo dõi
  const handleMouseDown = useCallback((e) => {
    mouseDownTimeRef.current = Date.now();
    mouseDownPosRef.current = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
    setIsDragging(false);
  }, []);

  // Handle mouse move - phát hiện drag
  const handleMouseMove = useCallback((e) => {
    if (mouseDownTimeRef.current) {
      const currentPos = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
      const distance = Math.sqrt(
        Math.pow(currentPos.x - mouseDownPosRef.current.x, 2) +
        Math.pow(currentPos.y - mouseDownPosRef.current.y, 2)
      );
      
      // Nếu di chuyển > 10px thì coi như đang drag
      if (distance > 10) {
        setIsDragging(true);
      }
    }
  }, []);

  // Handle mouse up - quyết định có flip hay không
  const handleMouseUp = useCallback(() => {
    const wasHolding = mouseDownTimeRef.current && (Date.now() - mouseDownTimeRef.current > 200);
    
    // Chỉ cho phép flip nếu KHÔNG phải drag và KHÔNG phải giữ lâu
    if (!isDragging && !wasHolding) {
      // Để flipbook xử lý flip bình thường
    } else {
      // Ngăn không cho flip - cancel event
      if (bookRef.current) {
        const pageFlip = bookRef.current.pageFlip();
        // Quay lại trang hiện tại
        pageFlip.flip(currentPage - 1);
      }
    }
    
    mouseDownTimeRef.current = null;
    setIsDragging(false);
  }, [isDragging, currentPage]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen flex flex-col bg-[#0e1a26] ${
        isFullscreen ? "fullscreen" : ""
      }`}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&display=swap");
        * { font-family: "Bricolage Grotesque", sans-serif; }

        /* Hide scrollbar */
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        *::-webkit-scrollbar {
          display: none;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Responsive container */
        .pdf-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fix cho flipbook - responsive */
        .flipbook {
          max-width: 100% !important;
          max-height: 100% !important;
          margin: 0 auto;
        }

        .flipbook > * {
          max-width: 100% !important;
          max-height: 100% !important;
        }

        /* Landscape mobile fix */
        @media screen and (max-width: 768px) and (orientation: landscape) {
          .flipbook {
            max-height: 85vh !important;
          }
        }

        /* Tablet optimization */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
          .flipbook {
            max-width: 90vw !important;
            max-height: 80vh !important;
          }
        }

        /* Large screen optimization */
        @media screen and (min-width: 1025px) {
          .flipbook {
            max-width: min(1400px, 90vw) !important;
            max-height: 85vh !important;
          }
        }

        /* Ultra-wide screen */
        @media screen and (min-width: 1920px) {
          .flipbook {
            max-width: 1600px !important;
          }
        }

        @media print {
          body * { visibility: hidden; }
          .flipbook, .flipbook * { visibility: visible; }
          .flipbook { position: absolute; left: 0; top: 0; }
        }
      `}</style>

      <Header />

      <div className="flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4 relative">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={isMobile ? 3 : 4}
          limitToBounds={false}
          wheel={{ step: 0.2 }}
          panning={{ velocity: true }}
          doubleClick={{ disabled: true }}
          onZoom={(e) => setZoomLevel(e.state.scale)}
        >
          {() => (
            <>
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!flex !items-center !justify-center pdf-container"
              >
                <div 
                  className="relative"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                >
                  <Document
                    file="/pdf/sp1.pdf"
                    onLoadSuccess={({ numPages }) => {
                      setNumPages(numPages);
                      setCurrentPage(1);
                    }}
                    options={options}
                    loading={<div className="text-white text-xl animate-pulse">Đang tải PDF...</div>}
                    error={<div className="text-red-500 text-xl">Lỗi tải PDF!</div>}
                  >
                    {numPages && (
                      <HTMLFlipBook
                        ref={bookRef}
                        size={isMobile ? "stretch" : "fixed"}
                        width={baseWidth}
                        height={baseHeight}
                        minWidth={isMobile ? baseWidth * 0.8 : 280}
                        maxWidth={isMobile ? baseWidth : isTablet ? 800 : 1200}
                        minHeight={baseHeight * 0.8}
                        maxHeight={baseHeight * 1.2}
                        maxShadowOpacity={0.5}
                        showCover={isMobile ? false : true}
                        mobileScrollSupport={false}
                        flippingTime={800}
                        usePortrait={isMobile}
                        drawShadow={!isMobile}
                        onFlip={handleFlip}
                        className="flipbook shadow-2xl"
                        startPage={0}
                        clickEventForward={!isDragging}
                        autoSize={true}
                        swipeDistance={isMobile ? 50 : 30}
                      >
                        {pages}
                      </HTMLFlipBook>
                    )}
                  </Document>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      <Footer
        currentPage={currentPage}
        totalPages={numPages || 0}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleFullscreen={toggleFullscreen}
        onShare={handleShare}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onToggleMute={handleToggleMute}
        zoomLevel={zoomLevel}
      />
    </div>
  );
};

export default PDFBook;