import { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import Header from "./Header";
import Footer from "./Footer";
import { useMediaQuery } from "react-responsive";
import VideoPlayer from "./VideoPlayer";

function Book() {
  const bookRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const imageUrls = Array.from({ length: 7 }, (_, i) => `/test/${i + 1}.jpg`);
  const totalPages = imageUrls.length + 1;

  const handlePageChange = (action) => {
    if (!bookRef.current) return;

    if (action === "first") {
      bookRef.current.pageFlip().flip(0);
    } else if (action === "last") {
      bookRef.current.pageFlip().flip(totalPages - 1);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#0e1a26]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&display=swap");
        * {
          font-family: "Bricolage Grotesque", sans-serif;
        }
      `}</style>

      <Header />

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <HTMLFlipBook
          ref={bookRef}
          size= {isMobile ? "stretch" : "fixed"}
          minWidth={295}
          width={590} // Tùy chỉnh theo ý bạn
          minHeight={413}
          height={826}
          maxShadowOpacity={0.6}
          drawShadow={true}
          showCover={true}
          onFlip={(e) => setCurrentPage(e.data + 1)}
        >
          {/* Cover Page */}
          <div className="bg-linear-to-br from-red-600 to-red-800 rounded-md shadow-lg">
            <div className="w-full h-full flex flex-col justify-center items-center  text-center">
              <img
                src={imageUrls[0]}
                alt="Pokémon Logo"
                className="w-full h-full drop-shadow-lg"
              />
             
            </div>
          </div>

          {/* Pokemon Pages */}
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="bg-linear-to-br from-white to-gray-100 rounded-md shadow-lg"
            >
              <div className="w-full h-full flex flex-col justify-center items-center  text-center">
                <img
                  src={url}
                  alt={`Pokemon ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </HTMLFlipBook>
      </div>

          <VideoPlayer videoUrl="https://www.youtube.com/watch?v=j3xpL5hSKQc&list=RDj3xpL5hSKQc&start_radio=1" />

      <Footer
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default Book;
