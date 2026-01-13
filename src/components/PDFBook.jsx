import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page as ReactPdfPage, pdfjs } from "react-pdf";

// Worker setup - Cách tốt nhất cho Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import Header from "./Header";
import Footer from "./Footer";
import { useMediaQuery } from "react-responsive";
import VideoPlayer from "./VideoPlayer";

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

PDFPage.displayName = 'PDFPage';

const PDFBook = () => {
  const bookRef = useRef(null);
  const containerRef = useRef(null);
  const videoPlayerRef = useRef(null);

  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // Kích thước responsive với zoom
  const baseWidth = isMobile ? window.innerWidth - 40 : 600;
  const pageWidth = baseWidth * zoom;
  const pageHeight = pageWidth * 1.414; // Tỷ lệ A4 ≈ 1.414

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
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PDF FlipBook',
          text: 'Xem cuốn sách tuyệt vời này!',
          url: window.location.href,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link đã được copy vào clipboard!');
    }
  }, []);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/pdf/sp1.pdf';
    link.download = 'flipbook.pdf';
    link.click();
  }, []);

  // Audio mute handler - pass to VideoPlayer
  const handleToggleMute = useCallback(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.toggleMute();
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((action) => {
    if (!bookRef.current) return;
    const pageFlip = bookRef.current.pageFlip();

    if (action === "first") pageFlip.flip(0);
    else if (action === "last") pageFlip.flip(numPages - 1);
    else if (action === "next") pageFlip.flipNext();
    else if (action === "prev") pageFlip.flipPrev();
  }, [numPages]);

  const handleFlip = useCallback((e) => {
    setCurrentPage(e.data + 1);
  }, []);

  // Pre-render tất cả các trang để tránh DOM manipulation conflict
  const pages = useMemo(() => {
    if (!numPages) return [];

    return Array.from({ length: numPages }, (_, i) => (
      <PDFPage
        key={i}
        pageNumber={i + 1}
        width={pageWidth}
        height={pageHeight}
      />
    ));
  }, [numPages, pageWidth, pageHeight]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen flex flex-col bg-[#0e1a26] ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&display=swap");
        * { font-family: "Bricolage Grotesque", sans-serif; }

        /* Hide scrollbar for all browsers */
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        *::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        body, html {
          overflow: hidden;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .flipbook, .flipbook * {
            visibility: visible;
          }
          .flipbook {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>

      <Header />

      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <Document
          file="/pdf/sp1.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
          loading={
            <div className="text-white text-xl animate-pulse">
              Đang tải PDF, vui lòng chờ...
            </div>
          }
          error={
            <div className="text-red-500 text-xl">
              Không tải được PDF! Kiểm tra đường dẫn hoặc file.
            </div>
          }
        >
          {numPages && (
            <HTMLFlipBook
              ref={bookRef}
              size={isMobile ? "stretch" : "fixed"}
              width={pageWidth}
              height={pageHeight}
              minWidth={isMobile ? pageWidth : 280}
              maxWidth={isMobile ? pageWidth : 800}
              minHeight={pageHeight}
              maxHeight={pageHeight * 1.2}
              maxShadowOpacity={0.5}
              showCover={isMobile ? false : true}
              mobileScrollSupport={true}
              flippingTime={800}
              usePortrait={isMobile ? true : false}
              drawShadow={true}
              onFlip={handleFlip}
              className="flipbook"
              startPage={0}
            >
              {pages}
            </HTMLFlipBook>
          )}
        </Document>
      </div>

      {/* <VideoPlayer
        ref={videoPlayerRef}
        videoUrl="https://www.youtube.com/watch?v=j3xpL5hSKQc&list=RDj3xpL5hSKQc&start_radio=1"
      /> */}

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
      />
    </div>
  );
};

export default PDFBook;
